import { supabase } from './supabase-auth.js';

function fmtDate(d){ if (!d) return 'TBD'; return new Date(d).toLocaleString(); }

document.addEventListener('DOMContentLoaded', async ()=>{
  const params = new URLSearchParams(location.search);
  const attemptId = params.get('id');
  const quizId = params.get('quiz_id');
  const quizTitleEl = document.getElementById('quizTitle');
  const quizMeta = document.getElementById('quizMeta');
  const scoreBox = document.getElementById('scoreBox');
  const percentBox = document.getElementById('percentBox');
  const attemptSummary = document.getElementById('attemptSummary');
  const questionList = document.getElementById('questionList');
  const topAttempts = document.getElementById('topAttempts');

  try{
    let attempt = null;
    if (attemptId){
      const { data, error } = await supabase.from('quiz_attempts').select('*').eq('id', attemptId).maybeSingle();
      if (error) throw error;
      attempt = data;
    }

    // If no attempt id given, but quiz_id provided and signed in, load latest attempt for user
    if (!attempt && quizId){
      const ures = await supabase.auth.getUser();
      const user = ures?.data?.user || ures?.user;
      if (user){
        const { data, error } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).eq('user_id', user.id).order('completed_at',{ascending:false}).limit(1).maybeSingle();
        if (error) throw error;
        attempt = data || null;
      }
    }

    // If we still have no attempt, and quiz_id exists, show aggregated stats only
    let quiz = null;
    if (quizId){ const { data: q } = await supabase.from('quizzes').select('*').eq('id', quizId).maybeSingle(); quiz = q; }
    if (!quiz && attempt){ const { data: q } = await supabase.from('quizzes').select('*').eq('id', attempt.quiz_id).maybeSingle(); quiz = q; }

    quizTitleEl.textContent = (quiz && quiz.title) ? (`Results — ${quiz.title}`) : 'Quiz Results';

    if (attempt){
      quizMeta.textContent = `Attempt by ${attempt.user_id} • Started: ${fmtDate(attempt.started_at)} • Completed: ${fmtDate(attempt.completed_at)}`;
      scoreBox.textContent = attempt.score != null ? attempt.score : '—';
      percentBox.textContent = attempt.percentage != null ? (attempt.percentage + '%') : '';

      // load responses and questions
      const { data: responses } = await supabase.from('quiz_responses').select('*').eq('attempt_id', attempt.id).order('answered_at',{ascending:true});
      const qIds = responses.map(r=>r.question_id).filter(Boolean);
      const { data: questions } = await supabase.from('quiz_questions').select('*').in('id', qIds).order('question_order',{ascending:true});
      const { data: options } = await supabase.from('quiz_options').select('*').in('question_id', qIds);

      // map options
      const optionsByQ = {};
      (options || []).forEach(o=>{ optionsByQ[o.question_id] = optionsByQ[o.question_id]||[]; optionsByQ[o.question_id].push(o); });

      questionList.innerHTML = '';
      for (const q of (questions || [])){
        const resp = (responses || []).find(r=>r.question_id === q.id) || {};
        const opts = optionsByQ[q.id] || [];
        const correctOpt = opts.find(o=>o.is_correct);
        const userOpt = opts.find(o=>o.id === resp.selected_option_id);
        const correct = resp.is_correct === true;
        const wrapper = document.createElement('div'); wrapper.className = 'p-3 border rounded';
        let html = `<div class="font-semibold">Q: ${q.question_text}</div>`;
        if (q.question_type === 'multiple_choice' || q.question_type === 'true_false'){
          html += '<div class="mt-2 space-y-1">';
          opts.forEach(o=>{
            const mark = (o.id === (userOpt && userOpt.id)) ? '▣' : '☐';
            const cls = o.is_correct ? 'text-green-600' : 'text-gray-700';
            html += `<div class="text-sm ${cls}">${mark} ${o.option_text}</div>`;
          });
          html += '</div>';
          html += `<div class="mt-2 text-xs text-gray-600">Your answer: ${userOpt ? userOpt.option_text : 'No answer'}. ${correct ? '<span class="text-green-600">Correct</span>' : '<span class="text-red-600">Incorrect</span>'}</div>`;
        } else {
          html += `<div class="mt-2 text-sm text-gray-700">Response: ${resp.response_text || '<i>No response</i>'}</div>`;
        }
        wrapper.innerHTML = html;
        questionList.appendChild(wrapper);
      }

      attemptSummary.innerHTML = `Score: <strong>${attempt.score || 0}</strong> / ${attempt.max_score || '—'} • Percentage: <strong>${attempt.percentage || 0}%</strong>`;
    } else {
      attemptSummary.innerHTML = 'No attempt found for the current user. Showing quiz summary.';
      scoreBox.textContent = '—'; percentBox.textContent = '';
    }

    // Top attempts for this quiz
    const qid = quizId || (attempt && attempt.quiz_id);
    if (qid){
      const { data: top, error: tErr } = await supabase.from('quiz_attempts').select('id,user_id,score,percentage,completed_at').eq('quiz_id', qid).order('percentage',{ascending:false}).limit(10);
      if (tErr) throw tErr;
      topAttempts.innerHTML = '';
      (top || []).forEach((a, idx)=>{
        const div = document.createElement('div'); div.className='p-2 border-b';
        div.innerHTML = `<div class="flex items-center justify-between"><div class="text-sm">#${idx+1} — ${a.user_id}</div><div class="text-sm font-semibold">${a.percentage != null ? a.percentage+'%':'—'}</div></div>`;
        topAttempts.appendChild(div);
      });
    } else {
      topAttempts.innerHTML = '<div class="text-sm text-gray-600">No quiz selected.</div>';
    }

  }catch(e){ console.error('quizresults', e); document.getElementById('questionList').innerHTML = '<div class="text-red-600 p-4">Failed to load results.</div>'; }
});

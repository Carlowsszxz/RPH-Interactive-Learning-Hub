import { supabase } from './supabase-auth.js';

function getInitial(name){
  return (name || '?').charAt(0).toUpperCase();
}

function avatarHtml(url, name){
  if (url) return `<img src="${url}" alt="avatar" class="avatar-img" onerror="this.style.display='none'">`;
  const initial = getInitial(name);
  return `<div class="avatar-initials">${initial}</div>`;
}

function fmtDate(d){ if (!d) return ''; return new Date(d).toLocaleDateString(); }

document.addEventListener('DOMContentLoaded', async ()=>{
  const rowsEl = document.getElementById('leaderRows');
  const lbCount = document.getElementById('lbCount');
  const pageInfo = document.getElementById('pageInfo');
  const myRankEl = document.getElementById('myRank');
  let currentPage = 1; const perPage = 20;

  async function load(){
    const gameType = document.getElementById('filterGameType').value;
    const range = document.getElementById('timeRange').value;
    const search = (document.getElementById('searchPlayer').value || '').toLowerCase();
    const from = (currentPage-1)*perPage;
    try{
      let builder = supabase.from('game_leaderboard').select('*').order('score',{ascending:false}).range(from, from+perPage-1);
      if (gameType) builder = builder.eq('game_type', gameType);
      // time filter
      if (range && range !== 'all'){
        const days = Number(range);
        const since = new Date(Date.now() - days*24*60*60*1000).toISOString();
        builder = builder.gte('last_played_at', since);
      }
      const { data, error } = await builder;
      if (error) throw error;
      const items = data || [];

      // fetch user profiles for items
      const uids = [...new Set(items.map(it=>it.user_id))].filter(Boolean);
      let profiles = [];
      if (uids.length){
        const { data: pData } = await supabase.from('user_profiles').select('id,full_name,avatar_url,student_id').in('id', uids);
        profiles = pData || [];
      }

      rowsEl.innerHTML = '';
      items.forEach((it, idx)=>{
        const rank = from + idx + 1;
        const prof = profiles.find(p=>p.id === it.user_id) || {};
        // search filter
        if (search && !( (prof.full_name||'').toLowerCase().includes(search) || (prof.student_id||'').toLowerCase().includes(search) )) return;
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        const rankClass = rank <= 3 ? 'top-3' : '';
        row.innerHTML = `
          <div class="row-rank ${rankClass}">${rank}</div>
          <div class="row-avatar">${avatarHtml(prof.avatar_url, prof.full_name)}</div>
          <div class="row-player">
            <div class="player-name">${prof.full_name || 'Unknown'}</div>
            ${prof.student_id ? `<div class="player-id">${prof.student_id}</div>` : ''}
          </div>
          <div class="row-game">${it.game_name || it.game_type || 'Game'}</div>
          <div class="row-score">${it.score}</div>
        `;
        rowsEl.appendChild(row);
      });

      lbCount.textContent = items.length;
      pageInfo.textContent = currentPage;

      // my rank
      const ures = await supabase.auth.getUser();
      const user = ures?.data?.user || ures?.user || null;
      if (user){
        // fetch user's leaderboard row for the current game type
        let userQuery = supabase.from('game_leaderboard').select('*').eq('user_id', user.id);
        if (gameType) userQuery = userQuery.eq('game_type', gameType);
        const { data: myRow, error: myErr } = await userQuery.maybeSingle();
        if (myErr) throw myErr;
        if (!myRow){ myRankEl.textContent = 'You have no score yet.'; }
        else {
          // get rank by counting players with score greater than user's score
          const { count } = await supabase.from('game_leaderboard').select('id', { count: 'exact', head: true }).gt('score', myRow.score);
          const myRank = (count || 0) + 1;
          const avatarDiv = myRow.avatar_url ? `<img src="${myRow.avatar_url}" alt="avatar" class="rank-avatar" onerror="this.style.display='none'">` : `<div class="rank-avatar">${getInitial(user.email)}</div>`;
          myRankEl.innerHTML = `${avatarDiv} <strong>${user.email}</strong> — Score: <strong>${myRow.score}</strong> — Rank: <strong>#${myRank}</strong>`;
        }
      } else {
        myRankEl.textContent = 'Sign in to see your rank.';
      }

    }catch(e){ console.error(e); rowsEl.innerHTML = '<div class="error-message">Failed to load leaderboard. Please try again.</div>'; }
  }

  document.getElementById('filterGameType').addEventListener('change', ()=>{ currentPage=1; load(); });
  document.getElementById('timeRange').addEventListener('change', ()=>{ currentPage=1; load(); });
  document.getElementById('searchPlayer').addEventListener('input', ()=>{ currentPage=1; load(); });
  
  document.getElementById('prevPage').addEventListener('click', ()=>{
    if (currentPage>1){
      currentPage--;
      load().then(()=>{ lucide.createIcons(); });
    }
  });
  
  document.getElementById('nextPage').addEventListener('click', ()=>{
    currentPage++;
    load().then(()=>{ lucide.createIcons(); });
  });

  load().then(()=>{ lucide.createIcons(); });
});

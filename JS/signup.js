import { supabase } from './supabase-auth.js';

// Clear all errors
function clearErrors() {
  const inputs = document.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.classList.remove('error');
    const errorId = input.id + 'Error';
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.classList.remove('show');
      errorEl.textContent = '';
    }
  });
  const errorContainer = document.getElementById('errorContainer');
  if (errorContainer) {
    errorContainer.classList.remove('show');
    errorContainer.textContent = '';
  }
}

// Show field error
function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  if (input) input.classList.add('error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
}

// Show general error
function showGeneralError(message) {
  const errorContainer = document.getElementById('errorContainer');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.classList.add('show');
  }
}

document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('signupForm');
  if (!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    clearErrors();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const fullname = `${firstName} ${lastName}`.trim();
    
    const payload = {
      firstName: firstName,
      lastName: lastName,
      fullname: fullname,
      email: document.getElementById('email').value.trim(),
      username: document.getElementById('username').value.trim(),
      studentId: document.getElementById('studentId') ? document.getElementById('studentId').value.trim() : null,
      password: document.getElementById('password').value,
      confirmPassword: document.getElementById('confirmPassword').value,
      role: document.getElementById('role').value,
      terms: document.getElementById('terms').checked
    };
    
    // Client-side validation with field-level errors
    let hasError = false;
    
    if (!payload.firstName) {
      showFieldError('firstName', 'First name is required');
      hasError = true;
    }
    if (!payload.lastName) {
      showFieldError('lastName', 'Last name is required');
      hasError = true;
    }
    if (!payload.email) {
      showFieldError('email', 'Email address is required');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      showFieldError('email', 'Please enter a valid email address');
      hasError = true;
    }
    if (!payload.username) {
      showFieldError('username', 'Username is required');
      hasError = true;
    }
    if (!payload.password) {
      showFieldError('password', 'Password is required');
      hasError = true;
    } else if (payload.password.length < 8) {
      showFieldError('password', 'Password must be at least 8 characters');
      hasError = true;
    }
    if (payload.password !== payload.confirmPassword) {
      showFieldError('confirmPassword', 'Passwords do not match');
      hasError = true;
    }
    if (!payload.role) {
      showFieldError('role', 'Please select a role');
      hasError = true;
    }
    if (!payload.terms) {
      showFieldError('terms', 'You must agree to the terms to sign up');
      hasError = true;
    }
    
    if (hasError) return;

    // Save pending profile so we can finish creating it after email confirmation/sign-in
    try { localStorage.setItem('pendingProfile', JSON.stringify({ firstName: payload.firstName, lastName: payload.lastName, fullname: payload.fullname, username: payload.username, studentId: payload.studentId, email: payload.email, role: payload.role })); } catch(e){/* ignore */}

    // Perform sign up with Supabase
    const signupBtn = document.getElementById('signupBtn');
    signupBtn.disabled = true;
    
    (async () => {
      try {
        const { data, error } = await supabase.auth.signUp({ email: payload.email, password: payload.password });
        if (error) {
          console.error('Sign up error', error);
          signupBtn.disabled = false;
          showGeneralError(error.message || 'Sign up failed');
          return;
        }

        // Try to obtain the created user (may be null if confirmation is required)
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user || data?.user || null;

        if (user && user.id) {
          // Insert a row into user_profiles linking to auth.users(id)
          const profile = {
            id: user.id,
            user_email: payload.email,
            full_name: payload.fullname || null,
            bio: null,
            avatar_url: null,
            username: payload.username || null,
            student_id: payload.studentId || null,
            role: payload.role
          };
          const { error: profileError } = await supabase.from('user_profiles').insert([profile]);
          if (profileError) {
            console.error('Failed to create user_profiles row', profileError);
          }
        }

        // Redirect based on role
        if (payload.role === 'instructor') {
          window.location.href = window.location.origin + '/TEMPLATES/FrameInstructorDashboard.html';
        } else {
          window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
        }
      } catch (err) {
        console.error('Unexpected signup error', err);
        signupBtn.disabled = false;
        showGeneralError('An unexpected error occurred. Check the console.');
      }
    })();
  });

  // After redirect from OAuth: if user exists and is already registered, send them to home.
  // If they are NOT registered, allow them to continue on this signup page (do not block or sign them out).
  async function checkOAuthUserSignup() {
    try {
      // Use getSession to avoid unauthorized calls when no access token exists.
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;
      // Inline check for signup flow (do not import login-only helper)
      const email = (user.email || '').toLowerCase();
      const authId = user.id || '';
      const orFilterParts = [];
      if (email) orFilterParts.push(`user_email.eq.${email}`);
      if (authId) orFilterParts.push(`id.eq.${authId}`);
      const orFilter = orFilterParts.join(',');
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, role')
        .or(orFilter || 'id.eq.null')
        .limit(1);
      if (profileError) {
        console.error('signup profile check error', profileError);
      }
      const registered = Array.isArray(profileData) && profileData.length > 0;
      if (registered) {
        // Already registered — check role and redirect
        const existingProfile = profileData[0];
        if (existingProfile.role === 'instructor') {
          window.location.href = window.location.origin + '/TEMPLATES/FrameInstructorDashboard.html';
        } else {
          window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
        }
      } else {
        // Not registered: attempt to create a user_profiles row automatically
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null;
        const profile = {
          id: user.id,
          user_email: user.email || null,
          full_name: fullName || null,
          bio: null,
          avatar_url: null,
          student_id: null,
          role: user.user_metadata?.role || 'student'
        };
        try {
          const { data: insertData, error: insertError } = await supabase.from('user_profiles').insert([profile]);
          if (insertError) {
            console.error('Failed to insert user_profiles row', insertError);
            // If insertion fails due to RLS or constraints, fall back to prefilling the form
            if (user.email) {
              const emailInput = document.getElementById('email');
              if (emailInput && !emailInput.value) emailInput.value = user.email;
            }
            return;
          }
          // Insert succeeded — redirect based on role
          if (profile.role === 'instructor') {
            window.location.href = window.location.origin + '/TEMPLATES/FrameInstructorDashboard.html';
          } else {
            window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
          }
        } catch (err) {
          console.error('Unexpected error inserting profile', err);
          if (user.email) {
            const emailInput = document.getElementById('email');
            if (emailInput && !emailInput.value) emailInput.value = user.email;
          }
        }
      }
    } catch (err) {
      console.error('checkOAuthUserSignup error', err);
    }
  }

  checkOAuthUserSignup();

  // Listen for auth state changes — create profile after email confirmation + sign-in
  supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (event !== 'SIGNED_IN') return;
      const user = session?.user;
      if (!user) return;

      // Check if profile exists
      const email = (user.email || '').toLowerCase();
      const authId = user.id || '';
      const orFilterParts = [];
      if (email) orFilterParts.push(`user_email.eq.${email}`);
      if (authId) orFilterParts.push(`id.eq.${authId}`);
      const orFilter = orFilterParts.join(',');
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .or(orFilter || 'id.eq.null')
        .limit(1);
      if (profileError) {
        console.error('authState profile check error', profileError);
        return;
      }
      const exists = Array.isArray(profileData) && profileData.length > 0;
      if (exists) return; // nothing to do

      // Try to load pending profile from localStorage
      let pending = null;
      try { pending = JSON.parse(localStorage.getItem('pendingProfile') || 'null'); } catch(e){ pending = null; }

      const profile = {
        id: user.id,
        user_email: user.email || (pending && pending.email) || null,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || (pending && pending.fullname) || null,
        bio: null,
        avatar_url: user.user_metadata?.avatar_url || null,
        username: (pending && pending.username) || null,
        student_id: (pending && pending.studentId) || null,
        role: (pending && pending.role) || 'student'
      };

      const { data: insertData, error: insertError } = await supabase.from('user_profiles').insert([profile]);
      if (insertError) {
        console.error('Failed to insert user_profiles row on auth state', insertError);
        return;
      }
      // Success: clear pending and redirect based on role
      try { localStorage.removeItem('pendingProfile'); } catch(e){}
      if (profile.role === 'instructor') {
        window.location.href = window.location.origin + '/TEMPLATES/FrameInstructorDashboard.html';
      } else {
        window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
      }
    } catch (err) {
      console.error('onAuthStateChange handler error', err);
    }
  });
});

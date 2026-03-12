import { supabase } from './supabase-auth.js';

// Helper: Show alert message
function showAlert(message, type = 'error') {
	const container = document.getElementById('alertContainer');
	if (!container) return;
	
	const alert = document.createElement('div');
	alert.className = `alert-message ${type}`;
	
	// Create icon element
	const iconMap = {
		success: 'check-circle',
		error: 'alert-circle',
		warning: 'alert-triangle'
	};
	
	const iconName = iconMap[type] || 'info';
	const icon = document.createElement('i');
	icon.setAttribute('data-lucide', iconName);
	icon.style.width = '16px';
	icon.style.height = '16px';
	icon.style.marginRight = '8px';
	
	const messageSpan = document.createElement('span');
	messageSpan.textContent = message;
	
	alert.appendChild(icon);
	alert.appendChild(messageSpan);
	container.appendChild(alert);
	
	// Render lucide icons
	if (window.lucide) {
		window.lucide.createIcons();
	}
	
	// Auto-remove after 5 seconds
	setTimeout(() => alert.remove(), 5000);
}

// Helper: Clear all alerts
function clearAlerts() {
	const container = document.getElementById('alertContainer');
	if (container) container.innerHTML = '';
}

// Helper: Calculate password strength
function calculatePasswordStrength(password) {
	if (!password) return 'none';
	let strength = 0;
	if (password.length >= 8) strength++;
	if (password.length >= 12) strength++;
	if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
	if (/\d/.test(password)) strength++;
	if (/[^a-zA-Z\d]/.test(password)) strength++;
	
	if (strength <= 1) return 'weak';
	if (strength <= 3) return 'fair';
	return 'strong';
}

// Helper: Update password strength meter
function updatePasswordStrength(password) {
	const meter = document.getElementById('strengthMeter');
	const fill = document.getElementById('strengthFill');
	const text = document.getElementById('strengthText');
	
	if (!meter || !password) {
		meter?.classList.remove('show');
		return;
	}
	
	const strength = calculatePasswordStrength(password);
	meter.classList.add('show');
	
	fill.classList.remove('weak', 'fair', 'strong');
	fill.classList.add(strength);
	
	const strengthLabels = {
		weak: 'Weak - Add more characters or complexity',
		fair: 'Fair - Mix uppercase, numbers, symbols',
		strong: 'Strong password'
	};
	
	text.textContent = strengthLabels[strength] || '';
}

// Helper: Handle password visibility toggles
function setupPasswordToggles() {
	const passwordInput = document.getElementById('password');
	const confirmInput = document.getElementById('confirmPassword');
	const toggleBtn = document.getElementById('passwordToggle');
	const confirmToggleBtn = document.getElementById('confirmPasswordToggle');
	
	if (toggleBtn && passwordInput) {
		toggleBtn.addEventListener('click', (e) => {
			e.preventDefault();
			const isPassword = passwordInput.type === 'password';
			passwordInput.type = isPassword ? 'text' : 'password';
			
			// Toggle icon
			const icon = toggleBtn.querySelector('i');
			if (icon) {
				icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
				if (window.lucide) {
					window.lucide.createIcons();
				}
			}
		});
		
		// Update strength meter as user types
		passwordInput.addEventListener('input', () => {
			updatePasswordStrength(passwordInput.value);
		});
	}
	
	if (confirmToggleBtn && confirmInput) {
		confirmToggleBtn.addEventListener('click', (e) => {
			e.preventDefault();
			const isPassword = confirmInput.type === 'password';
			confirmInput.type = isPassword ? 'text' : 'password';
			
			// Toggle icon
			const icon = confirmToggleBtn.querySelector('i');
			if (icon) {
				icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
				if (window.lucide) {
					window.lucide.createIcons();
				}
			}
		});
	}
}

document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('signupForm');
  if (!form) return;

  setupPasswordToggles();

  form.addEventListener('submit', function(e){
    e.preventDefault();
    clearAlerts();
    
    const payload = {
      fullname: document.getElementById('fullname').value,
      email: document.getElementById('email').value,
      username: document.getElementById('username').value,
      studentId: document.getElementById('studentId') ? document.getElementById('studentId').value : null,
      password: document.getElementById('password').value,
      confirmPassword: document.getElementById('confirmPassword').value,
      role: document.getElementById('role').value, // Capture the role
      terms: document.getElementById('terms').checked
    };
    
    // Basic client-side validation
    if (!payload.fullname) {
      showAlert('Please enter your full name.', 'error');
      return;
    }
    if (!payload.email) {
      showAlert('Please provide an email address.', 'error');
      return;
    }
    if (!payload.username) {
      showAlert('Please choose a username.', 'error');
      return;
    }
    if (!payload.password) {
      showAlert('Please provide a password.', 'error');
      return;
    }
    if (payload.password !== payload.confirmPassword) {
      showAlert("Passwords don't match.", 'error');
      return;
    }
    if (!payload.terms) {
      showAlert('You must agree to the terms to sign up.', 'error');
      return;
    }

    // Save pending profile so we can finish creating it after email confirmation/sign-in
    try { localStorage.setItem('pendingProfile', JSON.stringify({ fullname: payload.fullname, username: payload.username, studentId: payload.studentId, email: payload.email, role: payload.role })); } catch(e){/* ignore */}

    // Perform sign up with Supabase
    const signupBtn = document.getElementById('signupBtn');
    signupBtn.classList.add('loading');
    signupBtn.disabled = true;
    
    (async () => {
      try {
        const { data, error } = await supabase.auth.signUp({ email: payload.email, password: payload.password });
        if (error) {
          console.error('Sign up error', error);
          signupBtn.classList.remove('loading');
          signupBtn.disabled = false;
          showAlert(error.message || 'Sign up failed', 'error');
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
            role: payload.role // Save the role in the profile
          };
          const { error: profileError } = await supabase.from('user_profiles').insert([profile]);
          if (profileError) {
            console.error('Failed to create user_profiles row', profileError);
            // Not a fatal error for the user; inform for debugging
          }
        } else {
          // If user isn't immediately available (email confirmation flow), inform the user
          showAlert('Registration submitted. Please check your email to confirm your account. Your profile will be created after confirmation.', 'success');
        }

        // Redirect or inform success
        showAlert('Sign up successful. Please check your email to confirm.', 'success');
        
        // Redirect based on role after a delay
        setTimeout(() => {
          if (payload.role === 'instructor') {
            window.location.href = window.location.origin + '/TEMPLATES/FrameInstructorDashboard.html';
          } else {
            window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
          }
        }, 2000);
      } catch (err) {
        console.error('Unexpected signup error', err);
        signupBtn.classList.remove('loading');
        signupBtn.disabled = false;
        showAlert('An unexpected error occurred. Check the console.', 'error');
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

// Initialize password strength meter on page load if password field exists
document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('password');
  if (passwordInput && passwordInput.value) {
    updatePasswordStrength(passwordInput.value);
  }
  
  // Render lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

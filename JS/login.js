import { supabase } from './supabase-auth.js';

// Clear all errors
function clearErrors() {
  const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
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

// Local helper: check whether a user exists in `user_profiles`.
async function isUserRegistered(user) {
	if (!user) return false;
	try {
		const email = (user.email || '').toLowerCase();
		const authId = user.id || '';
		const orFilterParts = [];
		if (email) orFilterParts.push(`user_email.eq.${email}`);
		if (authId) orFilterParts.push(`id.eq.${authId}`);
		const orFilter = orFilterParts.join(',');
		const { data, error } = await supabase
			.from('user_profiles')
			.select('id')
			.or(orFilter || 'id.eq.null')
			.limit(1);
		if (error) {
			console.error('isUserRegistered query error', error);
			return false;
		}
		return Array.isArray(data) && data.length > 0;
	} catch (err) {
		console.error('isUserRegistered unexpected error', err);
		return false;
	}
}

// Handle login with email and password
async function handleLogin(payload) {
	try {
		clearErrors();
		const loginBtn = document.getElementById('loginBtn');
		loginBtn.disabled = true;
		
		console.log('Attempting login with:', payload.username);
		const { data, error } = await supabase.auth.signInWithPassword({
			email: payload.username,
			password: payload.password
		});

		if (error) {
			console.error('Login error:', error.message);
			loginBtn.disabled = false;
			showGeneralError('Login failed: ' + error.message);
			return;
		}

		const user = data?.user;
		if (!user) {
			loginBtn.disabled = false;
			showGeneralError('Login failed: No user returned');
			return;
		}

		console.log('Login successful for:', user.email);

		// Check if user is registered and what their role is
		const registered = await isUserRegistered(user);
		if (!registered) {
			await supabase.auth.signOut();
			loginBtn.disabled = false;
			showGeneralError('Your account is not fully registered. Please contact support.');
			return;
		}

		// Get user's role from user_profiles
		const email = (user.email || '').toLowerCase();
		const { data: profileData, error: profileError } = await supabase
			.from('user_profiles')
			.select('role')
			.eq('user_email', email)
			.single();

		if (profileError) {
			console.error('Error fetching user role:', profileError);
			window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
			return;
		}
		
		// Redirect based on role
		if (profileData?.role === 'instructor') {
			window.location.href = window.location.origin + '/TEMPLATES/FrameInstructorDashboard.html';
		} else {
			window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
		}
	} catch (err) {
		console.error('Unexpected login error:', err);
		const loginBtn = document.getElementById('loginBtn');
		loginBtn.disabled = false;
		showGeneralError('An unexpected error occurred. Please check the console.');
	}
}

document.addEventListener('DOMContentLoaded', function(){
	const form = document.getElementById('loginForm');
	if (!form) return;

	form.addEventListener('submit', function(e){
		e.preventDefault();
		clearErrors();
		
		const username = document.getElementById('username').value.trim();
		const password = document.getElementById('password').value;
		
		let hasError = false;
		
		if (!username) {
			showFieldError('username', 'Email address is required');
			hasError = true;
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
			showFieldError('username', 'Please enter a valid email address');
			hasError = true;
		}
		if (!password) {
			showFieldError('password', 'Password is required');
			hasError = true;
		}
		
		if (hasError) return;
		
		const payload = {
			username: username,
			password: password,
			remember: document.getElementById('remember').checked
		};
		
		handleLogin(payload);
	});

	// After redirect from OAuth, check whether the signed-in user is registered.
	async function checkOAuthUser() {
		try {
			const { data: sessionData } = await supabase.auth.getSession();
			const user = sessionData?.session?.user;
			if (!user) return;

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
				console.error('Profile check error:', profileError);
				window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
				return;
			}

			const registered = Array.isArray(profileData) && profileData.length > 0;
			if (registered) {
				const existingProfile = profileData[0];
				if (existingProfile.role === 'instructor') {
					window.location.href = window.location.origin + '/TEMPLATES/FrameInstructorDashboard.html';
				} else {
					window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
				}
			} else {
				const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null;
				const profile = {
					id: user.id,
					user_email: user.email || null,
					full_name: fullName || null,
					bio: null,
					avatar_url: null,
					student_id: null,
					role: 'student'
				};
				try {
					const { data: insertData, error: insertError } = await supabase.from('user_profiles').insert([profile]);
					if (insertError) {
						console.error('Failed to insert user_profiles row:', insertError);
						window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
						return;
					}
					window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
				} catch (err) {
					console.error('Unexpected error creating profile:', err);
					window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
				}
			}
		} catch (err) {
			console.error('checkOAuthUser error:', err);
			window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
		}
	}

	checkOAuthUser();
});
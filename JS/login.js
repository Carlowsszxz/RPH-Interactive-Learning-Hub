
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

// Helper: Handle password visibility toggle
function setupPasswordToggle() {
	const passwordInput = document.getElementById('password');
	const toggleBtn = document.getElementById('passwordToggle');
	
	if (!toggleBtn) return;
	
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
		clearAlerts();
		const loginBtn = document.getElementById('loginBtn');
		loginBtn.classList.add('loading');
		loginBtn.disabled = true;
		
		console.log('Attempting login with:', payload.username);
		const { data, error } = await supabase.auth.signInWithPassword({
			email: payload.username, // username field contains email
			password: payload.password
		});

		if (error) {
			console.error('Login error:', error.message);
			loginBtn.classList.remove('loading');
			loginBtn.disabled = false;
			showAlert('Login failed: ' + error.message, 'error');
			return;
		}

		const user = data?.user;
		if (!user) {
			loginBtn.classList.remove('loading');
			loginBtn.disabled = false;
			showAlert('Login failed: No user returned', 'error');
			return;
		}

		console.log('Login successful for:', user.email);

		// Check if user is registered and what their role is
		const registered = await isUserRegistered(user);
		if (!registered) {
			await supabase.auth.signOut();
			loginBtn.classList.remove('loading');
			loginBtn.disabled = false;
			showAlert('Your account is not fully registered. Please contact support.', 'error');
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
			// Default to home if we can't fetch the role
			window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
			return;
		}

		showAlert('Login successful! Redirecting...', 'success');
		
		// Redirect based on role
		setTimeout(() => {
			if (profileData?.role === 'instructor') {
				window.location.href = window.location.origin + '/TEMPLATES/FrameInstructorDashboard.html';
			} else {
				window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
			}
		}, 1000);
	} catch (err) {
		console.error('Unexpected login error:', err);
		const loginBtn = document.getElementById('loginBtn');
		loginBtn.classList.remove('loading');
		loginBtn.disabled = false;
		showAlert('An unexpected error occurred. Please check the console.', 'error');
	}
}

document.getElementById('loginForm').addEventListener('submit', function(e){
	e.preventDefault();
	const payload = {
		username: document.getElementById('username').value,
		password: document.getElementById('password').value,
		remember: document.getElementById('remember').checked
	};
	handleLogin(payload);
});

// Google sign in
const googleBtn = document.getElementById('googleSignIn');
if (googleBtn) {
	googleBtn.addEventListener('click', async () => {
		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo: window.location.origin + '/TEMPLATES/FrameLogin.html' }
		});
	});
}

// After redirect from OAuth, check whether the signed-in user is registered.
// If not registered, create their profile automatically
async function checkOAuthUser() {
	try {
		// Prefer getSession to avoid calling auth endpoints without an access token.
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
			// On error, redirect to home anyway
			window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
			return;
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
			// Not registered: create a user_profiles row automatically
			const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null;
			const profile = {
				id: user.id,
				user_email: user.email || null,
				full_name: fullName || null,
				bio: null,
				avatar_url: null,
				student_id: null,
				role: 'student' // Default new OAuth users to student
			};
			try {
				const { data: insertData, error: insertError } = await supabase.from('user_profiles').insert([profile]);
				if (insertError) {
					console.error('Failed to insert user_profiles row:', insertError);
					// Even if insertion fails, redirect to home
					window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
					return;
				}
				// Insert succeeded — redirect to home
				window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
			} catch (err) {
				console.error('Unexpected error creating profile:', err);
				// On any error, still redirect to home
				window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
			}
		}
	} catch (err) {
		console.error('checkOAuthUser error:', err);
		// On error, default redirect to home
		window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
	}
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
	setupPasswordToggle();
	checkOAuthUser();
	
	// Render lucide icons
	if (window.lucide) {
		window.lucide.createIcons();
	}
});
	
import { supabase } from './supabase-auth.js';

document.addEventListener('DOMContentLoaded', async () => {
	try {
		const { data: sessionData } = await supabase.auth.getSession();
		const user = sessionData?.session?.user;
		const currentPage = window.location.pathname;
		
		if (user) {
			// If logged in and on login/signup pages, redirect to home
			if (currentPage.includes('FrameLogin') || currentPage.includes('FrameSignup')) {
				window.location.href = window.location.origin + '/TEMPLATES/FrameHome.html';
			}
			// If logged in and on an authenticated page, allow access (no redirect)
		} else {
			// If not logged in and on an authenticated page, redirect to login
			if (!currentPage.includes('FrameLogin') && !currentPage.includes('FrameSignup')) {
				await supabase.auth.signOut();
				window.location.href = window.location.origin + '/TEMPLATES/FrameLogin.html';
			}
		}
	} catch (err) {
		console.error('auth check error', err);
	}
});


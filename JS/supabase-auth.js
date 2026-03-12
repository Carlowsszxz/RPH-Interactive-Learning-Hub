// Supabase client initialization and simple auth helpers
// Uses ESM build from jsDelivr so this file can be used directly in the browser
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://rhvefggdvhmwftqghnwj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJodmVmZ2dkdmhtd2Z0cWdobndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MjE4MzgsImV4cCI6MjA4ODQ5NzgzOH0.-H7u_-PPnrAjzc-ehb-W4GV2mmNHFDlhVKQreA1HdOU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signUp(email, password) {
	return await supabase.auth.signUp({ email, password });
}

export async function signIn(email, password) {
	return await supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
	return await supabase.auth.signOut();
}

export async function getUser() {
	return await supabase.auth.getUser();
}

export default supabase;



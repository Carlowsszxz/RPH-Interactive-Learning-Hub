// Configuration management for environment-specific settings
// Supports both browser environment variables (window.__ENV__) and direct imports

export const config = {
  supabaseUrl: typeof window !== 'undefined' && window.__ENV__?.VITE_SUPABASE_URL 
    ? window.__ENV__.VITE_SUPABASE_URL 
    : 'https://rhvefggdvhmwftqghnwj.supabase.co',
  
  supabaseAnonKey: typeof window !== 'undefined' && window.__ENV__?.VITE_SUPABASE_ANON_KEY 
    ? window.__ENV__.VITE_SUPABASE_ANON_KEY 
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJodmVmZ2dkdmhtd2Z0cWdobndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MjE4MzgsImV4cCI6MjA4ODQ5NzgzOH0.-H7u_-PPnrAjzc-ehb-W4GV2mmNHFDlhVKQreA1HdOU'
};

// Validate configuration
if (!config.supabaseUrl || !config.supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration is missing or incomplete. Check your environment variables.');
}

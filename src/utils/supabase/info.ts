// Auto-generated Supabase configuration
// These values are provided by the Figma Make environment

// Extract project ID from window location or use environment variable
const getProjectId = (): string => {
  // Try window.location first (Figma Make injects this)
  if (typeof window !== 'undefined' && window.location) {
    const match = window.location.hostname.match(/^([a-z]+)\.supabase\.co$/);
    if (match) return match[1];
  }
  // Fallback to environment variable or the real project ref. This ref is the
  // production Supabase project and is not a secret. Keeping it correct here
  // (rather than a stale demo value) means a CI build with no VITE_* env still
  // ships a working configuration instead of silently pointing at the wrong
  // backend.
  return import.meta.env.VITE_SUPABASE_PROJECT_ID || 'uriirwsjpzsjnaosqlph';
};

const getAnonKey = (): string => {
  // Check if Figma Make has injected the key
  if (typeof window !== 'undefined' && (window as any).__SUPABASE_ANON_KEY__) {
    return (window as any).__SUPABASE_ANON_KEY__;
  }
  // Fallback to environment variable or the real anon (publishable) key. The
  // anon key is designed to be shipped in the browser and is protected by
  // row-level policies / the edge function's own authorization — it is not a
  // secret. Hardcoding the correct key (instead of the supabase-demo default)
  // keeps CI builds working even when no VITE_* env is provided.
  return import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyaWlyd3NqcHpzam5hb3NxbHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTk2MTcsImV4cCI6MjA5MzI5NTYxN30.lGbckNUMhIZcwBHu9I7oyCjYrcduyPA156vJxW1EoK4';
};

export const projectId = getProjectId();
export const publicAnonKey = getAnonKey();

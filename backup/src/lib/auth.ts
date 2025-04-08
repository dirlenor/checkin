import { supabase } from './supabase';

export type AuthError = {
  message: string;
};

export async function signUp(email: string, password: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      return { error: { message: error.message } };
    }

    return { error: null };
  } catch {
    return { error: { message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' } };
  }
}

export async function signIn(email: string, password: string, rememberMe: boolean): Promise<{ error: AuthError | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { error };
    }

    if (rememberMe) {
      localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
    } else {
      sessionStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
      localStorage.removeItem('supabase.auth.token');
    }

    return { error: null };
  } catch {
    return { error: { message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' } };
  }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  localStorage.removeItem('supabase.auth.token');
  sessionStorage.removeItem('supabase.auth.token');
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: { message: error.message } };
  }

  return { error: null };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
} 
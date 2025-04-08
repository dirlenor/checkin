"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LoginForm from '@/components/LoginForm';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // ตรวจสอบ session จาก localStorage ก่อน
      const localSession = localStorage.getItem('supabase.auth.token');
      if (localSession) {
        router.push('/dashboard');
        return;
      }

      // ถ้าไม่มีใน localStorage ให้ตรวจสอบ session ปัจจุบัน
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // ตรวจสอบว่ามีข้อมูล profile หรือไม่
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          router.push('/dashboard');
        } else {
          router.push('/profile');
        }
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-spin text-4xl">
          <i className="fas fa-circle-notch text-text-light"></i>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-white">
      <div className="max-w-5xl mx-auto px-4 py-6 min-h-[100dvh] flex flex-col items-center justify-center">
        <LoginForm />
      </div>
    </main>
  );
}

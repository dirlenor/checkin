"use client";

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email) {
      setError('กรุณากรอกอีเมล');
      return false;
    }
    
    if (!email.includes('@')) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง');
      return false;
    }

    if (!password) {
      setError('กรุณากรอกรหัสผ่าน');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password, rememberMe);
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('กรุณายืนยันอีเมลของคุณ');
        } else {
          setError(signInError.message);
        }
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[340px] bg-white rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-athiti font-bold text-gray-800">เข้าสู่ระบบ</h2>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-gray-600 mb-2 text-sm">อีเมล</label>
          <input 
            type="email" 
            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
            placeholder="กรอกอีเมลของคุณ"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-2 text-sm">รหัสผ่าน</label>
          <input 
            type="password" 
            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
            placeholder="กรอกรหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            className="w-4 h-4 rounded border border-gray-300 text-blue-500 focus:ring-blue-500"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="rememberMe" className="ml-2 text-gray-600 text-sm cursor-pointer">
            จดจำฉันไว้
          </label>
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full h-12 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-all duration-300"
          disabled={loading}
        >
          {loading ? (
            <span className="inline-block animate-spin">
              <i className="fas fa-circle-notch"></i>
            </span>
          ) : (
            'เข้าสู่ระบบ'
          )}
        </button>
      </form>

      <div className="text-center mt-4">
        <Link href="/register" className="text-gray-600 hover:text-blue-500 text-sm transition-colors duration-300">
          ยังไม่มีบัญชี? ลงทะเบียนที่นี่
        </Link>
      </div>
    </div>
  );
} 
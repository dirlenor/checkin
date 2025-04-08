"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!email) {
      setError('กรุณากรอกอีเมล');
      return false;
    }
    
    // ตรวจสอบรูปแบบอีเมลอย่างง่าย
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง');
      return false;
    }

    // ตรวจสอบความยาวของอีเมล
    const [localPart, domain] = email.split('@');
    if (localPart.length < 2 || domain.length < 4) {
      setError('กรุณาใช้อีเมลที่ถูกต้อง เช่น user@example.com');
      return false;
    }

    if (!password) {
      setError('กรุณากรอกรหัสผ่าน');
      return false;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return false;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        if (signUpError.message.includes('email')) {
          setError('อีเมลนี้ถูกใช้งานแล้ว');
        } else if (signUpError.message.includes('invalid')) {
          setError('กรุณาใช้อีเมลที่ถูกต้อง เช่น user@example.com');
        } else {
          setError(signUpError.message);
        }
        return;
      }
      setSuccess(true);
      // Redirect to profile page after successful registration
      router.push('/profile');
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-white">
      <div className="max-w-5xl mx-auto px-4 py-6 min-h-[100dvh] flex flex-col items-center justify-center">
        <div className="w-full max-w-[340px] bg-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-athiti font-bold text-gray-800">ลงทะเบียน</h2>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-600 mb-2 text-sm">อีเมล</label>
              <input 
                type="email" 
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                placeholder="กรอกอีเมลของคุณ เช่น user@example.com"
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
            <div>
              <label className="block text-gray-600 mb-2 text-sm">ยืนยันรหัสผ่าน</label>
              <input 
                type="password" 
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg border border-green-200">
                ลงทะเบียนสำเร็จ! กำลังพาคุณไปยังหน้ากรอกข้อมูลส่วนตัว...
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
                'ลงทะเบียน'
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link href="/" className="text-gray-600 hover:text-blue-500 text-sm transition-colors duration-300">
              มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 
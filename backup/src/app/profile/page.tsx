"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('กรุณาเข้าสู่ระบบ');
        return;
      }

      if (!user.email) {
        setError('ไม่พบข้อมูลอีเมล');
        return;
      }

      if (!name || !age || !rate) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const profileData = {
        id: user.id,
        name: name.trim(),
        age: parseInt(age),
        rate: parseInt(rate),
        email: user.email,
        is_admin: user.email === 'thanawat.siriwisitthana@gmail.com',
        updated_at: new Date().toISOString()
      };

      let error;
      
      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);
        error = insertError;
      }

      if (error) {
        console.error('Supabase error:', error);
        setError(`เกิดข้อผิดพลาด: ${error.message}`);
        return;
      }

      const { data: checkData, error: checkError } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();

      if (checkError || !checkData) {
        console.error('Error checking profile:', checkError);
        setError('ไม่สามารถตรวจสอบข้อมูลที่บันทึกได้');
        return;
      }

      console.log('Profile saved successfully:', checkData);
      router.push('/dashboard');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-dark p-8">
      <div className="max-w-[340px] mx-auto">
        <h1 className="text-3xl font-league-gothic text-text-light tracking-wide text-center mb-2">Profile</h1>
        <p className="text-text-light/60 text-sm text-center mb-8">Check in your time and request payment app.</p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-text-light mb-1.5 text-sm">Name</label>
            <input
              type="text"
              className="input w-full h-11"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-text-light mb-1.5 text-sm">Age</label>
            <input
              type="number"
              className="input w-full h-11"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-text-light mb-1.5 text-sm">Rate</label>
            <input
              type="number"
              className="input w-full h-11"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
              min="0"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-100/10 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn w-full h-11 mt-8"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-block animate-spin">
                <i className="fas fa-circle-notch text-text-light"></i>
              </span>
            ) : (
              'บันทึกข้อมูล'
            )}
          </button>
        </form>
      </div>
    </main>
  );
} 
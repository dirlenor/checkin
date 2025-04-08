"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface SummaryData {
  totalUsers: number;
  totalCheckIns: number;
  totalWithdrawals: number;
  totalSalaryPaid: number;
  recentCheckIns: Array<{
    user_email: string;
    check_date: string;
    shift: string;
  }>;
  recentWithdrawals: Array<{
    user_email: string;
    amount: number;
    withdrawal_date: string;
  }>;
}

export default function AdminSummary() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      try {
        // ตรวจสอบว่าเป็น admin หรือไม่
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (!profile?.is_admin) {
          router.push('/dashboard');
          return;
        }

        // ดึงข้อมูลสรุป
        const [
          { count: usersCount },
          { count: checkInsCount },
          { count: withdrawalsCount },
          { data: totalSalary },
          { data: recentCheckIns },
          { data: recentWithdrawals }
        ] = await Promise.all([
          // จำนวนผู้ใช้ทั้งหมด
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          // จำนวน check-ins ทั้งหมด
          supabase.from('check_ins').select('*', { count: 'exact', head: true }),
          // จำนวนการเบิกเงินทั้งหมด
          supabase.from('withdrawals').select('*', { count: 'exact', head: true }),
          // ยอดเงินที่เบิกทั้งหมด
          supabase.from('withdrawals').select('amount'),
          // Check-ins ล่าสุด
          supabase
            .from('check_ins')
            .select('user_id, check_date, shift')
            .order('check_date', { ascending: false })
            .limit(5),
          // การเบิกเงินล่าสุด
          supabase
            .from('withdrawals')
            .select('user_id, amount, withdrawal_date')
            .order('withdrawal_date', { ascending: false })
            .limit(5)
        ]);

        // ดึงข้อมูลอีเมล์ของผู้ใช้สำหรับ recent activities
        const userIds = new Set([
          ...(recentCheckIns?.map(c => c.user_id) || []),
          ...(recentWithdrawals?.map(w => w.user_id) || [])
        ]);

        const { data: userEmails } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', Array.from(userIds));

        const emailMap = new Map(userEmails?.map(u => [u.id, u.email]));

        setSummaryData({
          totalUsers: usersCount || 0,
          totalCheckIns: checkInsCount || 0,
          totalWithdrawals: withdrawalsCount || 0,
          totalSalaryPaid: totalSalary?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0,
          recentCheckIns: recentCheckIns?.map(c => ({
            user_email: emailMap.get(c.user_id) || 'Unknown',
            check_date: c.check_date,
            shift: c.shift
          })) || [],
          recentWithdrawals: recentWithdrawals?.map(w => ({
            user_email: emailMap.get(w.user_id) || 'Unknown',
            amount: w.amount,
            withdrawal_date: w.withdrawal_date
          })) || []
        });
      } catch (err) {
        console.error('Error loading summary:', err);
        setError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadData();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-dark px-layout-x py-layout-y">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse text-center text-text-light">
            กำลังโหลดข้อมูล...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-bg-dark px-layout-x py-layout-y">
        <div className="max-w-4xl mx-auto">
          <div className="text-red-500 text-center">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!summaryData) {
    return null;
  }

  return (
    <main className="min-h-screen bg-bg-dark px-layout-x py-layout-y">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-league-gothic text-text-light">System Summary</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-text-light/60 hover:text-accent"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            กลับ
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-text-light/60 text-sm">จำนวนผู้ใช้ทั้งหมด</p>
            <p className="text-4xl font-league-gothic text-text-light mt-2">
              {summaryData.totalUsers.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-text-light/60 text-sm">จำนวนการเช็คอินทั้งหมด</p>
            <p className="text-4xl font-league-gothic text-text-light mt-2">
              {summaryData.totalCheckIns.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-text-light/60 text-sm">จำนวนการเบิกเงินทั้งหมด</p>
            <p className="text-4xl font-league-gothic text-text-light mt-2">
              {summaryData.totalWithdrawals.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-text-light/60 text-sm">ยอดเงินที่เบิกทั้งหมด</p>
            <p className="text-4xl font-league-gothic text-accent mt-2">
              ฿{summaryData.totalSalaryPaid.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Check-ins */}
          <div>
            <h2 className="text-xl font-league-gothic text-text-light mb-4">การเช็คอินล่าสุด</h2>
            <div className="space-y-2">
              {summaryData.recentCheckIns.map((checkIn, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3">
                  <p className="text-text-light text-sm truncate">{checkIn.user_email}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-text-light/60 text-xs">
                      {new Date(checkIn.check_date).toLocaleDateString('th-TH')}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">
                      {checkIn.shift}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Withdrawals */}
          <div>
            <h2 className="text-xl font-league-gothic text-text-light mb-4">การเบิกเงินล่าสุด</h2>
            <div className="space-y-2">
              {summaryData.recentWithdrawals.map((withdrawal, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3">
                  <p className="text-text-light text-sm truncate">{withdrawal.user_email}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-text-light/60 text-xs">
                      {new Date(withdrawal.withdrawal_date).toLocaleDateString('th-TH')}
                    </p>
                    <span className="text-accent text-sm">
                      ฿{withdrawal.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 
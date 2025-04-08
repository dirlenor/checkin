"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { sendTelegramMessage } from '@/utils/telegram';

interface Profile {
  name: string;
  age: number;
  rate: number;
  email: string;
  is_admin: boolean;
}

interface CheckIn {
  check_date: string;
  shift: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasCheckIn: boolean;
  shift: string | undefined;
}

const SHIFTS = {
  morning: { label: 'เช้า (8:30 - 17:30)', value: 'morning', hours: 8 },
  evening: { label: 'เย็น (12:30 - 21:30)', value: 'evening', hours: 8 },
  overtime: { label: 'OT (8:30 - 21:30)', value: 'overtime', hours: 13 }
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dayTime, setDayTime] = useState(0);
  const [overTime, setOverTime] = useState(0);
  const [salary, setSalary] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showDayTimeModal, setShowDayTimeModal] = useState(false);
  const [showOTModal, setShowOTModal] = useState(false);
  const [checkInList, setCheckInList] = useState<CheckIn[]>([]);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [checkDate, setCheckDate] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showWithdrawalHistoryModal, setShowWithdrawalHistoryModal] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<Array<{
    amount: number;
    withdrawal_date: string;
    note?: string;
  }>>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isClosing, setIsClosing] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, age, rate, email, is_admin')
        .eq('id', user.id)
        .single();

      if (!profile) {
        router.push('/profile');
        return;
      }

      setProfile(profile);
      setEditName(profile.name || '');
      setEditAge(profile.age?.toString() || '');
      setEditRate(profile.rate?.toString() || '');
      setEditEmail(profile.email || '');

      // ดึงข้อมูล check ins และคำนวณ salary และ day time
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('check_date, shift')
        .eq('user_id', user.id)
        .order('check_date', { ascending: true });

      if (checkIns) {
        setCheckInList(checkIns);
        
        // นับจำนวนวันทั้งหมดที่เข้างาน
        setDayTime(checkIns.length);
        
        // คำนวณชั่วโมง OT (4 ชั่วโมงต่อวัน)
        const otDays = checkIns.filter(checkIn => checkIn.shift === 'overtime');
        const otHours = otDays.length * 4; // 4 ชั่วโมง OT ต่อวัน
        setOverTime(otHours);
        
        // คำนวณ salary
        // - เงินเดือนปกติ: จำนวนวันทั้งหมด × rate
        // - OT: จำนวนชั่วโมง OT × 60 บาท
        const normalSalary = checkIns.length * profile.rate;
        const otSalary = otHours * 60;
        const totalSalary = normalSalary + otSalary;
        
        setSalary(totalSalary);
      }

      // ดึงข้อมูล withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('user_id', user.id);

      if (withdrawals) {
        const total = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        setTotalWithdrawn(total);
      }

      // ดึงข้อมูลประวัติการเบิกเงิน
      const { data: withdrawalHistory } = await supabase
        .from('withdrawals')
        .select('amount, withdrawal_date')
        .eq('user_id', user.id)
        .order('withdrawal_date', { ascending: false });

      if (withdrawalHistory) {
        setWithdrawalHistory(withdrawalHistory);
      }
    };

    getProfile();
  }, [router]);

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  // เพิ่ม useEffect สำหรับจัดการการคลิกนอก dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.settings-dropdown') && !target.closest('.settings-button')) {
        setShowSettingsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('กรุณาเข้าสู่ระบบ');
        return;
      }

      // ตรวจสอบว่าเคย check in วันที่เลือกไว้แล้วหรือไม่
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('check_date', checkDate)
        .single();

      if (existingCheckIn) {
        setError('คุณได้ลงเวลาของวันที่เลือกไปแล้ว');
        return;
      }

      const { error: insertError } = await supabase
        .from('check_ins')
        .insert({
          user_id: user.id,
          check_date: checkDate,
          shift: selectedShift
        });

      if (insertError) {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        return;
      }

      // อ่งการแจ้งเตือนไปยัง Telegram
      const shiftLabel = SHIFTS[selectedShift as keyof typeof SHIFTS]?.label || selectedShift;
      await sendTelegramMessage(`🏢 มีการเช็คอินเข้างาน
👤 ชื่อ: ${profile?.name || 'ไม่ระบุชื่อ'}
📅 อีเมล: ${profile?.email || 'ไม่ระบุอีเมล'}
📅 วันที่: ${new Date(checkDate).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
⏰ กะ: ${shiftLabel}
💰 เรทค่าจ้าง: ${profile?.rate || 0} บาท/วัน`);

      // อัพเดท salary และ day time
      if (profile) {
        const { data: checkIns } = await supabase
          .from('check_ins')
          .select('check_date, shift')
          .eq('user_id', user.id)
          .order('check_date', { ascending: true });

        if (checkIns) {
          setCheckInList(checkIns);
          
          // นับจำนวนวันทั้งหมดที่เข้างาน
          setDayTime(checkIns.length);
          
          // คำนวณชั่วโมง OT (4 ชั่วโมงต่อวัน)
          const otDays = checkIns.filter(checkIn => checkIn.shift === 'overtime');
          const otHours = otDays.length * 4; // 4 ชั่วโมง OT ต่อวัน
          setOverTime(otHours);
          
          // คำนวณ salary
          // - เงินเดือนปกติ: จำนวนวันทั้งหมด × rate
          // - OT: จำนวนชั่วโมง OT × 60 บาท
          const normalSalary = checkIns.length * profile.rate;
          const otSalary = otHours * 60;
          const totalSalary = normalSalary + otSalary;
          
          setSalary(totalSalary);
        }
      }
      
      setShowCheckInModal(false);
      setCheckDate('');
      setSelectedShift('');

      // แสดงข้อความแจ้งเตือนเมื่อสำเร็จ
      setSuccessMessage(`เช็คอินสำเร็จ กะ${shiftLabel}`);
      setShowSuccessModal(true);
      
      // ซ่อนข้อความแจ้งเตือนหลังจาก 3 วินาที
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);

    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้');

      const updates = {
        id: user.id,
        name: editName,
        age: parseInt(editAge),
        rate: parseInt(editRate),
        email: editEmail,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(updates);

      if (updateError) throw updateError;

      // อัพเดตข้อมูล profile ในหน้า
      setProfile({
        ...profile!,
        name: editName,
        age: parseInt(editAge),
        rate: parseInt(editRate),
        email: editEmail,
      });

      // คำนวณเงินเดือนใหม่ตาม rate ที่เปลี่ยน
      const normalSalary = checkInList.length * parseInt(editRate);
      const otHours = checkInList.filter(checkIn => checkIn.shift === 'overtime').length * 4;
      const otSalary = otHours * 60;
      const totalSalary = normalSalary + otSalary;
      setSalary(totalSalary);

      setShowEditModal(false);
      setSuccessMessage('แก้ไขข้อมูลสำเร็จ');
      setShowSuccessModal(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const amount = parseInt(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('กรุณาระบุจำนวนเงินที่ถูกต้อง');
        return;
      }

      if (amount > salary - totalWithdrawn) {
        setError('จำนวนเงินที่เบิกต้องไม่เกินยอดคงเหลือ');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('กรุณาเข้าสู่ระบบ');
        return;
      }

      const withdrawalDate = new Date().toISOString();
      const { error: insertError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amount,
          withdrawal_date: withdrawalDate,
          note: withdrawNote
        });

      if (insertError) {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        return;
      }

      // อัพเดทยอดเงินที่เบิกไปแล้ว
      setTotalWithdrawn(prev => prev + amount);
      
      // อัพเดทประวัติการเบิกเงินทันที
      setWithdrawalHistory(prev => [{
        amount: amount,
        withdrawal_date: withdrawalDate,
        note: withdrawNote
      }, ...prev]);
      
      setShowPaymentModal(false);
      setWithdrawAmount('');
      setWithdrawNote('');
      
      // แสดงข้อความแจ้งเตือนเมื่อสำเร็จ
      setSuccessMessage(`เบิกเงินสำเร็จ ${amount.toLocaleString()} บาท`);
      setShowSuccessModal(true);

    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = (setShowModal: (show: boolean) => void) => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
    }, 200);
  };

  if (!profile) {
    return null;
  }

  return (
    <React.Fragment>
      <main className="min-h-[100dvh] bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6 min-h-[100dvh] flex flex-col">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-athiti font-bold text-gray-800">สวัสดี, {profile.name}!</h1>
              <p className="text-gray-500 mt-1">วันนี้คุณอยากทำอะไร?</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowEditModal(true)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="fas fa-user-circle text-2xl"></i>
              </button>
              <div className="relative settings-dropdown">
                <button 
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="text-gray-500 hover:text-gray-700 transition-colors settings-button"
                >
                  <i className="fas fa-cog text-2xl"></i>
                </button>
                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-100">
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <i className="fas fa-sign-out-alt w-5"></i>
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            {/* Header */}
            <h2 className="text-2xl font-athiti font-bold text-gray-800">ลงเวลางาน</h2>
            
            {/* Salary Card */}
            <div 
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 h-full"
            >
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-blue-600 text-sm font-medium mb-1">ยอดเงินคงเหลือ</p>
                  <h3 className="text-4xl font-semibold text-gray-800 mb-1">฿ {(salary - totalWithdrawn).toLocaleString()}</h3>
                  <p className="text-blue-600/60 text-xs mt-1">เรท: {profile.rate} บาท/วัน</p>
                </div>
              </div>
            </div>

            {/* Day Time and OT Cards Container */}
            <div className="grid grid-cols-2 gap-4">
              {/* Day Time Card */}
              <div 
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 h-full"
              >
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-green-600 text-sm font-medium mb-1">วันทำงาน</p>
                    <h3 className="text-2xl font-semibold text-gray-800">{dayTime} วัน</h3>
                    <div className="w-full bg-green-200 h-1 rounded-full mt-2">
                      <div 
                        className="bg-green-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${(dayTime / 24) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* OT Card */}
              <div 
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 h-full"
              >
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-purple-600 text-sm font-medium mb-1">ชั่วโมง OT</p>
                    <h3 className="text-2xl font-semibold text-gray-800">{overTime} ชั่วโมง</h3>
                    <p className="text-purple-600/60 text-xs mt-1">อัตรา: 60 บาท/ชั่วโมง</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Actions */}
          <div className="mb-6 flex-grow">
            <h2 className="text-2xl font-athiti font-bold text-gray-800 mb-4">การดำเนินการ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button 
                onClick={() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, '0');
                  const day = String(today.getDate()).padStart(2, '0');
                  const formattedDate = `${year}-${month}-${day}`;
                  
                  setCheckDate(formattedDate);
                  setShowCheckInModal(true);
                }}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-md transition-all group relative"
              >
                <div className="absolute top-2 right-3 text-sm text-gray-500">
                  {new Date().toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <i className="fas fa-sign-in-alt"></i>
                </div>
                <div className="text-left">
                  <h3 className="text-gray-800 font-medium">เช็คอินวันนี้</h3>
                  <p className="text-gray-500 text-sm">กดเพื่อเช็คอิน</p>
                </div>
              </button>

              <button 
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-green-500 hover:shadow-md transition-all group relative"
              >
                <div className="absolute top-2 right-3 text-sm text-gray-500">
                  ฿ {(salary - totalWithdrawn).toLocaleString()}
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <i className="fas fa-wallet"></i>
                </div>
                <div className="text-left">
                  <h3 className="text-gray-800 font-medium">เบิกเงิน</h3>
                  <p className="text-gray-500 text-sm">กดเพื่อเบิกเงิน</p>
                </div>
              </button>

              {profile.is_admin && (
                <button 
                  onClick={() => router.push('/admin/summary')}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-500 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <i className="fas fa-chart-bar"></i>
                  </div>
                  <div className="text-left">
                    <h3 className="text-gray-800 font-medium">ระบบจัดการ</h3>
                    <p className="text-gray-500 text-sm">สำหรับผู้ดูแลระบบ</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        {showEditModal && (
          <div 
            className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal(setShowEditModal);
              }
            }}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-athiti font-bold text-gray-800">แก้ไขข้อมูล</h2>
                <button 
                  onClick={() => closeModal(setShowEditModal)}
                  className="text-cyan-400/60 hover:text-cyan-300"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-2 text-sm">ชื่อ</label>
                  <input
                    type="text"
                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-2 text-sm">อายุ</label>
                  <input
                    type="number"
                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-2 text-sm">เรทต่อวัน</label>
                  <input
                    type="number"
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
                    value={editRate}
                    disabled
                    title="ไม่สามารถแก้ไขเรทได้"
                  />
                  <p className="text-gray-500 text-xs mt-1">* ไม่สามารถแก้ไขเรทได้</p>
                </div>

                <div>
                  <label className="block text-gray-600 mb-2 text-sm">อีเมล</label>
                  <input
                    type="email"
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
                    value={editEmail}
                    disabled
                    title="ไม่สามารถแก้ไขอีเมลได้"
                  />
                  <p className="text-gray-500 text-xs mt-1">* ไม่สามารถแก้ไขอีเมลได้</p>
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-12 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-all duration-300"
                >
                  บันทึก
                </button>
              </form>
            </div>
          </div>
        )}

        {showCheckInModal && (
          <div 
            className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal(setShowCheckInModal);
              }
            }}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-athiti font-bold text-gray-800">ลงเวลาทำงาน</h2>
                <button 
                  onClick={() => closeModal(setShowCheckInModal)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={handleCheckIn} className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-2 text-sm">วันที่</label>
                  <input
                    type="date"
                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                    value={checkDate}
                    onChange={(e) => setCheckDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-2 text-sm">กะ</label>
                  <select
                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                    required
                  >
                    <option value="">เลือกกะ</option>
                    {Object.entries(SHIFTS).map(([key, { label, value }]) => (
                      <option key={key} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => closeModal(setShowCheckInModal)}
                    className="flex-1 h-11 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="inline-block animate-spin">
                        <i className="fas fa-circle-notch"></i>
                      </span>
                    ) : (
                      'ยืนยัน'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDayTimeModal && (
          <div 
            className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal(setShowDayTimeModal);
              }
            }}
          >
            <div className={`bg-black/90 rounded-lg p-6 w-full max-w-[340px] modal-content border border-cyan-500/30 shadow-lg shadow-cyan-500/20 ${isClosing ? 'closing' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-athiti font-bold text-gray-800">ปฏิทินลงเวลา</h2>
                  <p className="text-cyan-400/60 text-sm">{profile?.name || 'ไม่ระบุชื่อ'}</p>
                </div>
                <button 
                  onClick={() => closeModal(setShowDayTimeModal)}
                  className="text-cyan-400/60 hover:text-cyan-300"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const newDate = new Date(selectedMonth);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedMonth(newDate);
                  }}
                  className="text-cyan-400/60 hover:text-cyan-300"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <div className="text-cyan-400">
                  {selectedMonth.toLocaleDateString('th-TH', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <button
                  onClick={() => {
                    const newDate = new Date(selectedMonth);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedMonth(newDate);
                  }}
                  className="text-cyan-400/60 hover:text-cyan-300"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-7 gap-1 text-center text-cyan-400 text-sm">
                  <div>อา</div>
                  <div>จ</div>
                  <div>อ</div>
                  <div>พ</div>
                  <div>พฤ</div>
                  <div>ศ</div>
                  <div>ส</div>
                </div>

                {(() => {
                  const checkInMap = new Map(
                    checkInList.map(checkIn => [
                      checkIn.check_date,
                      checkIn.shift
                    ])
                  );

                  const firstDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
                  const lastDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

                  const firstCalendarDay = new Date(firstDay);
                  firstCalendarDay.setDate(firstCalendarDay.getDate() - firstCalendarDay.getDay());

                  const weeks: CalendarDay[][] = [];
                  let currentWeek: CalendarDay[] = [];
                  let currentDate = new Date(firstCalendarDay);

                  while (currentDate <= lastDay || currentDate.getDay() !== 0) {
                    if (currentDate.getDay() === 0 && currentWeek.length > 0) {
                      weeks.push(currentWeek);
                      currentWeek = [];
                    }

                    const year = currentDate.getFullYear();
                    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const day = String(currentDate.getDate()).padStart(2, '0');
                    const dateString = `${year}-${month}-${day}`;
                    
                    const shift = checkInMap.get(dateString);
                    
                    currentWeek.push({
                      date: new Date(currentDate),
                      isCurrentMonth: currentDate.getMonth() === selectedMonth.getMonth(),
                      hasCheckIn: Boolean(shift),
                      shift: shift
                    });

                    currentDate = new Date(currentDate);
                    currentDate.setDate(currentDate.getDate() + 1);
                  }

                  if (currentWeek.length > 0) {
                    weeks.push(currentWeek);
                  }

                  return (
                    <div className="grid gap-1">
                      {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-cols-7 gap-1">
                          {week.map((day, dayIndex) => (
                            <div
                              key={dayIndex}
                              className={`
                                aspect-square flex flex-col items-center justify-center rounded
                                ${day.isCurrentMonth ? 'text-cyan-300' : 'text-cyan-400/20'}
                                ${day.hasCheckIn ? 'bg-white/5' : ''}
                              `}
                            >
                              <span className="text-sm">{day.date.getDate()}</span>
                              {day.hasCheckIn && day.shift && (
                                <div 
                                  className={`
                                    w-1.5 h-1.5 rounded-full mt-0.5
                                    ${day.shift === 'morning' ? 'bg-yellow-500' : 
                                      day.shift === 'evening' ? 'bg-blue-500' : 
                                      'bg-cyan-500'}
                                  `}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* คำอธิบายสัญลักษณ์ */}
                <div className="flex items-center justify-center gap-4 text-sm text-cyan-400/60">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    <span>เช้า</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>เย็น</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    <span>OT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showOTModal && (
          <div 
            className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal(setShowOTModal);
              }
            }}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-athiti font-bold text-gray-800">รายการ OT</h2>
                <button 
                  onClick={() => closeModal(setShowOTModal)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                {checkInList
                  .filter(checkIn => checkIn.shift === 'overtime')
                  .map((checkIn, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-800 font-medium">
                          {new Date(checkIn.check_date).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-gray-500 text-sm">{SHIFTS[checkIn.shift as keyof typeof SHIFTS].label}</span>
                      </div>
                      <p className="text-gray-500 text-sm">฿ {(SHIFTS[checkIn.shift as keyof typeof SHIFTS].hours * 60).toLocaleString()}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div 
            className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal(setShowPaymentModal);
              }
            }}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-athiti font-bold text-gray-800">เบิกเงิน</h2>
                <button 
                  onClick={() => closeModal(setShowPaymentModal)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-2 text-sm">จำนวนเงิน</label>
                  <input
                    type="number"
                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="0"
                    max={salary - totalWithdrawn}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-2 text-sm">บันทึก</label>
                  <textarea
                    className="w-full h-24 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 resize-none"
                    value={withdrawNote}
                    onChange={(e) => setWithdrawNote(e.target.value)}
                    placeholder="บันทึกเพิ่มเติม (ไม่บังคับ)"
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-12 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-all duration-300"
                >
                  ยืนยัน
                </button>
              </form>
            </div>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed top-4 right-4 bg-green-500/90 text-white px-4 py-2 rounded shadow-lg">
            <div className="flex items-center gap-2">
              <i className="fas fa-check-circle"></i>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {showWithdrawalHistoryModal && (
          <div 
            className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal(setShowWithdrawalHistoryModal);
              }
            }}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-athiti font-bold text-gray-800">ประวัติการเบิกเงิน</h2>
                <button 
                  onClick={() => closeModal(setShowWithdrawalHistoryModal)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="space-y-4">
                {withdrawalHistory.map((withdrawal, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-800 font-medium">฿ {withdrawal.amount.toLocaleString()}</span>
                      <span className="text-gray-500 text-sm">{new Date(withdrawal.withdrawal_date).toLocaleDateString('th-TH')}</span>
                    </div>
                    <p className="text-gray-500 text-sm">{withdrawal.note || 'ไม่มีบันทึก'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </React.Fragment>
  );
} 
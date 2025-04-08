import React, { useEffect, useState } from 'react';

const Summary = () => {
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    // เพิ่ม logic ดึงข้อมูล summary ที่นี่
    const fetchSummaryData = async () => {
      // ตัวอย่างข้อมูล
      const data = {
        totalUsers: 100,
        activeUsers: 75,
        totalTransactions: 500,
        // เพิ่มข้อมูลอื่นๆ ตามต้องการ
      };
      setSummaryData(data);
    };

    fetchSummaryData();
  }, []);

  if (!summaryData) return <div>กำลังโหลด...</div>;

  return (
    <div className="summary-container">
      <h1>สรุปข้อมูลระบบ</h1>
      <div className="summary-grid">
        <div className="summary-card">
          <h3>จำนวนผู้ใช้ทั้งหมด</h3>
          <p>{summaryData.totalUsers}</p>
        </div>
        <div className="summary-card">
          <h3>ผู้ใช้ที่กำลังใช้งาน</h3>
          <p>{summaryData.activeUsers}</p>
        </div>
        <div className="summary-card">
          <h3>จำนวนธุรกรรมทั้งหมด</h3>
          <p>{summaryData.totalTransactions}</p>
        </div>
      </div>
    </div>
  );
};

export default Summary; 
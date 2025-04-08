import { useAuth } from '../auth/AuthContext';
import { checkSpecialAccess } from '../auth/authUtils';
import Link from 'next/link';

export default function Navigation() {
  const { user } = useAuth();
  
  console.log('Current user:', user);
  console.log('Is special access:', user?.email ? checkSpecialAccess(user.email) : false);
  
  return (
    <nav className="bg-black/80 backdrop-blur-sm border-b border-cyan-500/30 p-4 shadow-lg shadow-cyan-500/20">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link 
            href="/dashboard" 
            className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300 font-bold text-lg relative group"
          >
            <span className="relative z-10">หน้าหลัก</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          </Link>
          {user && checkSpecialAccess(user.email) && (
            <>
              <span className="special-badge bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg shadow-cyan-500/30 animate-pulse">
                🌟 ผู้ใช้พิเศษ ({user.email})
              </span>
              <Link 
                href="/summary" 
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300 font-bold text-lg relative group"
              >
                <span className="relative z-10">สรุปข้อมูล</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStudentAttendance } from '../lib/db';

export default function AttendanceHistory() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })));
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const auth = localStorage.getItem('studentAuth');
      if (!auth) return navigate('/login');
      const student = JSON.parse(auth);
      
      const data = await getStudentAttendance(student.id);
      setAttendance(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getRecordForDate = (day) => {
    if (!day) return null;
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return attendance.find(r => r.sessions?.date === dateStr);
  };

  if (loading) return <div className="min-h-screen bg-[#F3F4F6]"></div>;

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <div className="bg-white px-4 pt-12 pb-4 flex items-center border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-gray-50 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 ml-2">Attendance History</h1>
      </div>

      <div className="p-4 flex-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="p-2"><ChevronLeft className="w-5 h-5" /></button>
            <h2 className="font-bold text-gray-800 uppercase tracking-widest text-sm">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="p-2"><ChevronRight className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="text-center text-xs font-bold text-gray-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const record = getRecordForDate(day);
              let bgColor = 'bg-gray-50';
              let textColor = 'text-gray-400';
              
              if (record) {
                if (record.status === 'present') { bgColor = 'bg-green-500'; textColor = 'text-white'; }
                else if (record.status === 'absent') { bgColor = 'bg-red-500'; textColor = 'text-white'; }
                else if (record.status === 'late') { bgColor = 'bg-amber-500'; textColor = 'text-white'; }
              }

              return (
                <button
                  key={idx}
                  disabled={!day}
                  onClick={() => day && record && setSelectedRecord(record)}
                  className={`aspect-square rounded-full flex items-center justify-center text-sm font-bold transition-all ${bgColor} ${textColor} ${!day && 'opacity-0'} ${day && record && 'active:scale-90 shadow-sm'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-12 animate-slide-up">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              {new Date(selectedRecord.sessions.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <h2 className="text-2xl font-black text-gray-800 capitalize mb-6">{selectedRecord.sessions.subject}</h2>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-gray-500">Your Status</span>
              <span className={`font-black text-lg uppercase ${
                selectedRecord.status === 'present' ? 'text-green-600' :
                selectedRecord.status === 'absent' ? 'text-red-600' : 'text-amber-600'
              }`}>
                {selectedRecord.status}
              </span>
            </div>
            
            <button 
              onClick={() => setSelectedRecord(null)}
              className="w-full mt-6 bg-gray-900 text-white font-bold py-4 rounded-xl active:scale-95 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { 
  getTodaysSession, 
  getStudentAttendance, 
  getStudentFees, 
  getStudentTests, 
  getStudentNotes,
  getUpcomingExams 
} from '../lib/db';
import { TEACHER_PHONE } from '../lib/config';
import { TIMETABLE } from '../lib/timetable';
import { 
  MessageSquare,
  ChevronRight,
  LogOut,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    todaySession: null,
    attendanceStats: { present: 0, absent: 0, late: 0, total: 0 },
    streak: 0,
    missedSessions: [],
    pendingFees: 0,
    feeStatus: 'Paid ✓',
    tests: [],
    notes: [],
    exams: []
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { value } = await Preferences.get({ key: 'studentAuth' });
    if (!value) {
      navigate('/login');
      return;
    }
    const studentData = JSON.parse(value);
    setStudent(studentData);
    loadStudentData(studentData.id);
  };

  const loadStudentData = async (studentId) => {
    try {
      setLoading(true);
      
      const [
        todaySession,
        attendanceData,
        feesData,
        testsData,
        notesData,
        examsData
      ] = await Promise.all([
        getTodaysSession(),
        getStudentAttendance(studentId),
        getStudentFees(studentId),
        getStudentTests(studentId),
        getStudentNotes(studentId),
        getUpcomingExams()
      ]);

      // Calculate attendance stats & streak
      const stats = { present: 0, absent: 0, late: 0, total: attendanceData.length };
      const missed = [];
      let currentStreak = 0;
      
      // Assuming attendanceData is sorted newest first by created_at (as per db.js)
      let streakActive = true;
      attendanceData.forEach(record => {
        if (record.status === 'present' || record.status === 'late') {
          if (record.status === 'present') stats.present++;
          if (record.status === 'late') stats.late++;
          if (streakActive) currentStreak++;
        } else if (record.status === 'absent') {
          stats.absent++;
          streakActive = false;
          if (record.sessions) missed.push(record.sessions);
        }
      });

      // Calculate pending fees for current month
      const currentMonthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      let pendingFees = 0;
      let feeStatus = 'Paid ✓';
      const currentFee = feesData.find(f => f.month === currentMonthStr);
      if (currentFee) {
        pendingFees = currentFee.amount_due - currentFee.amount_paid;
        if (pendingFees > 0) {
          if (currentFee.amount_paid > 0) feeStatus = `₹${pendingFees} remaining for ${currentMonthStr}`;
          else feeStatus = `₹${pendingFees} due for ${currentMonthStr}`;
        } else {
          feeStatus = `${currentMonthStr} — Paid ✓`;
        }
      }

      setData({
        todaySession,
        attendanceStats: stats,
        streak: currentStreak,
        missedSessions: missed.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
        pendingFees,
        feeStatus,
        tests: testsData.slice(0, 3), // last 3 tests
        notes: notesData,
        exams: examsData.slice(0, 3) // max 3 exams
      });

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await Preferences.remove({ key: 'studentAuth' });
    localStorage.removeItem('studentAuth');
    navigate('/login');
  };

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const { todaySession, attendanceStats, streak, missedSessions, pendingFees, feeStatus, tests, notes, exams } = data;
  const attendancePercentage = attendanceStats.total === 0 ? 0 : 
    Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100);

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday
  const todaySubject = TIMETABLE[dayOfWeek];

  // Calculate greeting
  const hour = today.getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";

  const firstName = student.name.split(' ')[0];
  const dateString = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-10">
      {/* Header */}
      <div className="sticky top-0 bg-[#F3F4F6] z-10 pt-12 pb-4 px-5 border-b border-gray-200/50 backdrop-blur-md flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">{greeting}, {firstName}</h1>
          <p className="text-sm font-semibold text-gray-500 mt-0.5">{dateString}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="text-xs font-bold text-gray-400 hover:text-gray-600 transition"
        >
          Logout
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        
        {/* Section 1 - Today's Class */}
        <section>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 border-l-4 border-l-indigo-600">
            <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">{todaySubject}</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1 mb-4">{today.toLocaleDateString('en-US', { weekday: 'long' })}</p>
            
            {todaySession ? (
              todaySession.subject === 'holiday' ? (
                <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold">
                  <Calendar className="w-4 h-4" /> Holiday today
                </div>
              ) : (
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
                    <CheckCircle className="w-4 h-4" /> Session logged ✓
                  </div>
                  {/* Wait, we don't have the current student's status for today in todaySession directly. We can infer it if they have an attendance record for today. */}
                </div>
              )
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                Awaiting today's session...
              </div>
            )}
          </div>
        </section>

        {/* Section 2 - My Attendance */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">My Attendance</h3>
          <button 
            onClick={() => navigate('/attendance-history')}
            className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between active:scale-[0.98] transition"
          >
            <div>
              <div className="text-4xl font-black text-gray-800 mb-1">{attendancePercentage}%</div>
              {streak > 0 && (
                <div className="text-amber-500 font-bold text-sm flex items-center gap-1">
                  🔥 {streak} session{streak !== 1 && 's'} in a row
                </div>
              )}
            </div>
            <ChevronRight className="w-6 h-6 text-gray-300" />
          </button>
        </section>

        {/* Section 3 - My Fees */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">My Fees</h3>
          <button 
            onClick={() => navigate('/payment-history')}
            className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition"
          >
            <div className={`p-4 ${pendingFees > 0 ? 'bg-amber-50 text-amber-700 border-l-4 border-amber-500' : 'bg-green-50 text-green-700 border-l-4 border-green-500'} flex items-center justify-between`}>
              <span className="font-bold text-sm">{feeStatus}</span>
              <ChevronRight className="w-5 h-5 opacity-50" />
            </div>
          </button>
        </section>

        {/* Section 4 - My Test Scores */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">My Test Scores</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {tests.length === 0 ? (
              <p className="p-4 text-center text-sm font-medium text-gray-400">No tests recorded yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {tests.map(test => (
                  <div key={test.id} className="p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{test.subject}</h4>
                      <p className="text-xs font-medium text-gray-400 mt-0.5">{test.subject}</p>
                    </div>
                    <div className="font-black text-indigo-600 text-lg">
                      {test.score}<span className="text-sm text-gray-400 font-bold ml-0.5">/{test.total_marks}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tests.length > 0 && (
              <button 
                onClick={() => navigate('/test-history')}
                className="w-full p-3 bg-gray-50 text-indigo-600 font-bold text-xs uppercase tracking-wider text-center border-t border-gray-100 hover:bg-gray-100 transition"
              >
                View All →
              </button>
            )}
          </div>
        </section>

        {/* Section 5 - Missed Sessions */}
        {missedSessions.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Missed Classes</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
              {missedSessions.map((session, idx) => (
                <div key={idx} className="flex gap-3 items-start border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="bg-red-50 p-2 rounded-lg text-red-500 mt-0.5">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm capitalize">{session.subject}</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      {new Date(session.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs font-medium text-red-500 mt-1">You missed this class</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 6 - Timetable */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Timetable</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
            {[1, 2, 3, 4, 5, 6].map(dayNum => {
              const days = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
              const isToday = dayOfWeek === dayNum;
              return (
                <div 
                  key={dayNum} 
                  className={`flex justify-between items-center p-3 rounded-lg ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600'}`}
                >
                  <span className={`text-xs font-bold tracking-widest ${isToday ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {days[dayNum]}
                  </span>
                  <span className={`text-sm font-bold uppercase tracking-wider ${isToday ? 'text-white' : 'text-gray-800'}`}>
                    {TIMETABLE[dayNum]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 7 - Notes */}
        {notes.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">From your teacher</h3>
            <div className="space-y-3">
              {notes.map(note => {
                let displayNote = note.note;
                if (displayNote.startsWith('behaviour:')) {
                  displayNote = displayNote.split(':').slice(2).join(':');
                }
                return (
                  <div key={note.id} className="bg-gray-100 rounded-2xl rounded-tl-sm p-4 text-sm font-medium text-gray-700">
                    {displayNote}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 8 - Contact Teacher */}
        <section>
          <a 
            href={`https://wa.me/${TEACHER_PHONE.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <MessageSquare className="w-5 h-5" />
            Message Teacher on WhatsApp →
          </a>
        </section>

        {/* Section 9 - Exam Countdown */}
        {exams.length > 0 && (
          <section className="pb-8">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Upcoming Exams</h3>
            <div className="space-y-3">
              {exams.map(exam => {
                const examDateObj = new Date(exam.exam_date);
                const todayMidnight = new Date();
                todayMidnight.setHours(0,0,0,0);
                const diffTime = examDateObj - todayMidnight;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm mb-0.5">{exam.name}</h4>
                      {exam.subject && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{exam.subject}</p>}
                    </div>
                    {diffDays === 0 ? (
                      <div className="bg-red-50 text-red-600 font-black text-lg px-3 py-1 rounded-lg">TODAY 🎯</div>
                    ) : (
                      <div className="text-right">
                        <span className="block text-xl font-black text-indigo-600 leading-none mb-1">in {diffDays} days</span>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{examDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

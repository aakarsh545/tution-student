import React, { useState, useEffect } from 'react';
import { getLeaderboardData } from '../lib/db';
import { RefreshCw } from 'lucide-react';
import { Preferences } from '@capacitor/preferences';

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('attendance');
  const [studentId, setStudentId] = useState(null);
  const [rankings, setRankings] = useState({ attendance: [], scores: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const auth = await Preferences.get({ key: 'studentAuth' });
      const currentStudent = JSON.parse(auth.value || '{}');
      setStudentId(currentStudent.id);

      const data = await getLeaderboardData();
      
      const attendanceMap = {};
      const scoreMap = {};

      data.students.forEach(s => {
        attendanceMap[s.id] = { name: s.name, present: 0, total: 0 };
        scoreMap[s.id] = { name: s.name, scoreSum: 0, totalMax: 0 };
      });

      data.attendance.forEach(a => {
        if (attendanceMap[a.student_id]) {
          attendanceMap[a.student_id].total++;
          if (a.status === 'present' || a.status === 'late') {
            attendanceMap[a.student_id].present++;
          }
        }
      });

      data.tests.forEach(t => {
        if (scoreMap[t.student_id]) {
          scoreMap[t.student_id].scoreSum += t.score;
          scoreMap[t.student_id].totalMax += t.total_marks;
        }
      });

      const attList = Object.keys(attendanceMap).map(id => {
        const student = attendanceMap[id];
        const pct = student.total > 0 ? (student.present / student.total) * 100 : 0;
        return { id, name: student.name, score: pct, total: student.total };
      }).filter(s => s.total > 0).sort((a, b) => b.score - a.score);

      const scoreList = Object.keys(scoreMap).map(id => {
        const student = scoreMap[id];
        const pct = student.totalMax > 0 ? (student.scoreSum / student.totalMax) * 100 : 0;
        return { id, name: student.name, score: pct, total: student.totalMax };
      }).filter(s => s.total > 0).sort((a, b) => b.score - a.score);

      setRankings({ attendance: attList, scores: scoreList });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  const formatName = (name) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[1].charAt(0)}.`;
    }
    return name;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
      </div>
    );
  }

  const currentList = tab === 'attendance' ? rankings.attendance : rankings.scores;

  return (
    <div className="h-full flex flex-col p-4 pb-24">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 shrink-0">
        <h1 className="text-xl font-black text-gray-800 mb-4">🏆 Class Rankings</h1>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setTab('attendance')}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition ${tab === 'attendance' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
          >
            Attendance
          </button>
          <button 
            onClick={() => setTab('scores')}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition ${tab === 'scores' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
          >
            Scores
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
        {currentList.length === 0 ? (
          <div className="p-8 text-center text-gray-400 font-medium">
            {tab === 'attendance' ? 'No attendance recorded yet.' : 'No tests recorded yet.'}
          </div>
        ) : (
          <div className="overflow-y-auto p-2">
            {currentList.map((student, index) => {
              const isMe = student.id === studentId;
              let rowClass = "flex justify-between items-center p-3 rounded-xl mb-1 ";
              if (index === 0) rowClass += "bg-amber-50/50 border border-amber-100";
              else if (index === 1) rowClass += "bg-slate-50 border border-slate-100";
              else if (index === 2) rowClass += "bg-orange-50/50 border border-orange-100";
              else rowClass += "border border-transparent";

              if (isMe) {
                rowClass += " !bg-indigo-50 !border-indigo-200";
              }

              return (
                <div key={student.id} className={rowClass}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-5 text-center">#{index + 1}</span>
                    <span className={`font-bold ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {formatName(student.name)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-black ${isMe ? 'text-indigo-600' : 'text-gray-600'}`}>
                      {Math.round(student.score)}%
                    </span>
                    <span className="w-5 text-center text-lg leading-none">{getMedal(index)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

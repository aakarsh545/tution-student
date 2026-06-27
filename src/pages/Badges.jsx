import React, { useState, useEffect } from 'react';
import { getLeaderboardData } from '../lib/db';
import { supabase } from '../lib/supabase';
import { Preferences } from '@capacitor/preferences';
import { RefreshCw, Award } from 'lucide-react';

const BADGE_DEFS = [
  { id: 'fire', emoji: '🔥', name: 'On Fire', desc: '5+ consecutive present/late sessions', condition: 'Attend 5 classes in a row without being absent.' },
  { id: 'week', emoji: '📅', name: 'Perfect Week', desc: 'Present all 6 sessions in a week', condition: 'Never miss a single day from Monday to Saturday.' },
  { id: 'scholar', emoji: '🎓', name: 'Scholar', desc: 'Scored 90%+ on any test', condition: 'Score 90% or above on any single test.' },
  { id: 'perfect', emoji: '💯', name: 'Perfect Score', desc: 'Scored 100% on any test', condition: 'Get full marks on any test. You can do it!' },
  { id: 'comeback', emoji: '📈', name: 'Comeback Kid', desc: 'Score improved by 20%+ between tests', condition: 'Boost your score by 20% or more in the same subject on the next test.' },
  { id: 'top', emoji: '🏆', name: 'Top of Class', desc: 'Currently #1 on attendance leaderboard', condition: 'Have the highest attendance percentage in the entire class.' },
  { id: 'consistent', emoji: '⚡', name: 'Consistent', desc: 'Attended 20+ total sessions', condition: 'Show up for 20 classes overall.' },
  { id: 'allrounder', emoji: '🌟', name: 'All Rounder', desc: 'Attendance > 80% and test average > 75%', condition: 'Keep both attendance above 80% and average test score above 75%.' }
];

export default function Badges() {
  const [loading, setLoading] = useState(true);
  const [earnedBadges, setEarnedBadges] = useState(new Set());
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const auth = await Preferences.get({ key: 'studentAuth' });
      const currentStudent = JSON.parse(auth.value || '{}');
      const studentId = currentStudent.id;

      const [leaderboardData, attRes, testsRes] = await Promise.all([
        getLeaderboardData(),
        supabase.from('attendance').select('status, created_at, session_id').eq('student_id', studentId).order('created_at', { ascending: true }),
        supabase.from('tests').select('score, total_marks, subject, created_at').eq('student_id', studentId).order('created_at', { ascending: true })
      ]);

      const attendance = attRes.data || [];
      const tests = testsRes.data || [];
      const earned = new Set();

      // Attendance calculations
      let currentStreak = 0;
      let maxStreak = 0;
      let presentCount = 0;
      let totalCount = attendance.length;

      attendance.forEach(a => {
        if (a.status === 'present' || a.status === 'late') {
          currentStreak++;
          presentCount++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else if (a.status === 'absent') {
          currentStreak = 0;
        }
      });

      if (maxStreak >= 5) earned.add('fire');
      if (maxStreak >= 6) earned.add('week'); // Simplified logic for perfect week
      if (presentCount >= 20) earned.add('consistent');

      // Test calculations
      let testSum = 0;
      let testTotal = 0;
      const subjectScores = {};

      tests.forEach(t => {
        const pct = (t.score / t.total_marks) * 100;
        testSum += t.score;
        testTotal += t.total_marks;

        if (pct >= 90) earned.add('scholar');
        if (pct >= 100) earned.add('perfect');

        // Comeback Kid check
        if (!subjectScores[t.subject]) {
          subjectScores[t.subject] = [];
        }
        subjectScores[t.subject].push(pct);
        const history = subjectScores[t.subject];
        if (history.length >= 2) {
          const prev = history[history.length - 2];
          const curr = history[history.length - 1];
          if (curr - prev >= 20) earned.add('comeback');
        }
      });

      // All Rounder
      const attPct = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
      const testPct = testTotal > 0 ? (testSum / testTotal) * 100 : 0;
      if (attPct > 80 && testPct > 75) earned.add('allrounder');

      // Top of Class
      const attendanceMap = {};
      leaderboardData.students.forEach(s => {
        attendanceMap[s.id] = { present: 0, total: 0 };
      });
      leaderboardData.attendance.forEach(a => {
        if (attendanceMap[a.student_id]) {
          attendanceMap[a.student_id].total++;
          if (a.status === 'present' || a.status === 'late') attendanceMap[a.student_id].present++;
        }
      });
      const rankedAtt = Object.keys(attendanceMap).map(id => {
        const student = attendanceMap[id];
        const pct = student.total > 0 ? (student.present / student.total) * 100 : 0;
        return { id, score: pct, total: student.total };
      }).filter(s => s.total > 0).sort((a, b) => b.score - a.score);

      if (rankedAtt.length > 0 && rankedAtt[0].id === studentId) {
        earned.add('top');
      }

      setEarnedBadges(earned);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 pb-24 relative">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 shrink-0 flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">🎖️ My Achievements</h1>
        <div className="bg-indigo-50 text-indigo-700 font-black px-3 py-1 rounded-lg text-sm">
          {earnedBadges.size} / {BADGE_DEFS.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto pb-4">
          {BADGE_DEFS.map(badge => {
            const isEarned = earnedBadges.has(badge.id);
            return (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition active:scale-95 ${
                  isEarned 
                    ? 'border-transparent bg-gradient-to-br from-indigo-50 to-purple-50 shadow-sm' 
                    : 'border-gray-100 bg-gray-50 opacity-60 grayscale'
                }`}
              >
                <span className="text-4xl mb-2 drop-shadow-sm">{badge.emoji}</span>
                <span className={`text-sm font-bold text-center leading-tight ${isEarned ? 'text-indigo-900' : 'text-gray-500'}`}>
                  {badge.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedBadge && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedBadge(null)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl mb-16 sm:mb-0" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <span className="text-6xl drop-shadow-md mb-4 block">{selectedBadge.emoji}</span>
              <h2 className="text-2xl font-black text-gray-800">{selectedBadge.name}</h2>
              <p className="text-gray-500 font-medium text-sm mt-1">{selectedBadge.desc}</p>
            </div>
            
            {earnedBadges.has(selectedBadge.id) ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-bold uppercase tracking-wider text-sm">Earned ✓</p>
                <p className="text-green-600 text-xs font-medium mt-1">Awesome job!</p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-slate-500 font-bold text-sm">Not yet — here's how to get it:</p>
                <p className="text-slate-700 text-sm font-semibold mt-2">{selectedBadge.condition}</p>
              </div>
            )}
            
            <button 
              onClick={() => setSelectedBadge(null)}
              className="w-full mt-4 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

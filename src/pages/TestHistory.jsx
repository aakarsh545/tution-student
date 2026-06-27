import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getStudentTests } from '../lib/db';

export default function TestHistory() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const auth = localStorage.getItem('studentAuth');
      if (!auth) return navigate('/login');
      const student = JSON.parse(auth);
      
      const data = await getStudentTests(student.id);
      setTests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const subjects = ['All', ...new Set(tests.map(t => t.subject))].filter(Boolean);
  
  const filteredTests = filter === 'All' ? tests : tests.filter(t => t.subject === filter);

  // Find personal best per subject
  const bestScores = {};
  tests.forEach(test => {
    const percentage = (test.score / test.total_marks) * 100;
    if (!bestScores[test.subject] || percentage > bestScores[test.subject].percentage) {
      bestScores[test.subject] = { id: test.id, percentage };
    }
  });

  if (loading) return <div className="min-h-screen bg-[#F3F4F6]"></div>;

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-gray-50 rounded-lg">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-lg font-bold text-gray-800 ml-2">Test Scores</h1>
        </div>
        
        {/* Subject Filter Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {subjects.map(sub => (
            <button
              key={sub}
              onClick={() => setFilter(sub)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
                filter === sub 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filteredTests.length === 0 ? (
          <p className="text-center text-gray-400 font-medium p-8">No tests found.</p>
        ) : (
          filteredTests.map(test => {
            const percentage = Math.round((test.score / test.total_marks) * 100);
            const isBest = bestScores[test.subject]?.id === test.id;
            
            return (
              <div key={test.id} className={`bg-white rounded-xl shadow-sm border p-4 ${isBest ? 'border-amber-300 bg-amber-50/30' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800 capitalize flex items-center gap-2">
                      {test.subject}
                      {isBest && <span className="text-amber-500" title="Personal Best">⭐</span>}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      {new Date(test.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-black ${percentage >= 80 ? 'text-green-600' : percentage >= 40 ? 'text-indigo-600' : 'text-red-500'}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{test.topic}</span>
                  <div className="font-black text-gray-800">
                    {test.score}<span className="text-sm text-gray-400 font-bold ml-0.5">/{test.total_marks}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

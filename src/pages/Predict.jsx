import React, { useState, useEffect } from 'react';
import { getPredictions, submitPrediction } from '../lib/db';
import { supabase } from '../lib/supabase';
import { Preferences } from '@capacitor/preferences';
import { RefreshCw, Target } from 'lucide-react';

export default function Predict() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [studentId, setStudentId] = useState(null);
  
  const [subject, setSubject] = useState('Maths');
  const [testName, setTestName] = useState('');
  const [predictedScore, setPredictedScore] = useState('');
  const [maxScore, setMaxScore] = useState('20');
  
  const subjects = ['Maths', 'Science', 'English', 'Social', 'Hindi', 'Kannada'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const auth = await Preferences.get({ key: 'studentAuth' });
      const currentStudent = JSON.parse(auth.value || '{}');
      setStudentId(currentStudent.id);

      const [preds, testsRes] = await Promise.all([
        getPredictions(currentStudent.id),
        supabase.from('tests').select('*').eq('student_id', currentStudent.id)
      ]);
      
      setPredictions(preds);
      setTestResults(testsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!testName || !predictedScore || !maxScore) return;

    try {
      setLoading(true);
      await submitPrediction({
        student_id: studentId,
        subject,
        test_name: testName,
        predicted_score: parseFloat(predictedScore),
        max_score: parseFloat(maxScore)
      });
      setTestName('');
      setPredictedScore('');
      alert("Prediction locked in! Good luck 🤞");
      await loadData();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getPredictionStatus = (pred) => {
    // Find matching test case-insensitive
    const match = testResults.find(t => 
      t.subject === pred.subject && 
      t.title?.toLowerCase() === pred.test_name.toLowerCase()
    );

    if (!match) return null;

    const actualPct = (match.score / match.total_marks) * 100;
    const predPct = (pred.predicted_score / pred.max_score) * 100;
    const accuracy = Math.max(0, 100 - Math.abs(actualPct - predPct));
    
    return {
      actual: match.score,
      actualMax: match.total_marks,
      accuracy
    };
  };

  let totalAcc = 0;
  let accCount = 0;
  
  const predictionsList = predictions.map(p => {
    const status = getPredictionStatus(p);
    if (status) {
      totalAcc += status.accuracy;
      accCount++;
    }
    return { ...p, status };
  });

  const avgAccuracy = accCount > 0 ? Math.round(totalAcc / accCount) : null;

  if (loading && predictions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 pb-24">
      {avgAccuracy !== null && (
        <div className="bg-indigo-600 text-white rounded-xl shadow-sm p-4 mb-4 shrink-0 flex items-center justify-between">
          <div className="font-bold text-sm">Your average prediction accuracy:</div>
          <div className="text-2xl font-black">{avgAccuracy}% 🎯</div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 shrink-0">
        <h1 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
          <Target className="text-indigo-500 w-6 h-6"/> Predict My Score
        </h1>
        <form onSubmit={handlePredict} className="space-y-3">
          <div className="flex gap-2">
            <select 
              value={subject} 
              onChange={e => setSubject(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-bold text-gray-700 text-sm"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input 
              type="text" 
              placeholder="Test Name (e.g. Unit 2)" 
              value={testName}
              onChange={e => setTestName(e.target.value)}
              className="flex-[2] bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-bold text-gray-700 text-sm"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-400">I think I'll score:</span>
            <input 
              type="number" 
              placeholder="Score" 
              value={predictedScore}
              onChange={e => setPredictedScore(e.target.value)}
              className="w-20 bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-bold text-gray-700 text-center"
              required
            />
            <span className="text-sm font-bold text-gray-400">/</span>
            <input 
              type="number" 
              value={maxScore}
              onChange={e => setMaxScore(e.target.value)}
              className="w-16 bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-bold text-gray-700 text-center"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 active:scale-95 transition mt-2"
          >
            {loading ? 'Submitting...' : 'Lock it in 🤞'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-800">Past Predictions</h2>
        </div>
        <div className="overflow-y-auto p-4 space-y-3">
          {predictionsList.length === 0 ? (
            <p className="text-center text-gray-400 italic text-sm mt-4">No predictions yet.</p>
          ) : (
            predictionsList.map(p => (
              <div key={p.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/30">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800">{p.test_name} — {p.subject}</h3>
                </div>
                
                {!p.status ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-600">Your prediction: {p.predicted_score}/{p.max_score}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Awaiting result...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-600">Predicted: {p.predicted_score}/{p.max_score}</span>
                      <span className="font-semibold text-gray-600">Actual: {p.status.actual}/{p.status.actualMax}</span>
                    </div>
                    <div className={`p-2 rounded-lg text-center font-black ${
                      p.status.accuracy > 80 ? 'bg-green-100 text-green-700' :
                      p.status.accuracy >= 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Accuracy: {Math.round(p.status.accuracy)}% 🎯
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

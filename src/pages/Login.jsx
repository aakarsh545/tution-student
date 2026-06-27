import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { loginStudent } from '../lib/db';
import { Preferences } from '@capacitor/preferences';

export default function Login() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState(false);
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  useEffect(() => {
    checkAuth();
    loadStudents();
  }, []);

  const checkAuth = async () => {
    const { value } = await Preferences.get({ key: 'studentAuth' });
    if (value) {
      navigate('/');
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, standard')
        .order('name', { ascending: true });
      if (error) throw error;
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    setPinError(false);
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-advance
    if (value && index < 3) {
      inputRefs.current[index + 1].focus();
    }
    
    // Auto-submit when 4 digits entered
    if (index === 3 && value) {
      verifyPin(newPin.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const verifyPin = async (fullPin) => {
    try {
      setLoading(true);
      const student = await loginStudent(selectedStudent.name, fullPin);
      if (student) {
        await Preferences.set({ key: 'studentAuth', value: JSON.stringify(student) });
        // Set local storage for web compatibility too
        localStorage.setItem('studentAuth', JSON.stringify(student));
        navigate('/');
      } else {
        setPinError(true);
        setPin(['', '', '', '']);
        inputRefs.current[0].focus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedStudent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      {/* Top Header */}
      <div className="text-center mt-8 mb-8">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">TUITION PORTAL</p>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Student Login</h1>
      </div>

      {!selectedStudent ? (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3 pb-8">
            {students.map(student => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className="w-full bg-white border border-gray-100 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:border-indigo-100 transition active:scale-[0.98]"
              >
                <span className="font-bold text-gray-800 text-lg">{student.name}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{student.standard}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center mt-12">
          <h2 className="text-3xl font-black text-gray-800 mb-1">Hello, {selectedStudent.name.split(' ')[0]} 👋</h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-12">{selectedStudent.standard}</p>
          
          <div className={`flex gap-4 mb-6 ${pinError ? 'animate-shake' : ''}`}>
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="password"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={e => handlePinChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-16 h-20 text-center text-4xl font-black rounded-2xl border-2 shadow-sm focus:outline-none transition-all ${
                  pinError 
                    ? 'border-red-400 bg-red-50 text-red-600' 
                    : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-white text-gray-800'
                }`}
              />
            ))}
          </div>

          <div className="h-6">
            {pinError && (
              <p className="text-red-500 font-bold text-sm">Wrong PIN. Try again.</p>
            )}
          </div>
          
          <button 
            onClick={() => {
              setSelectedStudent(null);
              setPinError(false);
              setPin(['', '', '', '']);
            }}
            className="mt-8 text-sm font-bold text-gray-400 hover:text-gray-600 underline active:scale-95 transition"
          >
            Not {selectedStudent.name.split(' ')[0]}?
          </button>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}

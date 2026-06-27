import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getStudentFees } from '../lib/db';

export default function PaymentHistory() {
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const auth = localStorage.getItem('studentAuth');
      if (!auth) return navigate('/login');
      const student = JSON.parse(auth);
      
      const data = await getStudentFees(student.id);
      setFees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F3F4F6]"></div>;

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <div className="bg-white px-4 pt-12 pb-4 flex items-center border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-gray-50 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 ml-2">Payment History</h1>
      </div>

      <div className="p-4 space-y-3">
        {fees.length === 0 ? (
          <p className="text-center text-gray-400 font-medium p-8">No fee records found.</p>
        ) : (
          fees.map(fee => {
            const isPaid = fee.status === 'paid';
            const isPartial = fee.status === 'partial';
            const badgeColor = isPaid ? 'bg-green-100 text-green-700' : isPartial ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
            
            return (
              <div key={fee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-800">{fee.month}</h3>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                    {fee.status}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Amount Paid</p>
                    <p className="text-lg font-black text-gray-800">₹{fee.amount_paid}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Due</p>
                    <p className="text-lg font-black text-gray-400">₹{fee.amount_due}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

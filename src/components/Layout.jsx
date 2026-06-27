import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Trophy, Award, Target } from 'lucide-react';

export default function Layout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F3F4F6]">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <div className="bg-white border-t border-gray-100 flex justify-around items-center p-2 pb-safe shrink-0">
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Home</span>
        </NavLink>
        <NavLink 
          to="/leaderboard" 
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Trophy className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Rankings</span>
        </NavLink>
        <NavLink 
          to="/badges" 
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Award className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Badges</span>
        </NavLink>
        <NavLink 
          to="/predict" 
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Target className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Predict</span>
        </NavLink>
      </div>
    </div>
  );
}

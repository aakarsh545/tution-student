import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from './pages/Home';
import Login from './pages/Login';
import AttendanceHistory from './pages/AttendanceHistory';
import PaymentHistory from './pages/PaymentHistory';
import TestHistory from './pages/TestHistory';
import Leaderboard from './pages/Leaderboard';
import Badges from './pages/Badges';
import Predict from './pages/Predict';
import Layout from './components/Layout';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Main tabs with bottom nav */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/predict" element={<Predict />} />
        </Route>

        {/* History pages without bottom nav */}
        <Route path="/attendance-history" element={<AttendanceHistory />} />
        <Route path="/payment-history" element={<PaymentHistory />} />
        <Route path="/test-history" element={<TestHistory />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

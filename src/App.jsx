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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/attendance-history" element={<AttendanceHistory />} />
        <Route path="/payment-history" element={<PaymentHistory />} />
        <Route path="/test-history" element={<TestHistory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

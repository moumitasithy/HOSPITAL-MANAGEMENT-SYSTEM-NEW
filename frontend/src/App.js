import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// পেজগুলো ইমপোর্ট করা হচ্ছে - নিশ্চিত করুন ফাইলের নাম এবং পাথ সঠিক আছে
import Home from './pages/Home';
import Doctors from './pages/Doctor';
import Login from './pages/login'; 
import CreateAccount from './pages/createaccount'; // নিশ্চিত করুন ফাইলে export default আছে
import Dashboard from './pages/dashboard';
import Appointment from './pages/appoinment';
import Medicines from './pages/Medicines';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import DoctorDashboard from './pages/DoctorDashboard'; 
import DoctorSchedule from './pages/DoctorSchedule'; 

// প্রোটেক্টেড রাউট ফাংশন
const ProtectedRoute = ({ children, allowedRole }) => {
    const userString = localStorage.getItem('user');
    
    // ইউজার ডাটা না থাকলে সরাসরি লগইন-এ পাঠিয়ে দেবে
    if (!userString) {
        return <Navigate to="/login" />;
    }

    try {
        const user = JSON.parse(userString);
        if (user.role !== allowedRole) {
            return <Navigate to="/login" />;
        }
        return children;
    } catch (error) {
        console.error("User data parse error:", error);
        return <Navigate to="/login" />;
    }
};

function App() {
  return (
    <Router>
      <Routes>
        {/* সবার জন্য উন্মুক্ত রাউট */}
        <Route path="/" element={<Home />} />
        <Route path="/Doctors" element={<Doctors />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/medicines" element={<Medicines />} />

        {/* সাধারণ ড্যাশবোর্ড */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* ১. রিসেপশনিস্ট ড্যাশবোর্ড */}
        <Route 
          path="/receptionist-dashboard" 
          element={
            <ProtectedRoute allowedRole="Receptionist">
              <ReceptionistDashboard />
            </ProtectedRoute>
          } 
        />

        {/* ২. ডাক্তার ড্যাশবোর্ড */}
        <Route 
          path="/doctor-dashboard" 
          element={
            <ProtectedRoute allowedRole="Doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          } 
        />

        {/* ৩. ডাক্তার শিডিউল পেজ */}
        <Route 
          path="/doctor-schedule" 
          element={
            <ProtectedRoute allowedRole="Doctor">
              <DoctorSchedule />
            </ProtectedRoute>
          } 
        />

        {/* ভুল ইউআরএল দিলে হোমে ব্যাক করবে */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
}

export default App;
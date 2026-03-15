import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// পেজগুলো ইমপোর্ট করা হচ্ছে
import Home from './pages/Home';
import Doctors from './pages/Doctor';
import Login from './pages/login'; 
import CreateAccount from './pages/createaccount'; 
import AdminDashboard from './pages/Admin_Dashboard'; // আপনার অ্যাডমিন ড্যাশবোর্ড
import Appointment from './pages/appoinment';
import Medicines from './pages/Medicines';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import DoctorDashboard from './pages/DoctorDashboard'; 
import DoctorSchedule from './pages/DoctorSchedule'; 
import ManageSchedule from './pages/ManageSchedule';
import MedicalTests from './pages/MedicalTests';
import ServePatient from './pages/ServePatient';

// প্রোটেক্টেড রাউট ফাংশন
const ProtectedRoute = ({ children, allowedRole }) => {
    const userString = localStorage.getItem('user');
    
    if (!userString) {
        return <Navigate to="/login" />;
    }

    try {
        const user = JSON.parse(userString);
        // ইউজারের রোল যদি অনুমোদিত রোলের সাথে না মিলে তবে লগইনে পাঠাবে
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
        <Route path="/medical-tests" element={<MedicalTests />} />
        
        {/* ৩. অ্যাডমিন ড্যাশবোর্ড (শুধুমাত্র Admin দেখতে পারবে) */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRole="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* ১. রিসেপশনিস্ট ড্যাশবোর্ড */}
        <Route 
          path="/receptionist-dashboard" 
          element={
            <ProtectedRoute allowedRole="Receptionist">
              <ReceptionistDashboard />
            </ProtectedRoute>
          } 
        />

        {/* ২. ডাক্তার ড্যাশবোর্ড ও সংশ্লিষ্ট পেজগুলো */}
        <Route 
          path="/doctor-dashboard" 
          element={
            <ProtectedRoute allowedRole="Doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/doctor-schedule" 
          element={
            <ProtectedRoute allowedRole="Doctor">
              <DoctorSchedule />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/manage-schedule" 
          element={
            <ProtectedRoute allowedRole="Doctor">
              <ManageSchedule />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/serve-patient" 
          element={
            <ProtectedRoute allowedRole="Doctor">
              <ServePatient />
            </ProtectedRoute>
          } 
        />

        {/* ভুল ইউআরএল দিলে হোমে ব্যাক করবে */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  )
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// পেজগুলো ইমপোর্ট করা হচ্ছে
import Home from './pages/Home';
import Doctors from './pages/Doctor';
import Login from './pages/login'; 
import CreateAccount from './pages/createaccount'; 
import AdminDashboard from './pages/Admin_Dashboard';
import Appointment from './pages/appoinment';
import Medicines from './pages/Medicines';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import DoctorDashboard from './pages/DoctorDashboard'; 
import DoctorSchedule from './pages/DoctorSchedule'; 
import ManageSchedule from './pages/ManageSchedule';
import MedicalTests from './pages/MedicalTests';
import ServePatient from './pages/ServePatient';
import PendingDoctors from './pages/PendingDoctors';
import DoctorList from './pages/ReceptionistList'; // আপনার ফাইল স্ট্রাকচার অনুযায়ী নাম চেক করে নিন
import DoctorStats from './pages/DoctorStats';
import AdmitPatientForm from './pages/AdmitPatientForm'; // ফাইল নেম চেক করে নিন
// --- আপডেট করা প্রোটেক্টেড রাউট ফাংশন ---
const ProtectedRoute = ({ children, allowedRole }) => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('token'); // টোকেন চেক যোগ করা হয়েছে
    
    // ১. যদি টোকেন বা ইউজার ডাটা কোনোটিই না থাকে
    if (!token || !userString) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userString);
        
        // ২. ইউজারের রোল চেক করা
        if (user.role !== allowedRole) {
            // রোল না মিললে হোমে বা অন্য কোনো সেফ পেজে পাঠিয়ে দিন
            console.warn("Unauthorized access attempt!");
            return <Navigate to="/" replace />;
        }
        
        // ৩. সব ঠিক থাকলে পেজটি রেন্ডার হবে
        return children;
    } catch (error) {
        console.error("Auth error:", error);
        localStorage.clear(); // এরর হলে স্টোরেজ ক্লিয়ার করে লগইনে পাঠানো নিরাপদ
        return <Navigate to="/login" replace />;
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
        
        {/* অ্যাডমিন সেকশন */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRole="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pending-doctors" 
          element={
            <ProtectedRoute allowedRole="Admin">
              <PendingDoctors />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor-list" 
          element={
            <ProtectedRoute allowedRole="Admin">
              <DoctorList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor-stats" 
          element={
            <ProtectedRoute allowedRole="Admin">
              <DoctorStats />
            </ProtectedRoute>
          } 
        />

        {/* রিসেপশনিস্ট সেকশন */}
        <Route 
          path="/receptionist-dashboard" 
          element={
            <ProtectedRoute allowedRole="Receptionist">
              <ReceptionistDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admit-patient" 
          element={
            <ProtectedRoute allowedRole="Receptionist">
              <AdmitPatientForm />
            </ProtectedRoute>
          } 
        />

        {/* ডাক্তার সেকশন */}
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
// ফাইলের একদম শেষে এটি অবশ্যই থাকতে হবে
export default App;
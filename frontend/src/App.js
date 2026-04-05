import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
import DoctorList from './pages/ReceptionistList';
import DoctorStats from './pages/DoctorStats';
import AdmitPatientForm from './pages/AdmitPatientForm';

const ProtectedRoute = ({ children, allowedRole }) => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('token'); 
    
    if (!token || !userString) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userString);
        
       
        if (user.role !== allowedRole) {
            
            console.warn("Unauthorized access attempt!");
            return <Navigate to="/" replace />;
        }
        
       
        return children;
    } catch (error) {
        console.error("Auth error:", error);
        localStorage.clear();
        return <Navigate to="/login" replace />;
    }
};
function App() {
  return (
    <Router>
      <Routes>
        {}
        <Route path="/" element={<Home />} />
        <Route path="/Doctors" element={<Doctors />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/medical-tests" element={<MedicalTests />} />
        
        {}
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

        {}
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

        {}
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

        {}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App;
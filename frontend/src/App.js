import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// পেজগুলো ইমপোর্ট করা হচ্ছে
// আপনার ফাইলের নাম (Capital/Small letter) ঠিক আছে কি না চেক করে নিন
import Home from './pages/Home';
import Doctors from './pages/Doctor';
import Login from './pages/login'; 
import CreateAccount from './pages/createaccount';
import Dashboard from './pages/dashboard';
import Appointment from './pages/appoinment';

function App() {
  return (
    <Router>
      <Routes>
        {/* ১. হোম পেজ (সবার আগে এটি দেখাবে) */}
        <Route path="/" element={<Home />} />
        
        {/* ২. ডাক্তারদের লিস্ট পেজ */}
        <Route path="/Doctors" element={<Doctors />} />
        
        {/* ৩. লগইন পেজ (এখানে রোল অনুযায়ী টাইটেল চেঞ্জ হবে) */}
        <Route path="/login" element={<Login />} />
        
        {/* ৪. নতুন অ্যাকাউন্ট খোলার পেজ */}
        <Route path="/create-account" element={<CreateAccount />} />
        
        {/* ৫. ড্যাশবোর্ড (লগইন করার পর এখানে যাবে) */}
        <Route path="/dashboard" element={<Dashboard />}
         />
         <Route path="/appointment" element={<Appointment />} />
      </Routes>
    </Router>
  );
}

export default App;
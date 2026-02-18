import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarPlus, FaUserMd, FaSignOutAlt, FaHospitalUser } from 'react-icons/fa';
import bgImage from '../assets/Doctor_schedule.jpg'; // নিশ্চিত করুন ইমেজ পাথ ঠিক আছে

const DoctorDashboard = () => {
    const navigate = useNavigate();
    
    // লোকাল স্টোরেজ থেকে লগইন করা ডাক্তারের তথ্য নেওয়া
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const styles = {
        container: {
            height: '100vh',
            width: '100%',
            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: "'Poppins', sans-serif",
            color: 'white'
        },
        glassCard: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(15px)',
            padding: '50px',
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
            textAlign: 'center',
            maxWidth: '600px',
            width: '90%'
        },
        welcomeText: {
            fontSize: '32px',
            marginBottom: '10px',
            fontWeight: '700'
        },
        subText: {
            fontSize: '18px',
            marginBottom: '35px',
            opacity: '0.8'
        },
        buttonGroup: {
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
        },
        scheduleBtn: {
            padding: '15px 35px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: '#00796b',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'transform 0.2s, background 0.3s',
            boxShadow: '0 5px 15px rgba(0, 121, 107, 0.4)'
        },
        logoutBtn: {
            padding: '15px 35px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'transform 0.2s',
            boxShadow: '0 5px 15px rgba(211, 47, 47, 0.4)'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.glassCard}>
                <div style={{ marginBottom: '20px' }}>
                    <FaUserMd size={80} color="#00bfa5" />
                </div>
                
                <h1 style={styles.welcomeText}>Welcome, Dr. {user?.name || 'Doctor'}</h1>
                <p style={styles.subText}>
                    Manage your medical practice, set availability, and track your appointments from here.
                </p>

                <div style={styles.buttonGroup}>
                    {/* এই বাটনটি ক্লিক করলে DoctorSchedule পেজে নিয়ে যাবে */}
                    <button 
                        onClick={() => navigate('/doctor-schedule')} 
                        style={styles.scheduleBtn}
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        <FaCalendarPlus /> Set My Schedule
                    </button>

                    <button 
                        onClick={handleLogout} 
                        style={styles.logoutBtn}
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        <FaSignOutAlt /> Logout
                    </button>
                </div>

                <div style={{ marginTop: '40px', fontSize: '14px', opacity: '0.6' }}>
                    <p><FaHospitalUser /> Hospital Management System | Provider Portal</p>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
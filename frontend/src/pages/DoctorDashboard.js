import React, { useEffect } from 'react'; // useEffect যোগ করা হয়েছে
import { useNavigate } from 'react-router-dom';
import {
    FaCalendarPlus, FaUserMd, FaSignOutAlt,
    FaHospitalUser, FaStethoscope, FaCalendarCheck
} from 'react-icons/fa';
import bgImage from '../assets/Doctor_schedule.jpg';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token'); // টোকেন রিড করা

    // ১. সিকিউরিটি চেক: টোকেন না থাকলে লগইন পেজে পাঠিয়ে দিবে
    useEffect(() => {
        if (!token || user?.role !== 'Doctor') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [token, user, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // সরাসরি window.location ব্যবহার করা ভালো যাতে সব স্টেট ক্লিয়ার হয়
        window.location.href = '/login';
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
            maxWidth: '800px',
            width: '95%'
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
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
        },
        baseBtn: {
            padding: '15px 30px',
            fontSize: '15px',
            fontWeight: 'bold',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease',
        },
        scheduleBtn: {
            backgroundColor: '#00796b',
            boxShadow: '0 5px 15px rgba(0, 121, 107, 0.4)'
        },
        manageBtn: {
            backgroundColor: '#f57c00',
            boxShadow: '0 5px 15px rgba(245, 124, 0, 0.4)'
        },
        serveBtn: {
            backgroundColor: '#0097a7',
            boxShadow: '0 5px 15px rgba(0, 151, 167, 0.4)'
        },
        logoutBtn: {
            backgroundColor: '#d32f2f',
            boxShadow: '0 5px 15px rgba(211, 47, 47, 0.4)'
        }
    };

    const handleMouseEnter = (e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.filter = 'brightness(1.1)';
    };

    const handleMouseLeave = (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.filter = 'brightness(1)';
    };

    // যদি ইউজার না থাকে তবে ব্ল্যাঙ্ক স্ক্রিন দেখাবে যতক্ষণ রিডাইরেক্ট না হয়
    if (!token) return null;

    return (
        <div style={styles.container}>
            <div style={styles.glassCard}>
                <div style={{ marginBottom: '20px' }}>
                    <FaUserMd size={80} color="#00bfa5" />
                </div>

                <h1 style={styles.welcomeText}>Welcome, Dr. {user?.name || 'Doctor'}</h1>
                <p style={styles.subText}>
                    Manage your medical practice, set availability, and control your schedule status from one place.
                </p>

                <div style={styles.buttonGroup}>
                    <button
                        onClick={() => navigate('/doctor-schedule')}
                        style={{ ...styles.baseBtn, ...styles.scheduleBtn }}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <FaCalendarPlus /> Set New Schedule
                    </button>

                    <button
                        onClick={() => navigate('/manage-schedule')}
                        style={{ ...styles.baseBtn, ...styles.manageBtn }}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <FaCalendarCheck /> Manage Schedule
                    </button>

                    <button
                        onClick={() => navigate('/serve-patient')}
                        style={{ ...styles.baseBtn, ...styles.serveBtn }}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <FaStethoscope /> Serve
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{ ...styles.baseBtn, ...styles.logoutBtn }}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
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
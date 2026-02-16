import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaPhoneAlt, FaSignInAlt, FaCapsules, FaCalendarCheck } from 'react-icons/fa'; 
import coverImage from '../assets/home.jpg'; 

const Home = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    const styles = {
        container: {
            height: '100vh', width: '100%',
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${coverImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            fontFamily: "'Segoe UI', Roboto, sans-serif", color: 'white',
            overflow: 'hidden'
        },
        topBar: {
            display: 'flex', justifyContent: 'space-between',
            padding: '10px 50px', backgroundColor: '#0097a7', fontSize: '14px'
        },
        navbar: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '15px 50px', backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        },
        navLinks: {
            display: 'flex', gap: '30px', listStyle: 'none',
            fontSize: '16px', fontWeight: '600', alignItems: 'center', margin: 0
        },
        appointmentLink: {
            cursor: 'pointer', 
            backgroundColor: '#ffeb3b', 
            color: '#333', 
            padding: '8px 15px', 
            borderRadius: '5px',
            transition: '0.3s'
        },
        dropdownContainer: { position: 'relative', cursor: 'pointer' },
        dropdownMenu: {
            position: 'absolute', top: '100%', right: '0',
            backgroundColor: 'white', color: '#333', borderRadius: '5px',
            width: '180px', boxShadow: '0px 10px 20px rgba(0,0,0,0.3)',
            display: showDropdown ? 'block' : 'none', zIndex: 1000, marginTop: '10px'
        },
        dropdownItem: { padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #eee' }
    };

    return (
        <div style={styles.container}>
            {/* Top Contact Bar */}
            <div style={styles.topBar}>
                <span><FaClock style={{marginRight: '5px'}} /> 24/7 Service Available</span>
                <span><FaPhoneAlt style={{marginRight: '5px'}} /> Emergency: +880 123456789</span>
            </div>

            {/* Navigation Bar */}
            <nav style={styles.navbar}>
                <h2 style={{letterSpacing: '1px', margin: 0, cursor: 'pointer'}} onClick={() => navigate('/')}>
                    CITY HOSPITAL
                </h2>
                <ul style={styles.navLinks}>
                    <li style={{cursor: 'pointer'}} onClick={() => navigate('/')}>HOME</li>
                    <li style={{cursor: 'pointer'}} onClick={() => navigate('/doctors')}>DOCTORS</li>
                    
                    {/* সরাসরি অ্যাপয়েন্টমেন্ট বাটন (No Login Required) */}
                    <li 
                        style={styles.appointmentLink} 
                        onClick={() => navigate('/appointment')}
                    >
                        <FaCalendarCheck style={{marginRight: '5px'}} /> APPOINTMENT
                    </li>

                    <li 
                        style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}} 
                        onClick={() => navigate('/medicines')}
                    >
                        MEDICINES <FaCapsules />
                    </li>
                    
                    {/* স্টাফ লগইন ড্রপডাউন */}
                    <div 
                        style={styles.dropdownContainer}
                        onMouseEnter={() => setShowDropdown(true)}
                        onMouseLeave={() => setShowDropdown(false)}
                    >
                        <li style={{color: '#00d4ff', display: 'flex', alignItems: 'center', gap: '5px'}}>
                            STAFF LOGIN <FaSignInAlt />
                        </li>
                        <div style={styles.dropdownMenu}>
                            <div style={styles.dropdownItem} onClick={() => navigate('/login', {state: {role: 'Doctor'}})}>Doctor Login</div>
                            <div style={styles.dropdownItem} onClick={() => navigate('/login', {state: {role: 'Admin'}})}>Admin Login</div>
                            <div style={styles.dropdownItem} onClick={() => navigate('/login', {state: {role: 'Receptionist'}})}>Receptionist</div>
                        </div>
                    </div>
                </ul>
            </nav>

            {/* Hero Section */}
            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '75vh', textAlign: 'center'}}>
                <h1 style={{fontSize: '4rem', fontWeight: 'bold', marginBottom: '10px', textShadow: '2px 2px 10px rgba(0,0,0,0.5)'}}>
                    Bangladesh Medical Care
                </h1>
                <p style={{fontSize: '1.4rem', marginBottom: '30px', fontWeight: '300'}}>
                    Fastest Doctor Appointment & Healthcare Service
                </p>
                
                <div style={{display: 'flex', gap: '20px'}}>
                    <button 
                        onClick={() => navigate('/appointment')}
                        style={{
                            padding: '15px 40px', 
                            backgroundColor: '#0097a7', color: 'white', 
                            border: 'none', borderRadius: '30px', 
                            fontWeight: 'bold', cursor: 'pointer', fontSize: '18px',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.3)', transition: '0.3s'
                        }}
                    >
                        Book Appointment Now
                    </button>

                    <button 
                        onClick={() => navigate('/medicines')}
                        style={{
                            padding: '15px 40px', 
                            backgroundColor: 'white', color: '#0097a7', 
                            border: '2px solid white', borderRadius: '30px', 
                            fontWeight: 'bold', cursor: 'pointer', fontSize: '18px',
                            transition: '0.3s'
                        }}
                    >
                        Order Medicines
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaPhoneAlt, FaSignInAlt } from 'react-icons/fa';
import coverImage from '../assets/home.jpg'; 

const Home = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    const styles = {
        container: {
            height: '100vh', width: '100%',
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${coverImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            fontFamily: "'Segoe UI', Roboto, sans-serif", color: 'white'
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
            fontSize: '16px', fontWeight: '600', alignItems: 'center'
        },
        dropdownContainer: { position: 'relative', paddingBottom: '10px', cursor: 'pointer' },
        dropdownMenu: {
            position: 'absolute', top: '100%', right: '0',
            backgroundColor: 'white', color: '#333', borderRadius: '5px',
            width: '180px', boxShadow: '0px 10px 20px rgba(0,0,0,0.3)',
            display: showDropdown ? 'block' : 'none', zIndex: 1000, marginTop: '5px'
        },
        dropdownItem: { padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #eee' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.topBar}>
                <span><FaClock style={{marginRight: '5px'}} /> 24*7 Available</span>
                <span><FaPhoneAlt style={{marginRight: '5px'}} /> Call: +880 123456789</span>
            </div>

            <nav style={styles.navbar}>
                <h2 style={{letterSpacing: '1px', margin: 0}}>CITY HOSPITAL</h2>
                <ul style={styles.navLinks}>
                    <li style={{cursor: 'pointer'}} onClick={() => navigate('/')}>HOME</li>
                    
                    {/* ডাক্তার পেজে যাওয়ার লিঙ্ক */}
                    <li style={{cursor: 'pointer'}} onClick={() => navigate('/doctors')}>DOCTORS</li>
                    
                    <div 
                        style={styles.dropdownContainer}
                        onMouseEnter={() => setShowDropdown(true)}
                        onMouseLeave={() => setShowDropdown(false)}
                    >
                        <li style={{color: '#00d4ff', display: 'flex', alignItems: 'center', gap: '5px'}}>
                            SIGN IN <FaSignInAlt />
                        </li>
                        <div style={styles.dropdownMenu}>
                            <div style={styles.dropdownItem} onClick={() => navigate('/login', {state: {role: 'Patient'}})}>Patient Login</div>
                            <div style={styles.dropdownItem} onClick={() => navigate('/login', {state: {role: 'Doctor'}})}>Doctor Login</div>
                            <div style={styles.dropdownItem} onClick={() => navigate('/login', {state: {role: 'Admin'}})}>Admin Login</div>
                        </div>
                    </div>
                    <li style={{cursor: 'pointer'}}>CONTACT</li>
                </ul>
            </nav>

            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '70vh'}}>
                <h1 style={{fontSize: '4.5rem', fontWeight: 'bold'}}>Bangladesh Medical Care</h1>
                <p style={{fontSize: '1.2rem'}}>Your Health is Our Priority</p>
            </div>
        </div>
    );
};

export default Home;
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import coverImage from '../assets/login.jpg'; 

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
   
    const userRole = location.state?.role || 'User';
    const redirectPath = location.state?.from || '/'; 
    const doctorData = location.state?.doctorName;

    const styles = {
        container: {
            height: '100vh', width: '100%',
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${coverImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontFamily: "'Segoe UI', sans-serif"
        },
        loginBox: {
            backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(15px)',
            padding: '40px', borderRadius: '20px', width: '400px', textAlign: 'center',
            color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        },
        input: {
            width: '100%', padding: '12px', margin: '10px 0', borderRadius: '8px',
            border: 'none', fontSize: '16px', outline: 'none'
        },
        button: {
            width: '100%', padding: '12px',
            backgroundColor: userRole === 'Admin' ? '#ff4d4d' : '#00d4ff',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
            marginTop: '20px', transition: '0.3s'
        }
    };

  
    const handleLogin = (e) => {
        e.preventDefault(); 
        
        console.log("Logging in as:", userRole);
        
      
        navigate(redirectPath, { 
            state: { 
                doctorName: doctorData,
                role: userRole 
            } 
        });
    };

    return (
        <div style={styles.container}>
            <div style={styles.loginBox}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{userRole} Login</h2>
                
                {}
                <form onSubmit={handleLogin}>
                    <input style={styles.input} type="text" placeholder="Username" required />
                    <input style={styles.input} type="password" placeholder="Password" required />
                    
                    {}
                    <button style={styles.button} type="submit">
                        Login
                    </button>
                </form>

                <p style={{ marginTop: '20px', fontSize: '15px' }}>
                    Don't have an account? 
                    <Link to="/create-account" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 'bold', marginLeft: '5px' }}>
                         Create Account
                    </Link>
                </p>
                <button onClick={() => navigate('/')} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                    ← Back to Home
                </button>
            </div>
        </div>
    );
};

export default Login;
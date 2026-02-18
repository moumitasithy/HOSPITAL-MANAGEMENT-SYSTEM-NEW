import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import coverImage from '../assets/login.jpg'; 

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // আগের পেজ থেকে আসা রোল (অপশনাল)
    const userRole = location.state?.role || 'User';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault(); 
        
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password }),
            });

            const result = await response.json();

            if (response.ok) {
                const userData = result.user; 
                
                // ইউজার ডাটা লোকাল স্টোরেজে সেভ করা (যাতে প্রোটেক্টেড রাউট কাজ করে)
                localStorage.setItem('user', JSON.stringify(userData));
                
                alert(`Welcome ${userData.name}!`);
                
                // --- রোল অনুযায়ী অটোমেটিক ড্যাশবোর্ডে পাঠানো ---
                // ডাটাবেসে যদি 'Doctor' থাকে তবে '/doctor-dashboard' এ যাবে
                if (userData.role === 'Doctor') {
                    navigate('/doctor-dashboard');
                } 
                // ডাটাবেসে যদি 'Receptionist' থাকে তবে '/receptionist-dashboard' এ যাবে
                else if (userData.role === 'Receptionist') {
                    navigate('/receptionist-dashboard');
                } 
                // অ্যাডমিন হলে (যদি থাকে)
                else if (userData.role === 'Admin') {
                    navigate('/admin-dashboard');
                } 
                // সাধারণ ইউজার/পেশেন্ট হলে
                else {
                    navigate('/dashboard'); 
                }
                
            } else {
                alert(result.error || "Login failed! Please check your credentials.");
            }
        } catch (error) {
            alert("Server not responding. Please check if your backend is running.");
        }
    };

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
            border: 'none', fontSize: '16px', outline: 'none', color: '#333'
        },
        button: {
            width: '100%', padding: '12px',
            backgroundColor: userRole === 'Admin' ? '#ff4d4d' : '#00d4ff',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
            marginTop: '20px', transition: '0.3s'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.loginBox}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{userRole} Login</h2>
                
                <form onSubmit={handleLogin}>
                    <input 
                        name="email" 
                        style={styles.input} 
                        type="email" 
                        placeholder="Email Address" 
                        required 
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <input 
                        name="password" 
                        style={styles.input} 
                        type="password" 
                        placeholder="Password" 
                        required 
                        value={formData.password}
                        onChange={handleChange}
                    />
                    
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
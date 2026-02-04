import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import coverImage from '../assets/createaccount.jpg'; 

const CreateAccount = () => {
    const navigate = useNavigate();
    
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'Doctor' 
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

      
        const userData = {
            name: formData.name,
            email: formData.email,
            phone_number: formData.phone,
            password: formData.password, 
            role: formData.role
        };

        try {
           const response = await fetch('http://localhost:5000/api/createaccount', { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
});
            

            const result = await response.json();

            if (response.ok) {
                alert("Account created successfully!");
                navigate('/login');
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            alert("Connection Failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    
    const styles = {
        container: { height: '100vh', width: '100%', backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Segoe UI', Roboto, sans-serif" },
        formBox: { backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '30px 40px', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)', width: '450px', textAlign: 'center', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)' },
        inputGroup: { marginBottom: '15px', textAlign: 'left' },
        input: { width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '16px', outline: 'none' },
        select: { width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '16px', backgroundColor: '#fff', cursor: 'pointer' },
        button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' },
        link: { color: '#00d4ff', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'none' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formBox}>
                <h2 style={{ marginBottom: '20px' }}>Join Our Hospital</h2>
                
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <input name="name" style={styles.input} type="text" placeholder="Full Name" required onChange={handleChange} />
                    </div>

                    <div style={styles.inputGroup}>
                        <input name="email" style={styles.input} type="email" placeholder="Email Address" required onChange={handleChange} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <input name="phone" style={{ ...styles.input, flex: 2 }} type="tel" placeholder="Phone Number" required onChange={handleChange} />
                       
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Register As:</label>
                        <select name="role" style={styles.select} value={formData.role} onChange={handleChange}>
                            
                            <option value="Doctor">Doctor</option>
                             <option value="Admin">Admin</option>
                              
                            
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <input name="password" style={styles.input} type="password" placeholder="Create Password" required onChange={handleChange} />
                    </div>

                    <button style={styles.button} type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                </form>

                <p style={{ marginTop: '15px', fontSize: '14px' }}>
                    Already have an account? <span style={styles.link} onClick={() => navigate('/login')}>Login</span>
                </p>
            </div>
        </div>
    );
};

export default CreateAccount;
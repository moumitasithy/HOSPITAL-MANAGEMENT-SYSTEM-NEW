import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import coverImage from '../assets/createaccount.jpg'; 

const CreateAccount = () => {
    const navigate = useNavigate();
    
    const [specList, setSpecList] = useState([]);
    const [qualList, setQualList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '',
        role: 'Doctor', consultation_fee: '',
        specialization: '', qualification: ''   
    });

   useEffect(() => {
    const fetchDropdownData = async () => {
        try {
            const specRes = await fetch('http://localhost:5000/api/specializations');
            // এন্ডপয়েন্টটি ছোট হাতের অক্ষরে লিখুন
            const qualRes = await fetch('http://localhost:5000/api/qualifications');
            
            const sData = await specRes.json();
            const qData = await qualRes.json();
            
            // ডাটাবেস কলামের সাথে মিলিয়ে নিশ্চিত করুন ডাটা আসছে
            setSpecList(Array.isArray(sData) ? sData : []);
            setQualList(Array.isArray(qData) ? qData : []);
        } catch (err) {
            console.error("Error:", err);
        }
    };
    fetchDropdownData();
}, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('phone_number', formData.phone);
        data.append('password', formData.password);
        data.append('role', formData.role);

        if (formData.role === 'Doctor') {
            data.append('image', selectedFile);
            data.append('consultation_fee', formData.consultation_fee);
            data.append('specialization', formData.specialization);
            data.append('qualification', formData.qualification);
        }

        try {
            const response = await fetch('http://localhost:5000/api/createaccount', { 
                method: 'POST',
                body: data, 
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

    // স্টাইল আগের মতোই থাকবে
    const styles = {
        container: { height: '100vh', width: '100%', backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Segoe UI', Roboto, sans-serif" },
        formBox: { backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '30px 40px', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)', width: '450px', textAlign: 'center', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', maxHeight: '90vh', overflowY: 'auto' },
        inputGroup: { marginBottom: '15px', textAlign: 'left' },
        input: { width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '16px', outline: 'none', boxSizing: 'border-box' },
        select: { width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '16px', backgroundColor: '#fff', cursor: 'pointer', boxSizing: 'border-box', color: '#333' },
        button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' },
        link: { color: '#00d4ff', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'none' },
        label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#ddd' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formBox}>
                <h2 style={{ marginBottom: '20px' }}>Join Our Hospital</h2>
                <form onSubmit={handleSubmit}>
                    <input name="name" style={{...styles.input, marginBottom: '15px'}} type="text" placeholder="Full Name" required onChange={handleChange} />
                    <input name="email" style={{...styles.input, marginBottom: '15px'}} type="email" placeholder="Email Address" required onChange={handleChange} />
                    <input name="phone" style={{...styles.input, marginBottom: '15px'}} type="tel" placeholder="Phone Number" required onChange={handleChange} />

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Register As:</label>
                        <select name="role" style={styles.select} value={formData.role} onChange={handleChange}>
                            <option value="Doctor">Doctor</option>
                            <option value="Admin">Admin</option>
                            <option value="Receptionist">Receptionist</option>
                        </select>
                    </div>

                    {formData.role === 'Doctor' && (
                        <>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Upload Profile Image:</label>
                                <input style={{...styles.input, padding: '5px'}} type="file" accept="image/*" required onChange={handleFileChange} />
                            </div>
                            <input name="consultation_fee" style={{...styles.input, marginBottom: '15px'}} type="number" placeholder="Consultation Fee (BDT)" required onChange={handleChange} />
                            
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Specialization:</label>
                                <select name="specialization" style={styles.select} required onChange={handleChange} value={formData.specialization}>
                                    <option value="">Select Specialization</option>
                                    {specList?.map(spec => (
                                        <option key={spec.specialization_id} value={spec.specialization_id}>
                                            {spec.specialization_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Qualification:</label>
                                <select name="qualification" style={styles.select} required onChange={handleChange} value={formData.qualification}>
    <option value="">Select Qualification</option>
    {/* qualList?.map ব্যবহার করলে ডাটা না থাকলেও পেজ ক্রাশ করবে না */}
    {qualList?.map((qual) => (
        <option key={qual.qualification_id} value={qual.qualification_id}>
            {qual.qualification_name}
        </option>
    ))}
</select>
                            </div>
                        </>
                    )}

                    <input name="password" style={{...styles.input, marginTop: '15px'}} type="password" placeholder="Create Password" required onChange={handleChange} />

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
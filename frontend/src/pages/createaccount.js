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
        specialization: [], // অ্যারে হিসেবে পরিবর্তন
        qualification: []    // অ্যারে হিসেবে পরিবর্তন
    });

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const specRes = await fetch('http://localhost:5000/api/specializations');
                const qualRes = await fetch('http://localhost:5000/api/qualifications');
                
                const sData = await specRes.json();
                const qData = await qualRes.json();
                
                setSpecList(Array.isArray(sData) ? sData : []);
                setQualList(Array.isArray(qData) ? qData : []);
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        fetchDropdownData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // মাল্টিপল চেকবক্স হ্যান্ডেল করার ফাংশন
    const handleCheckboxChange = (e, type) => {
        const value = e.target.value;
        const isChecked = e.target.checked;

        setFormData(prevData => {
            const currentList = [...prevData[type]];
            if (isChecked) {
                return { ...prevData, [type]: [...currentList, value] };
            } else {
                return { ...prevData, [type]: currentList.filter(id => id !== value) };
            }
        });
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // ভ্যালিডেশন: ডাক্তার হলে অন্তত একটি স্পেশালাইজেশন ও কোয়ালিফিকেশন লাগবে
        if (formData.role === 'Doctor') {
            if (formData.specialization.length === 0 || formData.qualification.length === 0) {
                return alert("Please select at least one Specialization and Qualification");
            }
        }

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
            // অ্যারে ডাটাকে JSON স্ট্রিং হিসেবে পাঠানো হচ্ছে
            data.append('specialization', JSON.stringify(formData.specialization));
            data.append('qualification', JSON.stringify(formData.qualification));
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

    const styles = {
        container: { height: '100vh', width: '100%', backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Segoe UI', Roboto, sans-serif" },
        formBox: { backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '30px 40px', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)', width: '480px', textAlign: 'center', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', maxHeight: '95vh', overflowY: 'auto' },
        inputGroup: { marginBottom: '15px', textAlign: 'left' },
        input: { width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '16px', outline: 'none', boxSizing: 'border-box' },
        select: { width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '16px', backgroundColor: '#fff', cursor: 'pointer', boxSizing: 'border-box', color: '#333' },
        multiSelectBox: { maxHeight: '120px', overflowY: 'auto', backgroundColor: 'white', padding: '10px', borderRadius: '8px', marginTop: '5px' },
        checkboxItem: { color: '#333', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' },
        button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' },
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
                            
                            {/* মাল্টিপল স্পেশালাইজেশন সেকশন */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Specializations (Select Multiple):</label>
                                <div style={styles.multiSelectBox}>
                                    {specList.map(spec => (
                                        <div key={spec.specialization_id} style={styles.checkboxItem}>
                                            <input 
                                                type="checkbox" 
                                                value={spec.specialization_id} 
                                                checked={formData.specialization.includes(spec.specialization_id.toString())}
                                                onChange={(e) => handleCheckboxChange(e, 'specialization')}
                                            />
                                            {spec.specialization_name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* মাল্টিপল কোয়ালিফিকেশন সেকশন */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Qualifications (Select Multiple):</label>
                                <div style={styles.multiSelectBox}>
                                    {qualList.map(qual => (
                                        <div key={qual.qualification_id} style={styles.checkboxItem}>
                                            <input 
                                                type="checkbox" 
                                                value={qual.qualification_id} 
                                                checked={formData.qualification.includes(qual.qualification_id.toString())}
                                                onChange={(e) => handleCheckboxChange(e, 'qualification')}
                                            />
                                            {qual.qualification_name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <input name="password" style={{...styles.input, marginTop: '10px'}} type="password" placeholder="Create Password" required onChange={handleChange} />

                    <button style={styles.button} type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateAccount;
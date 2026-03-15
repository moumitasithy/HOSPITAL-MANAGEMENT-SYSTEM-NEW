import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateAccount = () => {
    const navigate = useNavigate();
    
    // ডাটাবেস থেকে আসা লিস্ট রাখার জন্য স্টেট
    const [specList, setSpecList] = useState([]);
    const [qualList, setQualList] = useState([]);
    const [role, setRole] = useState('Doctor');
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        consultation_fee: '',
        specialization: [], // এখানে সিলেক্ট করা ID গুলোর অ্যারে থাকবে
        qualification: []   // এখানে সিলেক্ট করা ID গুলোর অ্যারে থাকবে
    });

    // ডাটাবেস থেকে স্পেশালাইজেশন এবং কোয়ালিফিকেশন লোড করা
    useEffect(() => {
        const fetchLists = async () => {
            try {
                const specRes = await fetch('http://localhost:5000/api/specializations');
                const qualRes = await fetch('http://localhost:5000/api/qualifications');
                
                const sData = await specRes.json();
                const qData = await qualRes.json();
                
                setSpecList(Array.isArray(sData) ? sData : []);
                setQualList(Array.isArray(qData) ? qData : []);
            } catch (err) {
                console.error("Error fetching lists:", err);
            }
        };
        fetchLists();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // মাল্টিপল চেকবক্স হ্যান্ডেল করার ফাংশন
    const handleCheckboxChange = (e, type) => {
        const value = parseInt(e.target.value);
        const isChecked = e.target.checked;

        setFormData(prev => {
            const currentList = [...prev[type]];
            const updatedList = isChecked 
                ? [...currentList, value] 
                : currentList.filter(id => id !== value);
            return { ...prev, [type]: updatedList };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('phone_number', formData.phone_number);
        data.append('password', formData.password);
        data.append('role', role);

        if (role === 'Doctor') {
            data.append('consultation_fee', formData.consultation_fee || 0);
            // অ্যারেগুলোকে স্ট্রিং হিসেবে পাঠানো হচ্ছে যাতে ব্যাকএন্ডে JSON.parse করা যায়
            data.append('specialization', JSON.stringify(formData.specialization));
            data.append('qualification', JSON.stringify(formData.qualification));
            if (image) data.append('image', image);
        } else {
            data.append('consultation_fee', 0);
            data.append('specialization', JSON.stringify([]));
            data.append('qualification', JSON.stringify([]));
        }

        try {
            const response = await fetch('http://localhost:5000/api/createaccount', {
                method: 'POST',
                body: data,
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                navigate('/login');
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            alert("Server Error! Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={{ textAlign: 'center', color: '#fff', marginBottom: '20px' }}>Join Our Hospital</h2>
                
                <input style={styles.input} name="name" placeholder="Full Name" onChange={handleChange} required />
                <input style={styles.input} name="email" type="email" placeholder="Email Address" onChange={handleChange} required />
                <input style={styles.input} name="phone_number" placeholder="Phone Number" onChange={handleChange} required />
                
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Register As:</label>
                    <select style={styles.select} value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="Doctor">Doctor</option>
                        <option value="Receptionist">Receptionist</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>

                {/* শুধুমাত্র Doctor সিলেক্ট করলে নিচের অপশনগুলো আসবে */}
                {role === 'Doctor' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <input style={styles.input} name="consultation_fee" type="number" placeholder="Consultation Fee (BDT)" required onChange={handleChange} />
                        
                        <label style={styles.label}>Select Specializations:</label>
                        <div style={styles.multiSelectBox}>
                            {specList.map(spec => (
                                <label key={spec.specialization_id} style={styles.checkboxItem}>
                                    <input 
                                        type="checkbox" 
                                        value={spec.specialization_id} 
                                        onChange={(e) => handleCheckboxChange(e, 'specialization')} 
                                    />
                                    {spec.specialization_name}
                                </label>
                            ))}
                        </div>

                        <label style={styles.label}>Select Qualifications:</label>
                        <div style={styles.multiSelectBox}>
                            {qualList.map(qual => (
                                <label key={qual.qualification_id} style={styles.checkboxItem}>
                                    <input 
                                        type="checkbox" 
                                        value={qual.qualification_id} 
                                        onChange={(e) => handleCheckboxChange(e, 'qualification')} 
                                    />
                                    {qual.qualification_name}
                                </label>
                            ))}
                        </div>

                        <label style={styles.label}>Profile Image:</label>
                        <input style={styles.input} type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} required />
                    </div>
                )}

                <input style={styles.input} name="password" type="password" placeholder="Create Password" onChange={handleChange} required />

                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Registering...' : 'Create Account'}
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: '20px' },
    form: { background: 'rgba(255, 255, 255, 0.1)', padding: '30px', borderRadius: '20px', backdropFilter: 'blur(15px)', width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' },
    input: { margin: '10px 0', padding: '12px', borderRadius: '8px', border: 'none', outline: 'none', backgroundColor: 'rgba(255,255,255,0.9)', fontSize: '15px' },
    select: { padding: '10px', borderRadius: '8px', border: 'none', width: '100%', marginTop: '5px', cursor: 'pointer' },
    multiSelectBox: { maxHeight: '120px', overflowY: 'auto', backgroundColor: '#fff', padding: '10px', borderRadius: '8px', marginTop: '5px' },
    checkboxItem: { display: 'flex', alignItems: 'center', gap: '10px', color: '#333', fontSize: '14px', marginBottom: '8px', cursor: 'pointer' },
    button: { marginTop: '20px', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#4cc9f0', color: '#1a1a2e', fontSize: '17px', fontWeight: 'bold', cursor: 'pointer' },
    label: { color: '#ddd', fontSize: '13px', marginTop: '10px', display: 'block' },
    inputGroup: { margin: '10px 0' }
};

export default CreateAccount;
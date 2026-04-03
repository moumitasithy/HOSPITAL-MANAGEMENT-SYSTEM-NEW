import React, { useState, useEffect } from 'react';

const AdmitPatientForm = ({ getHeaders }) => {
    const [doctors, setDoctors] = useState([]);
    const [diseases, setDiseases] = useState([]);
    const [beds, setBeds] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', age: '', gender: '',
        blood_group: '', admission_date: '', disease_id: '',
        doctor_id: '', bed_no: ''
    });

    useEffect(() => {
        // ডাক্তার এবং রোগের লিস্ট লোড করা
        fetch('http://localhost:5000/api/get-admission-data', { headers: getHeaders() })
            .then(res => res.json())
            .then(data => {
                setDoctors(data.doctors);
                setDiseases(data.diseases);
            });
    }, []);

    // ক্যাটাগরি চেঞ্জ হলে এভেইলএবল বেড আনা
    const handleCategoryChange = async (cat) => {
    setSelectedCategory(cat);
    if (!cat) {
        setBeds([]);
        return;
    }
    try {
        const res = await fetch(`http://localhost:5000/api/available-beds/${cat}`, { headers: getHeaders() });
        const data = await res.json();
        // নিশ্চিত করুন যে ডাটাটি একটি অ্যারে
        setBeds(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error(err);
        setBeds([]);
    }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch('http://localhost:5000/api/admit-patient', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
            alert(data.message);
            window.location.reload();
        } else {
            alert(data.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={styles.formGrid}>
            <input placeholder="Name" required onChange={e => setFormData({...formData, name: e.target.value})} style={styles.input}/>
            <input placeholder="Phone" required onChange={e => setFormData({...formData, phone: e.target.value})} style={styles.input}/>
            <input placeholder="Email" type="email" required onChange={e => setFormData({...formData, email: e.target.value})} style={styles.input}/>
            <input placeholder="Age" type="number" required onChange={e => setFormData({...formData, age: e.target.value})} style={styles.input}/>
            
            <select required onChange={e => setFormData({...formData, gender: e.target.value})} style={styles.input}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>

            <select required onChange={e => setFormData({...formData, blood_group: e.target.value})} style={styles.input}>
                <option value="">Blood Group</option>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>

            <input type="date" required onChange={e => setFormData({...formData, admission_date: e.target.value})} style={styles.input}/>

            <select required onChange={e => setFormData({...formData, disease_id: parseInt(e.target.value)})} 
                 style={inputStyle}
>
                 <option value="">Select Disease</option>
                {diseases.map(d => (
                    <option key={d.disease_id} value={d.disease_id}>{d.name}</option>
                ))}
            </select>

            <select required onChange={e => setFormData({...formData, doctor_id: parseInt(e.target.value)})} 
                  style={inputStyle}
>
                 <option value="">Select Doctor</option>
                     {doctors.map(doc => (
                 <option key={doc.user_id} value={doc.user_id}>{doc.name}</option>
                 ))}
            </select>

            <select required onChange={e => handleCategoryChange(e.target.value)} style={styles.input}>
                <option value="">Bed Category</option>
                {['Cardiology','Neurology','Pediatrics','Orthopedics','Dermatology','Gynecology'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select required onChange={e => setFormData({...formData, bed_no: e.target.value})} style={styles.input} disabled={!beds.length}>
               <option value="">{beds.length ? "Select Bed No" : "No beds available"}</option>
               {Array.isArray(beds) && beds.map(b => (
              <option key={b.bed_no} value={b.bed_no}>{b.bed_no}</option>
              ))}
            </select>

            <button type="submit" style={styles.btn}>Confirm Admission</button>
        </form>
    );
};

const styles = {
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    input: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc' },
    btn: { gridColumn: 'span 2', padding: '12px', backgroundColor: '#004d40', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold' }
};

export default AdmitPatientForm;
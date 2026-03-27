import React, { useState, useEffect } from 'react';

const ServePatient = () => {
    // ১. স্টেট ম্যানেজমেন্ট
    const [idInput, setIdInput] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [currentServiceId, setCurrentServiceId] = useState(null); // নতুন সার্ভিস আইডি রাখার জন্য
    const [description, setDescription] = useState('');
    const [advice, setAdvice] = useState('');
    const [patient, setPatient] = useState({
        name: '', phone_number: '', email: '', age: '', gender: '', blood_group: '', patient_type: ''
    });

    // ডাইনামিক লিস্ট স্টেটসমূহ
    const [history, setHistory] = useState([{ condition: '', current_meds: '' }]);
    const [diagnoses, setDiagnoses] = useState([{ disease: '', severity: 'Mild' }]);
    const [medicines, setMedicines] = useState([{ name: '', duration: '', schedule: '0+0+0', timing: 'After Meal' }]);
    const [tests, setTests] = useState([{ test_name: '' }]);

    // ২. ডেট সেট করা
    useEffect(() => {
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        setCurrentDate(today.toLocaleDateString('en-GB', options));
    }, []);

    // ৩. পেশেন্ট সার্চ এবং অটোমেটিক সার্ভিস ক্রিয়েশন (Transaction API Call)
    const fetchPatientData = async () => {
    if (!idInput) return;

    // ১. প্রথমে পুরো 'user' অবজেক্টটি স্ট্রিং হিসেবে আনুন
    const storedUser = localStorage.getItem('user'); 
    
    let doctorId = null;

    if (storedUser) {
        // ২. স্ট্রিংটিকে অবজেক্টে রূপান্তর করুন
        const userData = JSON.parse(storedUser);
        // ৩. আপনার ডাটাবেস অনুযায়ী user_id অথবা id ফিল্ডটি নিন
        doctorId = userData.user_id || userData.id; 
    }

    // ৪. যদি আইডি না পাওয়া যায় তবেই এরর দিন
    if (!doctorId) {
        alert("Doctor not logged in! Please login first.");
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/patients/start-service`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patient_id: idInput,
                doctor_id: doctorId
            })
        });

        if (res.ok) {
            const data = await res.json();
            setPatient(data.patient);
            setCurrentServiceId(data.service_id);
            console.log("Service Started. ID:", data.service_id);
        } else {
            const errorData = await res.json();
            alert(errorData.error || "Error fetching patient data!");
            clearAllFields();
        }
    } catch (err) {
        console.error("Fetch error:", err);
        alert("Connection to server failed.");
    }
};

    const clearAllFields = () => {
        setPatient({ name: '', phone_number: '', email: '', age: '', gender: '', blood_group: '', patient_type: '' });
        setCurrentServiceId(null);
        setDescription('');
        setAdvice('');
        setHistory([{ condition: '', current_meds: '' }]);
        setDiagnoses([{ disease: '', severity: 'Mild' }]);
        setMedicines([{ name: '', duration: '', schedule: '0+0+0', timing: 'After Meal' }]);
        setTests([{ test_name: '' }]);
    };

    // ৪. ডাইনামিক রো হ্যান্ডলিং ফাংশন
    const addRow = (state, setState, schema) => setState([...state, schema]);
    const removeRow = (state, setState, index) => setState(state.filter((_, i) => i !== index));
    const handleUpdate = (state, setState, index, field, value) => {
        const list = [...state];
        list[index][field] = value;
        setState(list);
    };

    return (
        <div style={styles.container}>
            <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>DOCTOR'S PRESCRIPTION PANEL</h2>

            {/* --- SECTION 1: Patient Header --- */}
            <div style={styles.topBar}>
                <div style={styles.dateBox}>
                    <strong>Date:</strong> {currentDate} <br/>
                    {currentServiceId && <small>Service ID: #{currentServiceId}</small>}
                </div>
                
                <div style={styles.searchSection}>
                    <label style={styles.label}>Patient ID:</label>
                    <input type="text" placeholder="ID" value={idInput} onChange={(e) => setIdInput(e.target.value)} onBlur={fetchPatientData} style={styles.idInput} />
                    <button onClick={fetchPatientData} style={styles.searchBtn}>Search & Start Service</button>
                </div>

                <div style={styles.infoGrid}>
                    <div style={styles.infoBox}><strong>Name:</strong> {patient.name || '---'}</div>
                    <div style={styles.infoBox}><strong>Age:</strong> {patient.age || '---'}</div>
                    <div style={styles.infoBox}><strong>Gender:</strong> {patient.gender || '---'}</div>
                    <div style={styles.infoBox}><strong>Blood:</strong> {patient.blood_group || '---'}</div>
                    <div style={styles.infoBox}><strong>Type:</strong> {patient.patient_type || '---'}</div>
                    <div style={styles.infoBox}><strong>Phone:</strong> {patient.phone_number || '---'}</div>
                </div>
            </div>

            <div style={styles.mainLayout}>
                {/* --- LEFT COLUMN --- */}
                <div style={styles.leftCol}>
                    <div style={styles.sectionCard}>
                        <h3 style={styles.sectionTitle}>Chief Complaints</h3>
                        <textarea placeholder="Describe symptoms..." value={description} onChange={(e) => setDescription(e.target.value)} style={styles.textArea} />
                    </div>

                    <div style={styles.sectionCard}>
                        <div style={styles.sectionHeader}>
                            <h3 style={styles.sectionTitle}>Diagnosis</h3>
                            <button onClick={() => addRow(diagnoses, setDiagnoses, { disease: '', severity: 'Mild' })} style={styles.addBtnSmall}>+ Add</button>
                        </div>
                        {diagnoses.map((d, i) => (
                            <div key={i} style={styles.row}>
                                <input placeholder="Disease" value={d.disease} onChange={(e) => handleUpdate(diagnoses, setDiagnoses, i, 'disease', e.target.value)} style={{ ...styles.input, flex: 2 }} />
                                <select value={d.severity} onChange={(e) => handleUpdate(diagnoses, setDiagnoses, i, 'severity', e.target.value)} style={{ ...styles.input, flex: 1 }}>
                                    <option value="Mild">Mild</option>
                                    <option value="Moderate">Moderate</option>
                                    <option value="Chronic">Chronic</option>
                                </select>
                                {diagnoses.length > 1 && <button onClick={() => removeRow(diagnoses, setDiagnoses, i)} style={styles.removeBtn}>×</button>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div style={styles.rightCol}>
                    <div style={styles.sectionCard}>
                        <div style={styles.sectionHeader}>
                            <h3 style={styles.sectionTitle}>Past Medical History</h3>
                            <button onClick={() => addRow(history, setHistory, { condition: '', current_meds: '' })} style={styles.addBtnSmall}>+ Add</button>
                        </div>
                        {history.map((h, i) => (
                            <div key={i} style={styles.rowHistory}>
                                <input placeholder="Condition" value={h.condition} onChange={(e) => handleUpdate(history, setHistory, i, 'condition', e.target.value)} style={{ ...styles.input, flex: 1 }} />
                                <textarea placeholder="Medicines used..." value={h.current_meds} onChange={(e) => handleUpdate(history, setHistory, i, 'current_meds', e.target.value)} style={styles.textAreaHistory} />
                                {history.length > 1 && <button onClick={() => removeRow(history, setHistory, i)} style={styles.removeBtn}>×</button>}
                            </div>
                        ))}
                    </div>

                    <div style={styles.sectionCard}>
                        <div style={styles.sectionHeader}>
                            <h3 style={styles.sectionTitle}>Rx - Medicines</h3>
                            <button onClick={() => addRow(medicines, setMedicines, { name: '', duration: '', schedule: '0+0+0', timing: 'After Meal' })} style={styles.addBtnSmall}>+ Add</button>
                        </div>
                        {medicines.map((m, i) => (
                            <div key={i} style={styles.row}>
                                <input placeholder="Name" value={m.name} onChange={(e) => handleUpdate(medicines, setMedicines, i, 'name', e.target.value)} style={{ ...styles.input, flex: 2 }} />
                                <input placeholder="Days" value={m.duration} onChange={(e) => handleUpdate(medicines, setMedicines, i, 'duration', e.target.value)} style={{ ...styles.input, flex: 0.8 }} />
                                <input placeholder="1+0+1" value={m.schedule} onChange={(e) => handleUpdate(medicines, setMedicines, i, 'schedule', e.target.value)} style={{ ...styles.input, flex: 1 }} />
                                <select value={m.timing} onChange={(e) => handleUpdate(medicines, setMedicines, i, 'timing', e.target.value)} style={{ ...styles.input, flex: 1.2 }}>
                                    <option value="After Meal">After Meal</option>
                                    <option value="Before Meal">Before Meal</option>
                                </select>
                                {medicines.length > 1 && <button onClick={() => removeRow(medicines, setMedicines, i)} style={styles.removeBtn}>×</button>}
                            </div>
                        ))}
                    </div>

                    <div style={styles.sectionCard}>
                        <div style={styles.sectionHeader}>
                            <h3 style={styles.sectionTitle}>Medical Tests</h3>
                            <button onClick={() => addRow(tests, setTests, { test_name: '' })} style={styles.addBtnSmall}>+ Add</button>
                        </div>
                        {tests.map((t, i) => (
                            <div key={i} style={styles.row}>
                                <input placeholder="Test Name" value={t.test_name} onChange={(e) => handleUpdate(tests, setTests, i, 'test_name', e.target.value)} style={{ ...styles.input, flex: 1 }} />
                                {tests.length > 1 && <button onClick={() => removeRow(tests, setTests, i)} style={styles.removeBtn}>×</button>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- ADVICE SECTION (Full Width) --- */}
            <div style={styles.sectionCard}>
                <h3 style={styles.sectionTitle}>Advice & Instructions</h3>
                <textarea placeholder="Advice..." value={advice} onChange={(e) => setAdvice(e.target.value)} style={styles.textAreaAdvice} />
            </div>

            <button style={styles.saveBtn} onClick={() => alert("Ready to save Service ID: " + currentServiceId)}>
                Save Prescription
            </button>
        </div>
    );
};

// ... Styles remains the same as previous response ...
const styles = {
    container: { padding: '20px', maxWidth: '1300px', margin: '0 auto', fontFamily: 'Segoe UI, Arial', background: '#f4f7f6' },
    topBar: { background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #ddd', position: 'relative', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
    dateBox: { position: 'absolute', top: '15px', right: '20px', color: '#007bff', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', border: '1px solid #007bff', padding: '5px 10px', borderRadius: '5px' },
    searchSection: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
    idInput: { padding: '8px', width: '80px', borderRadius: '5px', border: '1px solid #ccc' },
    searchBtn: { padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', borderTop: '1px solid #eee', paddingTop: '15px', fontSize: '13px' },
    mainLayout: { display: 'flex', gap: '20px', marginBottom: '20px' },
    leftCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
    rightCol: { flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' },
    sectionCard: { background: '#fff', padding: '15px', borderRadius: '10px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    sectionTitle: { fontSize: '16px', color: '#333', marginBottom: '12px', borderLeft: '4px solid #007bff', paddingLeft: '10px' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    row: { display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' },
    rowHistory: { display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' },
    input: { padding: '9px', borderRadius: '5px', border: '1px solid #ccc', outline: 'none', fontSize: '13px' },
    textArea: { width: '100%', height: '110px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    textAreaHistory: { flex: 2, height: '50px', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px', outline: 'none', resize: 'none' },
    textAreaAdvice: { width: '100%', height: '80px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    addBtnSmall: { padding: '5px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
    removeBtn: { background: '#dc3545', color: '#fff', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer' },
    saveBtn: { width: '100%', padding: '15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }
};

export default ServePatient;
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaCalendarCheck, FaEye, FaSignOutAlt, FaUserMd, 
    FaTimesCircle, FaHospitalUser, FaUserPlus, FaListUl, 
    FaBed, FaStethoscope, FaTint, FaNotesMedical 
} from 'react-icons/fa';
import bgImage from '../assets/Receptionist_schedule.jpg';

// --- Admit Patient Form Component ---
const AdmitPatientForm = ({ getHeaders }) => {
    const [doctors, setDoctors] = useState([]);
    const [diseases, setDiseases] = useState([]);
    const [beds, setBeds] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', age: '', gender: '',
        blood_group: '', admission_date: new Date().toISOString().split('T')[0], 
        disease_id: '', doctor_id: '', bed_no: ''
    });

    useEffect(() => {
        // ডাক্তার এবং রোগের ডাটা লোড করা
        const fetchInitialData = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/get-admission-data', { headers: getHeaders() });
                const data = await res.json();
                setDoctors(data.doctors || []);
                setDiseases(data.diseases || []);
            } catch (err) { console.error("Error loading form data", err); }
        };
        fetchInitialData();
    }, [getHeaders]);

    const handleCategoryChange = async (cat) => {
        setSelectedCategory(cat);
        try {
            const res = await fetch(`http://localhost:5000/api/available-beds/${cat}`, { headers: getHeaders() });
            const data = await res.json();
            setBeds(data || []);
        } catch (err) { console.error("Error loading beds", err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/admit-patient', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                alert("Patient Admitted & Bed Booked Successfully!");
                window.location.reload(); 
            } else {
                alert("Error: " + data.message);
            }
        } catch (err) { alert("Server connection failed."); }
    };

    const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Patient Name</label>
                <input required placeholder="Enter Name" onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Phone Number</label>
                <input required placeholder="017XXXXXXXX" onChange={e => setFormData({...formData, phone: e.target.value})} style={inputStyle}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Email</label>
                <input required type="email" placeholder="email@example.com" onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle}/>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label>Age</label>
                    <input required type="number" onChange={e => setFormData({...formData, age: e.target.value})} style={inputStyle}/>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label>Gender</label>
                    <select required onChange={e => setFormData({...formData, gender: e.target.value})} style={inputStyle}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label><FaTint color="red" /> Blood Group</label>
                <select required onChange={e => setFormData({...formData, blood_group: e.target.value})} style={inputStyle}>
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Admission Date</label>
                <input required type="date" value={formData.admission_date} onChange={e => setFormData({...formData, admission_date: e.target.value})} style={inputStyle}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label><FaNotesMedical color="#00796b" /> Disease Name</label>
                <select required onChange={e => setFormData({...formData, disease_id: e.target.value})} style={inputStyle}>
                    <option value="">Select Disease</option>
                    {diseases.map(d => <option key={d.disease_id} value={d.disease_id}>{d.name}</option>)}
                </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label><FaStethoscope color="#00796b" /> Admitting Doctor</label>
                <select required onChange={e => setFormData({...formData, doctor_id: e.target.value})} style={inputStyle}>
                    <option value="">Select Doctor</option>
                    {doctors.map(doc => <option key={doc.user_id} value={doc.user_id}>{doc.name}</option>)}
                </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label><FaBed color="#00796b" /> Bed Category</label>
                <select required onChange={e => handleCategoryChange(e.target.value)} style={inputStyle}>
                    <option value="">Select Category</option>
                    {['Cardiology','Neurology','Pediatrics','Orthopedics','Dermatology','Gynecology'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Available Beds</label>
                <select required disabled={!beds.length} onChange={e => setFormData({...formData, bed_no: e.target.value})} style={inputStyle}>
                    <option value="">{beds.length ? "Select Bed No" : "No beds available"}</option>
                    {beds.map(b => <option key={b.bed_no} value={b.bed_no}>{b.bed_no}</option>)}
                </select>
            </div>
            <button type="submit" style={{ gridColumn: 'span 2', padding: '15px', backgroundColor: '#004d40', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                Confirm Admission
            </button>
        </form>
    );
};

// --- Main Dashboard Component ---
const ReceptionistDashboard = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('approval');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctorSchedule, setSelectedDoctorSchedule] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('token');
    const receptionist = JSON.parse(localStorage.getItem('user'));
    const currentUserId = receptionist ? (receptionist.id || receptionist.user_id) : null;

    useEffect(() => {
        if (!token || receptionist?.role !== 'Receptionist') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [token, receptionist, navigate]);

    const styles = {
        container: { display: 'flex', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" },
        sidebar: { 
            width: '280px', backgroundColor: '#004d40', color: 'white', 
            padding: '30px 20px', display: 'flex', flexDirection: 'column',
            boxShadow: '4px 0 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, height: '100vh'
        },
        mainContent: { 
            flex: 1, padding: '30px', 
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${bgImage})`,
            backgroundSize: 'cover', backgroundAttachment: 'fixed', overflowY: 'auto'
        },
        sideBtn: (isActive) => ({
            width: '100%', padding: '12px 15px', margin: '8px 0', border: 'none', borderRadius: '10px',
            backgroundColor: isActive ? '#00bfa5' : 'transparent', color: 'white',
            textAlign: 'left', cursor: 'pointer', fontSize: '16px', display: 'flex',
            alignItems: 'center', gap: '12px', transition: '0.3s', fontWeight: isActive ? '600' : '400'
        }),
        logoutBtn: {
            marginTop: 'auto', backgroundColor: '#ff5252', color: 'white', border: 'none',
            padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold'
        },
        card: { backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' },
        modalOverlay: {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
        },
        modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '450px' }
    };

    const getHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }), [token]);

    const fetchAppointments = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/pending-appointments', { headers: getHeaders() });
            const data = await res.json();
            setAppointments(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    }, [token, getHeaders]);

    useEffect(() => {
        if (view === 'approval') fetchAppointments();
    }, [view, fetchAppointments]);

    const handleConfirm = async (appointmentId) => {
        if (!currentUserId) return alert("Receptionist ID missing!");
        try {
            const response = await fetch(`http://localhost:5000/api/confirm-appointment/${appointmentId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ receptionist_id: currentUserId })
            });
            const data = await response.json();
            if (data.success) { alert("Appointment Confirmed!"); fetchAppointments(); }
        } catch (err) { alert("Error confirming appointment."); }
    };

    const handleCancel = async (appointmentId) => {
        if (window.confirm("Are you sure you want to decline this request?")) {
            try {
                const response = await fetch(`http://localhost:5000/api/cancel-appointment/${appointmentId}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });
                const data = await response.json();
                if (data.success) { alert("Request Declined."); fetchAppointments(); }
            } catch (error) { alert("Failed to cancel."); }
        }
    };

    const handleSeeSchedule = async (doctorId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/doctor-availability/${doctorId}`, { headers: getHeaders() });
            const data = await res.json();
            setSelectedDoctorSchedule(data);
            setShowModal(true);
        } catch (err) { alert("Could not load schedule."); }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <FaHospitalUser size={50} color="#00bfa5" />
                    <h3 style={{ margin: '10px 0 5px' }}>RECEPTION PANEL</h3>
                    <p style={{ fontSize: '12px', color: '#aaa' }}>{receptionist?.name}</p>
                </div>
                <button style={styles.sideBtn(view === 'approval')} onClick={() => setView('approval')}>
                    <FaListUl /> Appointment Approval
                </button>
                <button style={styles.sideBtn(view === 'admit')} onClick={() => setView('admit')}>
                    <FaUserPlus /> Admit Patient
                </button>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                    <FaSignOutAlt /> Logout
                </button>
            </div>

            <div style={styles.mainContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
                    <h2 style={{ color: '#004d40', margin: 0 }}>
                        {view === 'approval' ? 'Appointment Management' : 'Patient Admission'}
                    </h2>
                </div>

                {view === 'approval' ? (
                    <div style={styles.card}>
                        <h3 style={{ color: '#00796b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaCalendarCheck /> Pending Requests
                        </h3>
                        {loading ? <p>Loading...</p> : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f4f7f6', borderBottom: '2px solid #004d40', textAlign: 'left' }}>
                                            <th style={{ padding: '15px' }}>Patient Details</th>
                                            <th style={{ padding: '15px' }}>Doctor</th>
                                            <th style={{ padding: '15px' }}>Requested Time</th>
                                            <th style={{ padding: '15px', textAlign: 'center' }}>Availability</th>
                                            <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.length > 0 ? appointments.map((app) => (
                                            <tr key={app.appointment_id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <strong>{app.patient_name}</strong><br/>
                                                    <small style={{ color: '#666' }}>{app.phone_number}</small>
                                                </td>
                                                <td style={{ padding: '15px' }}>Dr. {app.doctor_name}</td>
                                                <td style={{ padding: '15px' }}>
                                                    {new Date(app.appointment_date).toLocaleDateString('en-GB')}<br/>
                                                    <span style={{ fontSize: '12px', color: '#00796b' }}>{app.appointment_time}</span>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <button onClick={() => handleSeeSchedule(app.doctor_id)} style={{ backgroundColor: '#00bcd4', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                                                        <FaEye /> Check
                                                    </button>
                                                </td>
                                                <td style={{ padding: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                    <button onClick={() => handleConfirm(app.appointment_id)} style={{ backgroundColor: '#4caf50', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm</button>
                                                    <button onClick={() => handleCancel(app.appointment_id)} style={{ backgroundColor: '#ff5722', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}><FaTimesCircle /></button>
                                                </td>
                                            </tr>
                                        )) : <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No pending requests.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={styles.card}>
                        <h3 style={{ color: '#004d40', borderBottom: '2px solid #00bfa5', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaUserPlus /> New Patient Admission
                        </h3>
                        <AdmitPatientForm getHeaders={getHeaders} />
                    </div>
                )}
            </div>

            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={{ borderBottom: '2px solid #00796b', paddingBottom: '10px', marginBottom: '15px' }}>
                            <FaUserMd color="#00796b" /> Doctor's Availability
                        </h3>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '20px' }}>
                            {selectedDoctorSchedule?.length > 0 ? selectedDoctorSchedule.map((s, index) => (
                                <div key={index} style={{ padding: '10px', backgroundColor: '#f1f8f7', marginBottom: '8px', borderRadius: '6px', borderLeft: '4px solid #00796b' }}>
                                    <strong>{s.day}</strong> ({new Date(s.date).toLocaleDateString('en-GB')})<br/>
                                    <span style={{ fontSize: '14px' }}>{s.hours_start} - {s.hours_end}</span>
                                </div>
                            )) : <p>No active schedule found.</p>}
                        </div>
                        <button onClick={() => setShowModal(false)} style={{ width: '100%', padding: '10px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionistDashboard;
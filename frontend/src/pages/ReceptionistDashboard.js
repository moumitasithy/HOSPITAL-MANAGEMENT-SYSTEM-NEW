import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarCheck, FaEye, FaSignOutAlt, FaUserMd, FaTimesCircle, FaHospitalUser } from 'react-icons/fa';
import bgImage from '../assets/Receptionist_schedule.jpg';

const ReceptionistDashboard = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctorSchedule, setSelectedDoctorSchedule] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // ১. লোকাল স্টোরেজ থেকে ডাটা রিট্রিভ করা (Fix applied here)
    const token = localStorage.getItem('token');
    const receptionist = JSON.parse(localStorage.getItem('user'));
    
    // আপনার আগের ভুলটি এখানে ছিল (user_id এর বদলে id হবে)
    const currentUserId = receptionist ? (receptionist.id || receptionist.user_id) : null; 

    // ২. সিকিউরিটি চেক
    useEffect(() => {
        if (!token || receptionist?.role !== 'Receptionist') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [token, receptionist, navigate]);

    // ৩. ডিজাইন স্টাইলস
    const styles = {
        container: {
            padding: '30px',
            minHeight: '100vh',
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            fontFamily: "'Poppins', sans-serif"
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            backgroundColor: '#00796b',
            padding: '15px 25px',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        },
        tableCard: {
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
        },
        logoutBtn: {
            backgroundColor: '#ff5252',
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            cursor: 'pointer',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold'
        },
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        },
        modalContent: {
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            width: '90%',
            maxWidth: '450px'
        }
    };

    // ৪. টোকেন হেডার ফাংশন
    const getHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }), [token]);

    // ৫. ডাটা ফেচিং
    const fetchAppointments = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5000/api/pending-appointments', {
                headers: getHeaders()
            });
            const data = await res.json();
            setAppointments(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setLoading(false);
        }
    }, [token, getHeaders]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // ৬. কনফার্ম লজিক (Fix applied for id tracking)
    const handleConfirm = async (appointmentId) => {
        const currentToken = localStorage.getItem('token');
        
        // কনসোলে চেক করুন আইডি ঠিকমতো আসছে কি না
        console.log("Processing confirmation for ID:", currentUserId); 

        if (!currentToken || !currentUserId) {
            alert("Receptionist ID missing! Please login again.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/confirm-appointment/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ receptionist_id: currentUserId })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert("Appointment Confirmed Successfully!");
                fetchAppointments(); 
            } else {
                alert("Error: " + (data.message || data.error || "Request failed"));
                if (response.status === 401) handleLogout();
            }
        } catch (err) {
            console.error("Network Error:", err);
            alert("Failed to connect to the server.");
        }
    };

    // ৭. সিডিউল দেখা এবং ক্যান্সেল লজিক
    const handleSeeSchedule = async (doctorId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/doctor-availability/${doctorId}`, {
                headers: getHeaders()
            });
            const data = await res.json();
            setSelectedDoctorSchedule(data);
            setShowModal(true);
        } catch (err) {
            alert("Could not load doctor schedule");
        }
    };

    const handleCancel = async (appointmentId) => {
        if (window.confirm("Are you sure you want to cancel this appointment?")) {
            try {
                const response = await fetch(`http://localhost:5000/api/cancel-appointment/${appointmentId}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });
                const data = await response.json();
                if (data.success) {
                    alert(data.message);
                    fetchAppointments();
                }
            } catch (error) {
                alert("Failed to cancel appointment.");
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    if (!token) return null;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FaHospitalUser /> Receptionist Portal
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span>Welcome, <strong>{receptionist?.name}</strong></span>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </div>

            <div style={styles.tableCard}>
                <h3 style={{ marginBottom: '20px', color: '#00796b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaCalendarCheck /> Pending Appointment Requests
                </h3>
                
                {loading ? <p style={{textAlign: 'center', padding: '20px'}}>Loading Appointments...</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f4f7f6', borderBottom: '2px solid #00796b', textAlign: 'left' }}>
                                    <th style={{ padding: '15px' }}>Patient Details</th>
                                    <th style={{ padding: '15px' }}>Assigned Doctor</th>
                                    <th style={{ padding: '15px' }}>Requested Time</th>
                                    <th style={{ padding: '15px' }}>Availability</th>
                                    <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.length > 0 ? appointments.map((app) => (
                                    <tr key={app.appointment_id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '15px' }}>
                                            <strong>{app.patient_name}</strong><br/>
                                            <small style={{color: '#666'}}>{app.phone_number}</small>
                                        </td>
                                        <td style={{ padding: '15px' }}>Dr. {app.doctor_name}</td>
                                        <td style={{ padding: '15px' }}>
                                            {new Date(app.appointment_date).toLocaleDateString('en-GB')}<br/>
                                            <span style={{ fontSize: '12px', color: '#00796b' }}>{app.appointment_time}</span>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <button 
                                                onClick={() => handleSeeSchedule(app.doctor_id)} 
                                                style={{ backgroundColor: '#00bcd4', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                                            >
                                                <FaEye /> Check
                                            </button>
                                        </td>
                                        <td style={{ padding: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button 
                                                onClick={() => handleConfirm(app.appointment_id)}
                                                style={{ backgroundColor: '#4caf50', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                                            >
                                                Confirm
                                            </button>
                                            <button 
                                                onClick={() => handleCancel(app.appointment_id)}
                                                style={{ backgroundColor: '#ff5722', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px' }}
                                            >
                                                <FaTimesCircle />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>No pending requests found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
                            {selectedDoctorSchedule && selectedDoctorSchedule.length > 0 ? (
                                selectedDoctorSchedule.map((s, index) => (
                                    <div key={index} style={{ padding: '10px', backgroundColor: '#f1f8f7', marginBottom: '8px', borderRadius: '6px', borderLeft: '4px solid #00796b' }}>
                                        <strong>{s.day}</strong> ({new Date(s.date).toLocaleDateString('en-GB')})<br/>
                                        <span style={{fontSize: '14px'}}>{s.hours_start} - {s.hours_end}</span>
                                    </div>
                                ))
                            ) : <p>No active schedule found.</p>}
                        </div>
                        <button onClick={() => setShowModal(false)} style={{ width: '100%', padding: '10px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionistDashboard;
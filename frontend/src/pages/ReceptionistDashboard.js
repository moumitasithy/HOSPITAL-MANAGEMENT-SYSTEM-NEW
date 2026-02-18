import React, { useEffect, useState } from 'react';
import { FaCalendarCheck, FaEye, FaSignOutAlt, FaUserMd } from 'react-icons/fa';
import bgImage from '../assets/Receptionist_schedule.jpg';

const ReceptionistDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctorSchedule, setSelectedDoctorSchedule] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const receptionist = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/pending-appointments');
            const data = await res.json();
            setAppointments(data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setLoading(false);
        }
    };

    // ডাক্তারের শিডিউল দেখার ফাংশন - doctor_id সরাসরি ব্যবহার করা হয়েছে
    const handleSeeSchedule = async (doctorId) => {
        if (!doctorId) {
            return alert("Doctor ID not found for this appointment");
        }
        
        try {
            const res = await fetch(`http://localhost:5000/api/doctor-availability/${doctorId}`);
            const data = await res.json();
            setSelectedDoctorSchedule(data);
            setShowModal(true);
        } catch (err) {
            alert("Could not load doctor schedule");
        }
    };

    const handleConfirm = async (id) => {
        if (!receptionist) return alert("Please login first!");

        try {
            const res = await fetch(`http://localhost:5000/api/confirm-appointment/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                alert("Appointment fixed successfully!"); 
                fetchAppointments(); 
            } else {
                const result = await res.json();
                alert(result.error || "Confirmation failed!");
            }
        } catch (err) {
            alert("Server connection failed!");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const styles = {
        container: {
            minHeight: '100vh',
            backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            padding: '40px',
            fontFamily: 'Poppins, sans-serif',
            color: 'white'
        },
        tableCard: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '20px',
            color: '#333',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            overflowX: 'auto'
        },
        modalOverlay: {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        },
        modalContent: {
            backgroundColor: 'white', padding: '30px', borderRadius: '10px', maxWidth: '500px', width: '90%', color: '#333'
        }
    };

    return (
        <div style={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2><FaCalendarCheck /> Receptionist Dashboard</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span>Welcome, {receptionist?.name}</span>
                    <button onClick={handleLogout} style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </div>

            <div style={styles.tableCard}>
                <h3 style={{ marginBottom: '20px', color: '#00796b' }}>Pending Appointment Requests</h3>
                {loading ? <p>Loading Data...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#00796b', color: 'white', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Patient</th>
                                <th style={{ padding: '12px' }}>Phone</th>
                                <th style={{ padding: '12px' }}>Doctor</th>
                                <th style={{ padding: '12px' }}>Appt. Time</th>
                                <th style={{ padding: '12px' }}>Check Schedule</th>
                                <th style={{ padding: '12px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.length > 0 ? appointments.map((app) => (
                                <tr key={app.appointment_id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '12px' }}>{app.patient_name}</td>
                                    <td style={{ padding: '12px' }}>{app.phone_number}</td>
                                    <td style={{ padding: '12px' }}><strong>Dr. {app.doctor_name}</strong></td>
                                    <td style={{ padding: '12px' }}>
                                        {new Date(app.appointment_date).toLocaleDateString()}<br/>
                                        <small style={{ color: '#666' }}>{app.appointment_time}</small>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button 
                                            onClick={() => handleSeeSchedule(app.doctor_id)} 
                                            style={{ backgroundColor: '#00bcd4', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            <FaEye /> See Schedule
                                        </button>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button 
                                            onClick={() => handleConfirm(app.appointment_id)}
                                            style={{ backgroundColor: '#4caf50', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                                        >
                                            Confirm
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No pending requests found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={{ borderBottom: '2px solid #00796b', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaUserMd /> Doctor's Availability
                        </h3>
                        <div style={{ margin: '20px 0', maxHeight: '300px', overflowY: 'auto' }}>
                            {selectedDoctorSchedule && selectedDoctorSchedule.length > 0 ? (
                                selectedDoctorSchedule.map((s, index) => (
                                    <div key={index} style={{ padding: '10px', backgroundColor: '#f9f9f9', marginBottom: '8px', borderRadius: '4px', borderLeft: '4px solid #00796b' }}>
                                        <strong>{s.day}</strong><br/>
                                        <span>{s.hours_start} - {s.hours_end}</span>
                                    </div>
                                ))
                            ) : <p>No active schedule found.</p>}
                        </div>
                        <button onClick={() => setShowModal(false)} style={{ width: '100%', padding: '12px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionistDashboard;
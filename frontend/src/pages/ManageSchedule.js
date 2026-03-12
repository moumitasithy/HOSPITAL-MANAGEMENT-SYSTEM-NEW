import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import bgImage from '../assets/manage_schedule.jpg'; // আপনার ইমেজের পাথ

const ManageSchedule = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        if (user) fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/doctor-manage-schedules/${user.id}`);
            const data = await response.json();
            setSchedules(data);
        } catch (err) {
            console.error("Error fetching schedules:", err);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 1 ? 0 : 1;
        try {
            const response = await fetch(`http://localhost:5000/api/update-schedule-status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule_id: id, is_active: newStatus })
            });
            if (response.ok) fetchSchedules();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const styles = {
        container: {
            minHeight: '100vh',
            width: '100%',
            backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            justifyContent: 'center',
            padding: '40px 20px',
            fontFamily: "'Poppins', sans-serif"
        },
        glassTableCard: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '30px',
            width: '100%',
            maxWidth: '1000px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            overflowX: 'auto'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '20px',
            color: 'white'
        },
        th: {
            padding: '15px',
            borderBottom: '2px solid rgba(255,255,255,0.3)',
            textAlign: 'left',
            backgroundColor: 'rgba(255,255,255,0.1)'
        },
        td: {
            padding: '12px 15px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
        },
        backBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '50px',
            cursor: 'pointer',
            marginBottom: '20px',
            transition: '0.3s'
        },
        statusBadge: (isActive) => ({
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor: isActive ? '#28a745' : '#dc3545',
            color: 'white'
        })
    };

    return (
        <div style={styles.container}>
            <div style={styles.glassTableCard}>
                <button onClick={() => navigate('/doctor-dashboard')} style={styles.backBtn}>
                    <FaArrowLeft /> Back to Dashboard
                </button>
                
                <h2 style={{ marginBottom: '10px' }}>Manage Your Schedule</h2>
                <p style={{ opacity: 0.8, marginBottom: '20px' }}>Activate or Deactivate your time slots for patients.</p>

                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Day</th>
                            <th style={styles.th}>Time Slot</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedules.map((sch) => (
                            <tr key={sch.schedule_id}>
                                <td style={styles.td}>{new Date(sch.date).toLocaleDateString('en-GB')}</td>
                                <td style={styles.td}>{sch.day}</td>
                                <td style={styles.td}>{sch.hours_start} - {sch.hours_end}</td>
                                <td style={styles.td}>
                                    <span style={styles.statusBadge(sch.is_active === 1)}>
                                        {sch.is_active === 1 ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <button 
                                        onClick={() => toggleStatus(sch.schedule_id, sch.is_active)}
                                        style={{
                                            padding: '8px 15px',
                                            cursor: 'pointer',
                                            borderRadius: '5px',
                                            border: 'none',
                                            backgroundColor: sch.is_active === 1 ? '#ffc107' : '#28a745',
                                            color: 'black',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {sch.is_active === 1 ? 'Make Inactive' : 'Make Active'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {schedules.length === 0 && <p style={{textAlign: 'center', marginTop: '20px'}}>No schedules found.</p>}
            </div>
        </div>
    );
};

export default ManageSchedule;
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import bgImage from '../assets/manage_schedule.jpg';

const ManageSchedule = () => {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);

    // ১. লোকাল স্টোরেজ থেকে ডাটা নেওয়া
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // ইউজার আইডি আলাদা করে নেওয়া যাতে dependency লুপ না হয়
    const userId = user?.user_id || user?.id;

    // টোকেন না থাকলে লগইন পেজে পাঠানো
    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    // ২. হেডারের জন্য মেমোয়াইজড ফাংশন
    const getAuthHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }), [token]);

    // ৩. ডাটা ফেচ করার ফাংশন
    const fetchSchedules = useCallback(async () => {
        if (!userId || !token) return;
        
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/doctor-manage-schedules/${userId}`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            
            if (response.ok) {
                setSchedules(Array.isArray(data) ? data : []);
            } else {
                console.error("Server Error:", data.error);
            }
        } catch (err) {
            console.error("Error fetching schedules:", err);
        } finally {
            setLoading(false);
        }
    }, [userId, token, getAuthHeaders]); // এখানে 'user' এর বদলে 'userId' ব্যবহার করা হয়েছে

    // প্রথমবার লোড হওয়ার সময় কল হবে
    useEffect(() => {
        if (token && userId) {
            fetchSchedules();
        }
    }, [token, userId, fetchSchedules]);

    // ৪. স্ট্যাটাস পরিবর্তন করার ফাংশন
    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 1 ? 0 : 1;
        try {
            const response = await fetch(`http://localhost:5000/api/update-schedule-status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ schedule_id: id, is_active: newStatus })
            });
            
            if (response.ok) {
                // স্টেট সরাসরি আপডেট করা ভালো যাতে পুনরায় ডাটা ফেচ করতে না হয় (Optimistic UI)
                setSchedules(prev => 
                    prev.map(sch => sch.schedule_id === id ? { ...sch, is_active: newStatus } : sch)
                );
            } else {
                const errorData = await response.json();
                alert("Update failed: " + (errorData.error || "Unknown error"));
            }
        } catch (err) {
            alert("Failed to update status.");
        }
    };

    // স্টাইল অবজেক্ট (আপনার কোড থেকে নেওয়া)
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
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        },
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px', color: 'white' },
        th: { padding: '15px', borderBottom: '2px solid rgba(255,255,255,0.3)', textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.1)', fontSize: '14px' },
        td: { padding: '12px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '14px' },
        backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '50px', cursor: 'pointer', marginBottom: '20px', fontWeight: '500' },
        statusBadge: (isActive) => ({
            padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
            backgroundColor: isActive ? '#28a745' : '#dc3545', color: 'white'
        }),
        actionBtn: (isActive) => ({
            padding: '8px 15px', cursor: 'pointer', borderRadius: '6px', border: 'none',
            backgroundColor: isActive ? '#ffc107' : '#28a745', color: isActive ? '#000' : '#fff',
            fontWeight: 'bold', fontSize: '12px'
        })
    };

    if (!token) return null;

    return (
        <div style={styles.container}>
            <div style={styles.glassTableCard}>
                <button onClick={() => navigate('/doctor-dashboard')} style={styles.backBtn}>
                    <FaArrowLeft /> Back to Dashboard
                </button>
                
                <h2 style={{ marginBottom: '5px' }}>Manage Your Schedule</h2>
                <p style={{ opacity: 0.8, marginBottom: '20px', fontSize: '14px' }}>
                    Activate or Deactivate your time slots for patients.
                </p>

                {loading ? (
                    <p style={{ textAlign: 'center', padding: '20px' }}>Loading schedules...</p>
                ) : (
                    <div style={{overflowX: 'auto'}}>
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
                                                style={styles.actionBtn(sch.is_active === 1)}
                                            >
                                                {sch.is_active === 1 ? 'Make Inactive' : 'Make Active'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {schedules.length === 0 && (
                            <p style={{textAlign: 'center', marginTop: '30px', opacity: 0.6}}>
                                No schedules found.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageSchedule;
//d
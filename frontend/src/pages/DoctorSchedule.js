import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorSchedule = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')); // লগইন করা ডাক্তারের তথ্য
    const [loading, setLoading] = useState(false);

    const [scheduleData, setScheduleData] = useState({
        date: '',
        day: '',
        hours_start: '',
        hours_end: '',
        details: ''
    });

    const handleChange = (e) => {
        setScheduleData({ ...scheduleData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            doctor_id: user.id, // লগইন করা ইউজারের ID
            date: scheduleData.date,
            day: scheduleData.day,
            hours_start: scheduleData.hours_start,
            hours_end: scheduleData.hours_end,
            details: scheduleData.details
        };

        try {
            const response = await fetch('http://localhost:5000/api/add-doctor-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                alert("Schedule added successfully!");
                navigate('/doctor-dashboard');
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            alert("Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formBox}>
                <h2 style={{ color: '#007bff' }}>Set Your Schedule</h2>
                <p style={{ color: '#666', fontSize: '14px' }}>Please provide your available time slots.</p>
                <hr />
                
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <label>Available Date:</label>
                        <input type="date" name="date" required style={styles.input} onChange={handleChange} />
                    </div>

                    <div style={styles.inputGroup}>
                        <label>Day of Week:</label>
                        <select name="day" required style={styles.input} onChange={handleChange}>
                            <option value="">Select Day</option>
                            <option value="Saturday">Saturday</option>
                            <option value="Sunday">Sunday</option>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={styles.inputGroup}>
                            <label>Start Time:</label>
                            <input type="time" name="hours_start" required style={styles.input} onChange={handleChange} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label>End Time:</label>
                            <input type="time" name="hours_end" required style={styles.input} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label>Additional Details:</label>
                        <textarea name="details" placeholder="e.g. Break at 2 PM" style={{...styles.input, height: '80px'}} onChange={handleChange}></textarea>
                    </div>

                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? "Saving..." : "Save My Schedule"}
                    </button>
                    
                    <button type="button" onClick={() => navigate('/doctor-dashboard')} style={styles.backBtn}>
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7f6' },
    formBox: { background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '400px' },
    inputGroup: { marginBottom: '15px', textAlign: 'left' },
    input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' },
    button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
    backBtn: { width: '100%', marginTop: '10px', padding: '10px', backgroundColor: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }
};

export default DoctorSchedule;
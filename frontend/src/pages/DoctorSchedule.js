import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorSchedule = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!token || user?.role !== 'Doctor') {
            navigate('/login');
        }
    }, [token, user, navigate]);

    const [scheduleData, setScheduleData] = useState({
        startDate: '',
        endDate: '',
        selectedDays: [], 
        hours_start: '',
        hours_end: '',
        details: ''
    });

    const daysOfWeek = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    const handleDayClick = (day) => {
        setScheduleData(prev => ({
            ...prev,
            selectedDays: prev.selectedDays.includes(day)
                ? prev.selectedDays.filter(d => d !== day)
                : [...prev.selectedDays, day]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!scheduleData.startDate || !scheduleData.endDate || scheduleData.selectedDays.length === 0) {
            return alert("fill all and select at least 1 days");
        }

        setLoading(true);

        const payload = {
            doctor_id: user?.user_id || user?.id, 
            startDate: scheduleData.startDate,
            endDate: scheduleData.endDate,
            selectedDays: scheduleData.selectedDays,
            hours_start: scheduleData.hours_start,
            hours_end: scheduleData.hours_end,
            details: scheduleData.details || "Monthly Regular Schedule"
        };

        try {
            const response = await fetch('http://localhost:5000/api/add-bulk-schedule', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.status === 401 || response.status === 403) {
                alert("session end or access denied");
                navigate('/login');
                return;
            }

            if (response.ok) {
                alert(result.message || "successfully entered schedule!");
                navigate('/doctor-dashboard');
            } else {
                alert("Error: " + (result.error || result.message || "Action failed"));
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("failed to connect to the server!");
        } finally {
            setLoading(false);
        }
    };

    if (!token || user?.role !== 'Doctor') return null;

    return (
        <div style={styles.container}>
            <div style={styles.formBox}>
                <h2 style={{ color: '#2c3e50', marginBottom: '20px', textAlign: 'center', fontSize: '20px' }}>
                    Set Monthly Schedule
                </h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Start Date:</label>
                            <input type="date" required style={styles.input}
                                onChange={(e) => setScheduleData({ ...scheduleData, startDate: e.target.value })} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>End Date:</label>
                            <input type="date" required style={styles.input}
                                onChange={(e) => setScheduleData({ ...scheduleData, endDate: e.target.value })} />
                        </div>
                    </div>

                    <label style={styles.label}>Select Days:</label>
                    <div style={styles.dayContainer}>
                        {daysOfWeek.map(day => (
                            <button key={day} type="button"
                                onClick={() => handleDayClick(day)}
                                style={{
                                    ...styles.dayBadge,
                                    backgroundColor: scheduleData.selectedDays.includes(day) ? '#007bff' : '#eee',
                                    color: scheduleData.selectedDays.includes(day) ? '#fff' : '#333'
                                }}>
                                {day.substring(0, 3)}
                            </button>
                        ))}
                    </div>

                    <label style={styles.label}>Shift Hours:</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '10px', color: '#888' }}>Start</span>
                            <input type="time" required style={styles.input}
                                onChange={(e) => setScheduleData({ ...scheduleData, hours_start: e.target.value })} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '10px', color: '#888' }}>End</span>
                            <input type="time" required style={styles.input}
                                onChange={(e) => setScheduleData({ ...scheduleData, hours_end: e.target.value })} />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        ...styles.button,
                        backgroundColor: loading ? '#6c757d' : '#28a745'
                    }}>
                        {loading ? "Generating..." : "Generate Schedule"}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7f6', fontFamily: "'Poppins', sans-serif" },
    formBox: { background: '#fff', padding: '30px', borderRadius: '12px', width: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    inputGroup: { flex: 1, marginBottom: '15px' },
    input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' },
    dayContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' },
    dayBadge: { padding: '8px 12px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: '0.3s' },
    button: { width: '100%', padding: '12px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold', fontSize: '16px' },
    label: { fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#555' }
};

export default DoctorSchedule;
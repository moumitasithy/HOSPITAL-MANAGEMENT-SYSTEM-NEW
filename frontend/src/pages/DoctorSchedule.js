import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorSchedule = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [loading, setLoading] = useState(false);

    const [scheduleData, setScheduleData] = useState({
        startDate: '',
        endDate: '',
        selectedDays: [], // ['Monday', 'Wednesday']
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
        console.log("Submit Button Clicked!");

        if (!scheduleData.startDate || !scheduleData.endDate || scheduleData.selectedDays.length === 0) {
            return alert("Please fill in all fields.");
        }

        setLoading(true);

        const payload = {
            doctor_id: user.id,
            startDate: scheduleData.startDate,
            endDate: scheduleData.endDate,
            selectedDays: scheduleData.selectedDays, // এখন full names যাবে
            hours_start: scheduleData.hours_start,
            hours_end: scheduleData.hours_end,
            details: scheduleData.details || "Monthly Regular Schedule"
        };

        console.log("Check this Payload in Console:", payload);

        try {
            const response = await fetch('http://localhost:5000/api/add-bulk-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log("Server Response:", result);

            if (response.ok) {
                alert(result.message);
                navigate('/doctor-dashboard');
            } else {
                alert("Error: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("Server connection failed!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formBox}>
                <h2>Set Monthly Schedule</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={styles.inputGroup}>
                            <label>Start Date:</label>
                            <input type="date" required style={styles.input}
                                onChange={(e) => setScheduleData({ ...scheduleData, startDate: e.target.value })} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label>End Date:</label>
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
                                {day.substring(0, 3)} {/* শুধু UI-তে সংক্ষিপ্ত নাম */}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <input type="time" required style={styles.input}
                            onChange={(e) => setScheduleData({ ...scheduleData, hours_start: e.target.value })} />
                        <input type="time" required style={styles.input}
                            onChange={(e) => setScheduleData({ ...scheduleData, hours_end: e.target.value })} />
                    </div>

                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? "Generating..." : "Generate Schedule"}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7f6' },
    formBox: { background: '#fff', padding: '30px', borderRadius: '12px', width: '450px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
    inputGroup: { flex: 1, marginBottom: '15px' },
    input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' },
    dayContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' },
    dayBadge: { padding: '8px 12px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
    button: { width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '20px' },
    label: { fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }
};

export default DoctorSchedule;
import React, { useEffect, useState } from 'react';

const ReceptionistDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // লগইন করা রিসেপশনিস্টের আইডি (ধরে নিচ্ছি localStorage এ আছে)
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
        }
    };

    const handleConfirm = async (id) => {
        if (!receptionist) return alert("Please login as a receptionist first!");

        try {
            const res = await fetch(`http://localhost:5000/api/confirm-appointment/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receptionist_id: receptionist.id })
            });

            if (res.ok) {
                alert("Appointment Confirmed!");
                fetchAppointments(); // টেবিল রিফ্রেশ করা
            }
        } catch (err) {
            alert("Confirmation failed!");
        }
    };

const handleLogout = () => {
    localStorage.removeItem('user'); // ডাটা ডিলিট করা
    window.location.href = '/login'; // লগইন পেজে পাঠিয়ে দেওয়া
};
    return (
        
        <div style={{ padding: '40px' }}>
            <h2>Receptionist Dashboard - Pending Requests</h2>
            <button onClick={handleLogout} style={{ float: 'right', backgroundColor: '#f44336', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '4px' }}>
                Logout
            </button>
            {loading ? <p>Loading...</p> : (
                <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#0097a7', color: 'white' }}>
                            <th>Patient Name</th>
                            <th>Phone</th>
                            <th>Doctor</th>
                            <th>Date</th>
                            <th>Time Slot</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.map((app) => (
                            <tr key={app.appointment_id}>
                                <td>{app.patient_name}</td>
                                <td>{app.phone_number}</td>
                                <td>{app.doctor_name}</td>
                                <td>{new Date(app.appointment_date).toLocaleDateString()}</td>
                                <td>{app.start_time} - {app.end_time}</td>
                                <td>
                                    <button 
                                        onClick={() => handleConfirm(app.appointment_id)}
                                        style={{ backgroundColor: '#4caf50', color: 'white', border: 'none', padding: '5px 15px', cursor: 'pointer', borderRadius: '4px' }}
                                    >
                                        Confirm
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {appointments.length === 0 && !loading && <p>No pending appointments found.</p>}
        </div>
    );
};

export default ReceptionistDashboard;
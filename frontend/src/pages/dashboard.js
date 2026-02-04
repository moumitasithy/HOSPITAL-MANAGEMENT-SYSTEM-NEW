import React from 'react';

const Dashboard = () => {
    return (
        <div style={{ padding: '20px' }}>
            <h1>Admin Dashboard</h1>
            <p>Welcome to the Hospital Management System.</p>
            <ul>
                <li>Total Patients: 120</li>
                <li>Available Doctors: 15</li>
                <li>Pending Appointments: 5</li>
            </ul>
        </div>
    );
};

export default Dashboard;
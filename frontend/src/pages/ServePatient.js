import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ServePatient = () => {
    const navigate = useNavigate();
    // এখানে আপনার API থেকে ডক্টরের নির্দিষ্ট শিডিউল ডাটা ফেচ করতে হবে
    
    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Serve Scheduled Patients</h2>
            <p>List of your scheduled services will appear here.</p>
            <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                Go Back
            </button>
        </div>
    );
};

export default ServePatient;
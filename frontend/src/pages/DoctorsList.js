import React, { useState, useEffect } from 'react';

const DoctorsList = () => {
    const [doctors, setDoctors] = useState([]);

    const styles = {
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
        th: { textAlign: 'left', padding: '15px', borderBottom: '2px solid #e74c3c', color: '#333' },
        td: { padding: '12px 15px', borderBottom: '1px solid #ddd', color: '#444' },
        btn: { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }
    };

    const fetchDoctors = async () => {
        const res = await fetch('http://localhost:5000/api/doctors-list');
        setDoctors(await res.json());
    };

    useEffect(() => { fetchDoctors(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this doctor?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/delete-user/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert("Doctor deleted successfully!");
                fetchDoctors(); 
            } else {
                const errorData = await res.json();
                alert("Error: " + errorData.error);
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete doctor.");
        }
    };

    return (
        <table style={styles.table}>
            <thead>
                <tr><th style={styles.th}>Doctor Name</th><th style={styles.th}>Specialization</th><th style={styles.th}>Action</th></tr>
            </thead>
            <tbody>
                {doctors.map(doc => (
                    <tr key={doc.user_id}>
                        <td style={styles.td}>{doc.name}</td>
                        <td style={styles.td}>{doc.specializations}</td>
                        <td style={styles.td}><button style={styles.btn} onClick={() => handleDelete(doc.user_id)}>Delete</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default DoctorsList;
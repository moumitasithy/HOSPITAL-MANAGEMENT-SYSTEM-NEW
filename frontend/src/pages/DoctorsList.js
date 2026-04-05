import React, { useState, useEffect } from 'react';

const DoctorsList = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        };
    };

    const styles = {
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
        th: { textAlign: 'left', padding: '15px', borderBottom: '2px solid #e74c3c', color: '#333', backgroundColor: '#f9f9f9' },
        td: { padding: '12px 15px', borderBottom: '1px solid #ddd', color: '#444' },
        btn: { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
        loader: { textAlign: 'center', padding: '20px', color: '#e74c3c' }
    };

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/doctors-list', {
                headers: getAuthHeaders()
            });
            
            if (!res.ok) throw new Error("Unauthorized access");
            
            const data = await res.json();
            setDoctors(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchDoctors(); 
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this doctor?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/delete-user/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
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

    if (loading) return <div style={styles.loader}>Loading Doctors List...</div>;

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Doctor Name</th>
                        <th style={styles.th}>Specialization</th>
                        <th style={styles.th}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {doctors.length > 0 ? doctors.map(doc => (
                        <tr key={doc.user_id}>
                            <td style={styles.td}>{doc.name}</td>
                            <td style={styles.td}>{doc.specializations}</td>
                            <td style={styles.td}>
                                <button 
                                    style={styles.btn} 
                                    onClick={() => handleDelete(doc.user_id)}
                                    onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                                    onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                No doctors found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DoctorsList;
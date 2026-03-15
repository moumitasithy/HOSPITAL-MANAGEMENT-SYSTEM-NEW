import React, { useState, useEffect } from 'react';

const ReceptionistList = () => {
    const [receptionists, setReceptionists] = useState([]);
    const [loading, setLoading] = useState(true);

    const styles = {
        table: { 
            width: '100%', 
            borderCollapse: 'collapse', 
            marginTop: '20px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        },
        th: { 
            textAlign: 'left', 
            padding: '15px', 
            borderBottom: '2px solid #3498db',
            color: '#333',
            fontWeight: 'bold',
            fontSize: '14px',
            backgroundColor: '#f8f9fa'
        },
        td: { 
            padding: '12px 15px', 
            borderBottom: '1px solid #eee', 
            color: '#444',
            fontSize: '14px'
        },
        deleteBtn: { 
            backgroundColor: '#ff4d4d', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '6px', 
            cursor: 'pointer',
            transition: '0.3s',
            fontWeight: '500'
        },
        noData: {
            textAlign: 'center',
            padding: '40px',
            color: '#888',
            fontSize: '16px'
        },
        loader: {
            textAlign: 'center',
            padding: '40px',
            color: '#3498db',
            fontSize: '18px',
            fontWeight: 'bold'
        }
    };

    // ডাটা ফেচ করার ফাংশন
    const fetchRec = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/receptionist-users');
            if (!res.ok) throw new Error("Network error");
            
            const data = await res.json();
            console.log("Database Data:", data); // চেক করার জন্য

            // সরাসরি ডাটা সেট করা হচ্ছে (যেহেতু ব্যাকএন্ড থেকেই ফিল্টার হয়ে আসছে)
            setReceptionists(data); 
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchRec(); 
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this receptionist?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/delete-user/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert("Receptionist deleted successfully!");
                fetchRec(); 
            } else {
                const errorData = await res.json();
                alert("Error: " + errorData.error);
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete receptionist.");
        }
    };

    return (
        <div style={{ width: '100%', overflowX: 'auto', padding: '10px' }}>
            {loading ? (
                <div style={styles.loader}>Loading Receptionists...</div>
            ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Receptionist Name</th>
                            <th style={styles.th}>Phone Number</th>
                            <th style={styles.th}>Email Address</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receptionists.length > 0 ? (
                            receptionists.map(r => (
                                <tr key={r.user_id}>
                                    <td style={styles.td}>{r.name}</td>
                                    <td style={styles.td}>{r.phone_number}</td>
                                    <td style={styles.td}>{r.email}</td>
                                    <td style={styles.td}>
                                        <button 
                                            style={styles.deleteBtn} 
                                            onClick={() => handleDelete(r.user_id)}
                                            onMouseOver={(e) => e.target.style.backgroundColor = '#cc0000'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = '#ff4d4d'}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={styles.noData}>
                                    No receptionists found in the database.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ReceptionistList;

import React, { useState, useEffect } from 'react';

const PendingDoctorList = () => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);

    
    const token = localStorage.getItem('token'); 

   
    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });

    const fetchPending = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/pending-doctors', {
                headers: getHeaders()
            });
            const data = await res.json();
            setDoctors(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const handleDetailsClick = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/pending-details/${id}`, {
                headers: getHeaders()
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                alert(errorData.message || "Access Denied!");
                return;
            }

            const data = await res.json();
            setSelectedDoc(data); 
        } catch (err) {
            console.error("Network error:", err);
            alert("Could not connect to the server.");
        }
    };

    const handleApprove = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/approve-doctor/${id}`, { 
                method: 'POST',
                headers: getHeaders()
            });
            if (res.ok) { 
                alert("Doctor Approved!"); 
                fetchPending(); 
            }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Permanently reject this request?")) {
            try {
                const res = await fetch(`http://localhost:5000/api/admin/reject-doctor/${id}`, { 
                    method: 'DELETE',
                    headers: getHeaders()
                });
                if (res.ok) { fetchPending(); }
            } catch (err) { console.error(err); }
        }
    };

   
    return (
        <div style={styles.container}>
            <h2 style={styles.title}>PENDING LIST</h2>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.headerRow}>
                            <th style={styles.th}>Doctor Name</th>
                            <th style={styles.th}>Email Address</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.map((doc) => (
                            <tr key={doc.pending_id} style={styles.row}>
                                <td style={styles.td}>{doc.name}</td>
                                <td style={styles.td}>{doc.email}</td>
                                <td style={styles.actionTd}>
                                    <button onClick={() => handleApprove(doc.pending_id)} style={styles.confirmBtn}>Confirm</button>
                                    <button onClick={() => handleDetailsClick(doc.pending_id)} style={styles.detailsBtn}>Details</button>
                                    <button onClick={() => handleDelete(doc.pending_id)} style={styles.deleteBtn}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Details Modal */}
            {selectedDoc && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Doctor Details</h3>
                        <div style={styles.modalBody}>
                            <p><strong>Full Name:</strong> {selectedDoc.name}</p>
                            <p><strong>Phone:</strong> {selectedDoc.phone_number}</p>
                            <p><strong>Consultation Fee:</strong> {selectedDoc.consultation_fee} BDT</p>

                            {}
                            
                            <p>
                                <strong>Specializations:</strong> {
                                    Array.isArray(selectedDoc.specialization_names) && selectedDoc.specialization_names.length > 0
                                        ? selectedDoc.specialization_names.join(', ')
                                        : "Not specified"
                                }
                            </p>
                            <p>
                                <strong>Qualifications:</strong> {
                                    Array.isArray(selectedDoc.qualification_names) && selectedDoc.qualification_names.length > 0
                                        ? selectedDoc.qualification_names.join(', ')
                                        : "Not specified"
                                }
                            </p>
                        </div>
                        <button onClick={() => setSelectedDoc(null)} style={styles.closeBtn}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '30px' },
    title: { color: '#2c3e50', fontSize: '24px', marginBottom: '20px' },
    tableWrapper: { background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    headerRow: { background: '#f8f9fa' },
    th: { padding: '15px', textAlign: 'left', borderBottom: '2px solid #eee' },
    td: { padding: '15px', borderBottom: '1px solid #eee' },
    actionTd: { display: 'flex', gap: '8px', padding: '12px' },
    confirmBtn: { background: '#28a745', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
    detailsBtn: { background: '#007bff', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
    deleteBtn: { background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: '#fff', padding: '25px', borderRadius: '10px', width: '380px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
    modalBody: { marginTop: '15px', lineHeight: '1.6' },
    closeBtn: { marginTop: '15px', width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default PendingDoctorList;
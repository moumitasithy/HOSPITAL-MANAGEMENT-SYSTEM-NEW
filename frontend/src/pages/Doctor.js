import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserMd, FaInfoCircle, FaCalendarCheck } from 'react-icons/fa';

const Doctors = () => {
    const navigate = useNavigate();
    const [doctorsList, setDoctorsList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/doctors-list');
                const data = await response.json();

                // ডাটা কি আসলেই একটা লিস্ট (Array) কি না চেক করা
                if (Array.isArray(data)) {
                    setDoctorsList(data);
                } else {
                    setDoctorsList([]);
                }
            } catch (error) {
                console.error("Error fetching doctors:", error);
                setDoctorsList([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors(); // এই লাইনটি আপনার কোডে মিসিং ছিল, এটি অবশ্যই যোগ করুন!
    }, []);
    if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Loading Doctors...</h2>;

    return (
        <div style={styles.container}>
            <div
                onClick={() => navigate('/')}
                style={{ cursor: 'pointer', color: '#0097a7', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px', fontWeight: 'bold' }}
            >
                <FaArrowLeft /> Back to Home
            </div>

            <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '40px' }}>Our Expert Doctors</h1>

            {doctorsList.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <h3>No doctors registered yet.</h3>
                    <p>Please register a doctor to see them here.</p>
                </div>
            ) : (
                doctorsList?.map((doc) => (
                    <div key={doc.id} style={styles.card}>
                        <div style={styles.imgContainer}>
                            {doc.image_url ? (
                                <img
                                    src={doc.image_url}
                                    alt={doc.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <FaUserMd size={80} color="#adb5bd" />
                            )}
                        </div>

                        <div style={{ flex: 1 }}>
                            <h2 style={{ color: '#0097a7', margin: '0 0 10px 0' }}>{doc.name}</h2>

                            {/* Qualification দেখানোর জন্য নতুন লাইন */}
                            <p style={{ margin: '5px 0', fontSize: '16px', color: '#333' }}>
                                <b>{doc.qualifications || 'MBBS'}</b>
                            </p>

                            <p style={{ margin: '5px 0', color: '#555' }}>
                                <span>Specialization: </span>
                                <span style={{ color: '#00796b', fontWeight: '500' }}>
                                    {doc.specializations || 'General Physician'}
                                </span>
                            </p>

                            <p style={{ margin: '5px 0', color: '#555' }}>
                                <b>Fees:</b> {doc.consultation_fee || 'not set'} BDT
                            </p>

                            <div style={styles.btnGroup}>
                                <button
                                    style={styles.primaryBtn}
                                    onClick={() => navigate('/appointment', {
                                        state: { doctorName: doc.name, doctorId: doc.id }
                                    })}
                                >
                                    <FaCalendarCheck /> Appointment
                                </button>
                                <button style={styles.secondaryBtn}>
                                    <FaInfoCircle /> Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

// স্টাইল অবজেক্ট (নিশ্চিত করুন এটি আপনার ফাইলে আছে)
const styles = {
    container: { padding: '40px 20px', backgroundColor: '#f0f2f5', minHeight: '100vh' },
    card: { display: 'flex', backgroundColor: 'white', borderRadius: '15px', padding: '20px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '800px', margin: '20px auto', gap: '20px', alignItems: 'center' },
    imgContainer: { width: '150px', height: '150px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #0097a7', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
    btnGroup: { display: 'flex', gap: '10px', marginTop: '15px' },
    primaryBtn: { padding: '10px 15px', backgroundColor: '#0097a7', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    secondaryBtn: { padding: '10px 15px', backgroundColor: '#e0f2f1', color: '#00796b', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
};

export default Doctors;
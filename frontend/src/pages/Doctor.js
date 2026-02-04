import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserMd, FaInfoCircle, FaCalendarCheck } from 'react-icons/fa';


import doc1 from '../assets/doctor1.jpeg'; 
import doc2 from '../assets/doctor2.jpeg';
import doc3 from '../assets/doctor3.jpeg';
import doc4 from '../assets/doctor4.jpeg';
import doc5 from '../assets/doctor5.jpeg';

const Doctors = () => {
    const navigate = useNavigate();

   
    const doctorsList = [
        {
            id: 1,
            name: "Dr. Nusrat Jahan",
            degree: "MBBS, FCPS (Medicine)",
            specialist: "Cardiologist",
            experience: "12 Years Experience",
            image: doc1
        },
        {
            id: 2,
            name: "Dr. Rohan Kabir",
            degree: "MBBS, MD (Pediatrics)",
            specialist: "Child Specialist",
            experience: "8 Years Experience",
            image: doc2
        },
        {
            id: 3,
            name: "Dr. Humayan Kabir",
            degree: "MBBS, MD (Pediatrics)",
            specialist: "Child Specialist",
            experience: "10 Years Experience",
            image: doc3
        },
        {
            id: 4,
            name: "Dr. Shafiqul Islam",
            degree: "MBBS, MS (Surgery)",
            specialist: "General Surgeon",
            experience: "15 Years Experience",
            image: doc4
        },
        {
            id: 5,
            name: "Dr. Anika Tabassum",
            degree: "MBBS, FCPS (Gynecology)",
            specialist: "Gynecologist",
            experience: "7 Years Experience",
            image: doc5
        }
    ];

    const styles = {
        container: {
            padding: '40px 20px',
            backgroundColor: '#f0f2f5',
            minHeight: '100vh',
            fontFamily: "'Segoe UI', Tahoma, sans-serif"
        },
        card: {
            display: 'flex',
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '25px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
            maxWidth: '900px',
            margin: '20px auto',
            gap: '30px',
            alignItems: 'center',
            textAlign: 'left',
            transition: 'transform 0.2s'
        },
        imgContainer: {
            width: '180px',
            height: '180px',
            backgroundColor: '#e4e6e9',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '2px solid #0097a7'
        },
        btnGroup: {
            display: 'flex',
            gap: '10px',
            marginTop: '15px'
        },
        primaryBtn: {
            padding: '10px 15px',
            backgroundColor: '#0097a7',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600'
        },
        secondaryBtn: {
            padding: '10px 15px',
            backgroundColor: '#eceff1',
            color: '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600'
        }
    };

    return (
        <div style={styles.container}>
            {}
            <div 
                onClick={() => navigate('/')} 
                style={{ cursor: 'pointer', color: '#0097a7', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px', fontWeight: 'bold' }}
            >
                <FaArrowLeft /> Back to Home
            </div>

            <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '40px' }}>Meet Our Specialized Doctors</h1>

            {doctorsList.map((doc) => (
                <div key={doc.id} style={styles.card}>
                    {}
                    <div style={styles.imgContainer}>
                        {doc.image ? (
                            <img src={doc.image} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <FaUserMd size={80} color="#adb5bd" />
                        )}
                    </div>

                    {}
                    <div style={{ flex: 1 }}>
                        <h2 style={{ color: '#0097a7', margin: '0 0 10px 0' }}>{doc.name}</h2>
                        <p style={{ margin: '5px 0', fontSize: '17px' }}><b>{doc.degree}</b></p>
                        <p style={{ margin: '5px 0', color: '#555' }}>Specialist: {doc.specialist}</p>
                        <p style={{ margin: '5px 0', color: '#777', fontStyle: 'italic' }}>{doc.experience}</p>

                        <div style={styles.btnGroup}>
                            {/* Appointment বাটন: এটি ক্লিক করলে লগইন পেজে যাবে এবং ফেরত আসার লোকেশন সেট করে দিবে */}
                            <button 
                                style={styles.primaryBtn} 
                                onClick={() => navigate('/login', { 
                                    state: { 
                                        from: '/appointment', 
                                        doctorName: doc.name,
                                        role: 'Patient'
                                    } 
                                })}
                            >
                                <FaCalendarCheck /> Appointment
                            </button>
                            
                            <button style={styles.secondaryBtn}>
                                <FaInfoCircle /> Doctor Details
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Doctors;
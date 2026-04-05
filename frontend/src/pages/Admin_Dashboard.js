import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PendingDoctors from './PendingDoctors';
import DoctorsList from './DoctorsList';
import ReceptionistList from './ReceptionistList';
import DoctorStats from './DoctorStats'; 

const AdminDashboard = () => {
    const [view, setView] = useState('pending');
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    
    useEffect(() => {
        
        if (!token || user?.role !== 'Admin') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [token, user, navigate]);

    
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login'; 
    };

    const styles = {
        container: { 
            display: 'flex', 
            minHeight: '100vh', 
            backgroundImage: "url('/admin_bg.jpg')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            backgroundAttachment: 'fixed' 
        },
        sidebar: { 
            width: '260px', 
            backgroundColor: 'rgba(26, 26, 46, 0.95)', 
            color: 'white', 
            padding: '30px 20px', 
            display: 'flex', 
            flexDirection: 'column' 
        },
        logo: { 
            fontSize: '24px', 
            color: '#4cc9f0', 
            textAlign: 'center', 
            marginBottom: '40px', 
            fontWeight: 'bold' 
        },
        sideBtn: (isActive) => ({ 
            width: '100%', 
            padding: '12px', 
            margin: '10px 0', 
            border: 'none', 
            borderRadius: '8px', 
            backgroundColor: isActive ? '#4cc9f0' : '#16213e', 
            color: isActive ? '#1a1a2e' : 'white', 
            cursor: 'pointer', 
            textAlign: 'left', 
            fontWeight: 'bold',
            transition: '0.3s'
        }),
        logoutBtn: { 
            marginTop: 'auto', 
            width: '100%', 
            padding: '12px', 
            border: 'none', 
            borderRadius: '8px', 
            backgroundColor: '#d32f2f', 
            color: 'white', 
            cursor: 'pointer', 
            fontWeight: 'bold' 
        },
        contentArea: { 
            flex: 1, 
            padding: '40px', 
            display: 'flex', 
            justifyContent: 'center' 
        },
        card: { 
            width: '100%', 
            maxWidth: '1000px', 
            backgroundImage: "url('/doctor_list_bg.jpg')", 
            backgroundSize: 'cover', 
            borderRadius: '15px', 
            overflow: 'hidden', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)' 
        },
        tableWrapper: { 
            backgroundColor: 'rgba(255, 255, 255, 0.92)', 
            padding: '30px', 
            minHeight: '600px' 
        }
    };

    
    if (!token || user?.role !== 'Admin') return null;

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.logo}>ADMIN PANEL</div>
                <p style={{ textAlign: 'center', fontSize: '12px', marginBottom: '20px', color: '#aaa' }}>
                    Logged in as: {user?.name}
                </p>
                
                <button style={styles.sideBtn(view === 'pending')} onClick={() => setView('pending')}>Approve Doctors</button>
                <button style={styles.sideBtn(view === 'doctors')} onClick={() => setView('doctors')}>Doctors List</button>
                <button style={styles.sideBtn(view === 'receptionists')} onClick={() => setView('receptionists')}>Receptionists</button>
                
                {}
                <button style={styles.sideBtn(view === 'statistics')} onClick={() => setView('statistics')}>Appointment Stats</button>
                
                <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
            </div>

            <div style={styles.contentArea}>
                <div style={styles.card}>
                    <div style={styles.tableWrapper}>
                        <h2 style={{ color: '#1a1a2e', borderBottom: '2px solid #4cc9f0', paddingBottom: '10px', marginBottom: '20px' }}>
                            {view === 'statistics' ? 'APPOINTMENT STATISTICS' : `${view.toUpperCase()} MANAGEMENT`}
                        </h2>
                        
                        {}
                        {view === 'pending' && <PendingDoctors />}
                        {view === 'doctors' && <DoctorsList />}
                        {view === 'receptionists' && <ReceptionistList />}
                        
                        {}
                        {view === 'statistics' && <DoctorStats />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
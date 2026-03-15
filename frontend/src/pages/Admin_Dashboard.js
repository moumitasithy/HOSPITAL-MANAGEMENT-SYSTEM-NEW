import React, { useState } from 'react';
import PendingDoctors from './PendingDoctors';
import DoctorsList from './DoctorsList';
import ReceptionistList from './ReceptionistList';

const AdminDashboard = () => {
    const [view, setView] = useState('pending');

    const styles = {
        container: { display: 'flex', minHeight: '100vh', backgroundImage: "url('/admin_bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' },
        sidebar: { width: '260px', backgroundColor: 'rgba(26, 26, 46, 0.95)', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' },
        logo: { fontSize: '24px', color: '#4cc9f0', textAlign: 'center', marginBottom: '40px', fontWeight: 'bold' },
        sideBtn: (isActive) => ({ width: '100%', padding: '12px', margin: '10px 0', border: 'none', borderRadius: '8px', backgroundColor: isActive ? '#4cc9f0' : '#16213e', color: isActive ? '#1a1a2e' : 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }),
        contentArea: { flex: 1, padding: '40px', display: 'flex', justifyContent: 'center' },
        card: { width: '100%', maxWidth: '900px', backgroundImage: "url('/doctor_list_bg.jpg')", backgroundSize: 'cover', borderRadius: '15px', overflow: 'hidden' },
        tableWrapper: { backgroundColor: 'rgba(255, 255, 255, 0.92)', padding: '30px', minHeight: '500px' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.logo}>ADMIN PANEL</div>
                <button style={styles.sideBtn(view === 'pending')} onClick={() => setView('pending')}>Approve Doctors</button>
                <button style={styles.sideBtn(view === 'doctors')} onClick={() => setView('doctors')}>Doctors List</button>
                <button style={styles.sideBtn(view === 'receptionists')} onClick={() => setView('receptionists')}>Receptionists</button>
            </div>

            <div style={styles.contentArea}>
                <div style={styles.card}>
                    <div style={styles.tableWrapper}>
                        <h2 style={{color: '#1a1a2e'}}>{view.toUpperCase()} LIST</h2>
                        {view === 'pending' && <PendingDoctors />}
                        {view === 'doctors' && <DoctorsList />}
                        {view === 'receptionists' && <ReceptionistList />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
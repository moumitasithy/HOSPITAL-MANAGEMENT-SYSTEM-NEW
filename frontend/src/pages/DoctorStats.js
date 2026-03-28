import React, { useState, useEffect } from 'react';

const DoctorStats = () => {
    const [stats, setStats] = useState([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(2026);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/admin/doctor-stats?month=${month}&year=${year}`);
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error("Error fetching stats:", err);
            }
        };
        fetchStats();
    }, [month, year]);

    // সর্বোচ্চ অ্যাপয়েন্টমেন্ট সংখ্যা বের করা (প্রগ্রেস বারের জন্য)
    const maxApps = stats.length > 0 ? Math.max(...stats.map(s => s.total_appointments)) : 0;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>Select Period:</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)} style={styles.select}>
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                    ))}
                </select>
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} style={styles.select} />
            </div>

            {stats.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888' }}>No data found for this period.</p>
            ) : (
                <div style={styles.statsContainer}>
                    {stats.map((s, i) => (
                        <div key={i} style={styles.statRow}>
                            <div style={styles.docInfo}>
                                <span style={styles.docName}>{s.doctor_name}</span>
                                <span style={styles.docCount}>{s.total_appointments} Apps</span>
                            </div>
                            <div style={styles.barBg}>
                                <div style={{
                                    ...styles.barFill,
                                    width: `${(s.total_appointments / maxApps) * 100}%`
                                }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    select: { padding: '8px', borderRadius: '5px', border: '1px solid #ddd', outline: 'none' },
    statsContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
    statRow: { background: '#f8f9fa', padding: '15px', borderRadius: '10px' },
    docInfo: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
    docName: { fontWeight: 'bold', color: '#1a1a2e' },
    docCount: { color: '#4cc9f0', fontWeight: 'bold' },
    barBg: { width: '100%', height: '10px', background: '#e9ecef', borderRadius: '5px', overflow: 'hidden' },
    barFill: { height: '100%', background: 'linear-gradient(90deg, #4cc9f0, #4361ee)', borderRadius: '5px', transition: 'width 0.5s ease-in-out' }
};

export default DoctorStats;
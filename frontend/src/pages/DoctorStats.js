import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DoctorStats = () => {
    const [activeSubView, setActiveSubView] = useState('doctor');
    const [stats, setStats] = useState([]);
    
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(2026);
    const [fromDate, setFromDate] = useState('2026-01-01');
    const [toDate, setToDate] = useState('2026-12-31');
    const [limit, setLimit] = useState(''); 
    const [showChart, setShowChart] = useState(true);

    const COLORS = ['#4cc9f0', '#4361ee', '#3f37c9', '#4895ef', '#560bad', '#f72585', '#b5179e'];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');                
                let url = '';
                if (activeSubView === 'doctor') {
                    url = `http://localhost:5000/api/admin/doctor-stats?month=${month}&year=${year}&limit=${limit}`;
                } else if (activeSubView === 'disease') {
                    url = `http://localhost:5000/api/admin/disease-stats?fromDate=${fromDate}&toDate=${toDate}&limit=${limit}`;
                } else {
                    url = `http://localhost:5000/api/admin/stay-duration-stats?fromDate=${fromDate}&toDate=${toDate}`;
                }

                
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`, 
                        'Content-Type': 'application/json'
                    }
                });

                if (res.status === 401 || res.status === 403) {
                    console.error("Unauthorized access. Please login again.");
                    return;
                }

                const data = await res.json();
                setStats(data || []);
            } catch (err) {
                console.error("Error loading stats:", err);
            }
        };
        fetchStats();
    }, [activeSubView, month, year, fromDate, toDate, limit]);

    const getDataKey = () => {
        if (activeSubView === 'doctor') return { x: 'doctor_name', y: 'total_appointments' };
        if (activeSubView === 'disease') return { x: 'disease_name', y: 'total_patients' };
        return { x: 'duration', y: 'patient_count' };
    };

    const keys = getDataKey();
    const maxVal = stats.length > 0 ? Math.max(...stats.map(s => s[keys.y])) : 0;

    return (
        <div style={{ padding: '10px' }}>
            <div style={styles.tabContainer}>
                <button onClick={() => setActiveSubView('doctor')} style={activeSubView === 'doctor' ? styles.tabActive : styles.tabInactive}>Doctor Wise</button>
                <button onClick={() => setActiveSubView('disease')} style={activeSubView === 'disease' ? styles.tabActive : styles.tabInactive}>Disease Wise</button>
                <button onClick={() => setActiveSubView('stay')} style={activeSubView === 'stay' ? styles.tabActive : styles.tabInactive}>Stay Duration</button>
            </div>

            <div style={styles.filterBox}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {activeSubView === 'doctor' ? (
                        <>
                            <select value={month} onChange={(e) => setMonth(e.target.value)} style={styles.input}>
                                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} style={{...styles.input, width: '80px'}} />
                        </>
                    ) : activeSubView === 'disease' ? (
                        <>
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={styles.input} />
                            <span style={{color: '#666'}}>to</span>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={styles.input} />
                        </>
                    ) : null}

                    {(activeSubView === 'doctor' || activeSubView === 'disease') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{fontSize: '14px', color: '#555'}}>Top:</span>
                            <input 
                                type="number" 
                                placeholder="All" 
                                value={limit} 
                                onChange={(e) => setLimit(e.target.value)} 
                                style={{...styles.input, width: '60px'}} 
                            />
                        </div>
                    )}
                </div>
                
                <div style={styles.toggleGroup}>
                    <button onClick={() => setShowChart(true)} style={showChart ? styles.toggleOn : styles.toggleOff}>Chart</button>
                    <button onClick={() => setShowChart(false)} style={!showChart ? styles.toggleOn : styles.toggleOff}>List</button>
                </div>
            </div>

            {stats.length === 0 ? (
                <div style={styles.noData}>No records found for this selection.</div>
            ) : (
                showChart ? (
                    <div style={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey={keys.x} tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={60} />
                                <YAxis tick={{fontSize: 12}} />
                                <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{borderRadius: '10px'}} />
                                <Bar dataKey={keys.y} radius={[8, 8, 0, 0]} barSize={40}>
                                    {stats.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={styles.listContainer}>
                        {stats.map((s, i) => (
                            <div key={i} style={styles.listItem}>
                                <div style={styles.listText}>
                                    <span>{s[keys.x]} {activeSubView === 'stay' ? 'Days' : ''}</span>
                                    <strong>{s[keys.y]} {activeSubView === 'doctor' ? 'Appointments' : 'Patients'}</strong>
                                </div>
                                <div style={styles.barContainer}>
                                    <div style={{...styles.barFill, width: `${(s[keys.y] / maxVal) * 100}%`, backgroundColor: COLORS[i % COLORS.length]}} />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

const styles = {
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' },
    tabActive: { padding: '10px 18px', border: 'none', background: '#4cc9f0', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    tabInactive: { padding: '10px 18px', border: 'none', background: '#f0f0f0', color: '#666', borderRadius: '8px', cursor: 'pointer' },
    filterBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    input: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' },
    toggleGroup: { background: '#f0f0f0', padding: '4px', borderRadius: '8px' },
    toggleOn: { padding: '6px 12px', border: 'none', background: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    toggleOff: { padding: '6px 12px', border: 'none', background: 'transparent', color: '#888', cursor: 'pointer' },
    chartWrapper: { height: '400px', background: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    noData: { padding: '100px', textAlign: 'center', color: '#aaa', fontStyle: 'italic' },
    listContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
    listItem: { background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' },
    listText: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
    barContainer: { height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' },
    barFill: { height: '100%', transition: 'width 0.6s ease' }
};

export default DoctorStats;
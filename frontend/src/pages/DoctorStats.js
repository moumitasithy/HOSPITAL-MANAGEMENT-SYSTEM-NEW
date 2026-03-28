import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DoctorStats = () => {
    const [stats, setStats] = useState([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(2026);
    const [showChart, setShowChart] = useState(true); // চার্ট না কি লিস্ট দেখাবে তার স্টেট

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

    const maxApps = stats.length > 0 ? Math.max(...stats.map(s => s.total_appointments)) : 0;
    const COLORS = ['#4cc9f0', '#4361ee', '#3f37c9', '#4895ef', '#560bad'];

    return (
        <div style={{ padding: '10px' }}>
            {/* --- কন্ট্রোল প্যানেল --- */}
            <div style={styles.controlPanel}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select value={month} onChange={(e) => setMonth(e.target.value)} style={styles.select}>
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <input type="number" value={year} onChange={(e) => setYear(e.target.value)} style={styles.yearInput} />
                </div>

                <div style={styles.toggleGroup}>
                    <button 
                        onClick={() => setShowChart(true)} 
                        style={showChart ? styles.activeTab : styles.inactiveTab}>Bar Chart</button>
                    <button 
                        onClick={() => setShowChart(false)} 
                        style={!showChart ? styles.activeTab : styles.inactiveTab}>Progress List</button>
                </div>
            </div>

            {/* --- কন্টেন্ট এরিয়া --- */}
            {stats.length === 0 ? (
                <div style={styles.noData}>No appointment data found for this period.</div>
            ) : (
                showChart ? (
                    /* --- ১. বার চার্ট ভিউ --- */
                    <div style={{ height: 400, marginTop: '20px', background: '#fff', padding: '20px', borderRadius: '15px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="doctor_name" axisLine={false} tickLine={false} tick={{fill: '#667', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#667'}} />
                                <Tooltip 
                                    cursor={{fill: '#f4f7f6'}} 
                                    contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                                />
                                <Bar dataKey="total_appointments" radius={[10, 10, 0, 0]} barSize={50}>
                                    {stats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    /* --- ২. প্রগ্রেস বার লিস্ট ভিউ --- */
                    <div style={styles.statsList}>
                        {stats.map((s, i) => (
                            <div key={i} style={styles.statRow}>
                                <div style={styles.docInfo}>
                                    <span style={styles.docName}>{s.doctor_name}</span>
                                    <span style={styles.docCount}>{s.total_appointments} Appointments</span>
                                </div>
                                <div style={styles.barBg}>
                                    <div style={{
                                        ...styles.barFill,
                                        width: `${(s.total_appointments / maxApps) * 100}%`,
                                        background: COLORS[i % COLORS.length]
                                    }}></div>
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
    controlPanel: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px', background: 'rgba(255,255,255,0.5)', padding: '15px', borderRadius: '12px' },
    select: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', cursor: 'pointer' },
    yearInput: { padding: '8px', borderRadius: '8px', border: '1px solid #ddd', width: '80px', outline: 'none' },
    toggleGroup: { display: 'flex', background: '#eee', borderRadius: '10px', padding: '4px' },
    activeTab: { padding: '8px 15px', border: 'none', borderRadius: '8px', background: '#fff', color: '#4361ee', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer' },
    inactiveTab: { padding: '8px 15px', border: 'none', background: 'transparent', color: '#777', cursor: 'pointer' },
    noData: { textAlign: 'center', padding: '50px', color: '#888', fontStyle: 'italic' },
    statsList: { display: 'flex', flexDirection: 'column', gap: '15px' },
    statRow: { background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' },
    docInfo: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    docName: { fontWeight: '600', color: '#333' },
    docCount: { color: '#666', fontSize: '14px' },
    barBg: { width: '100%', height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' },
    barFill: { height: '100%', transition: 'width 0.8s ease-in-out' }
};

export default DoctorStats;
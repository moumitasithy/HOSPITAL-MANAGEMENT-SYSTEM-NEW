import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaVial } from 'react-icons/fa';

const MedicalTests = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/test_details');
                const data = await response.json();
                if (Array.isArray(data)) {
                    setTests(data);
                } else {
                    setTests([]);
                }
            } catch (error) {
                console.error("Error fetching tests:", error);
                setTests([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
    }, []);

    if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Loading Tests...</h2>;

    return (
        <div style={styles.container}>
            {/* Back Button */}
            <div onClick={() => navigate('/')} style={styles.backBtn}>
                <FaArrowLeft /> Back to Home
            </div>

            <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '40px' }}>
                Available Medical Tests
            </h1>

            {/* Main Grid Container */}
            <div style={styles.grid}>
                {tests.map((test) => (
                    <div key={test.test_id} style={styles.card}>
                        <div style={styles.iconContainer}>
                            <FaVial size={25} color="#0097a7" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '18px' }}>
                                {test.test_name}
                            </h3>
                            <p style={{ margin: 0, color: '#00796b', fontWeight: 'bold' }}>
                                Price: {test.price} BDT
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: { 
        padding: '40px 20px', 
        backgroundColor: '#f8f9fa', 
        minHeight: '100vh' 
    },
    backBtn: { 
        cursor: 'pointer', 
        color: '#0097a7', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '30px', 
        fontWeight: 'bold',
        width: 'fit-content'
    },
    grid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '25px', 
        maxWidth: '1200px', 
        margin: '0 auto' 
    },
    card: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '15px', 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '15px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        border: '1px solid #eee'
    },
    iconContainer: { 
        backgroundColor: '#e0f2f1', 
        padding: '12px', 
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};

export default MedicalTests;
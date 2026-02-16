import React, { useState, useEffect } from 'react';
import medicineBg from '../assets/medicine_store.jpg'; // আপনার ইমেজের পাথ নিশ্চিত করুন

const Medicines = () => {
    const [medicines, setMedicines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
useEffect(() => {
    fetch('http://localhost:5000/api/medicines')
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(data => {
            console.log("Medicines Data:", data); // কনসোলে ডাটা চেক করার জন্য
            setMedicines(data);
        })
        .catch(err => console.error("Fetch error:", err));
}, []);

    const filteredMedicines = medicines.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addToCart = (medicine, qty) => {
        const quantity = parseInt(qty);
        if (quantity <= 0 || isNaN(quantity)) return alert("Please enter a valid quantity");

        const existingItem = cart.find(item => item.medicine_id === medicine.medicine_id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.medicine_id === medicine.medicine_id 
                ? { ...item, quantity: item.quantity + quantity } 
                : item
            ));
        } else {
            setCart([...cart, { ...medicine, quantity }]);
        }
    };

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const styles = {
        // ব্যাকগ্রাউন্ড ইমেজ সেটআপ
        container: { 
            minHeight: '100vh', 
            width: '100%', 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${medicineBg})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            backgroundAttachment: 'fixed',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 20px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        },
        // ফর্ম বা টেবিলের জন্য গ্লাস লুক
        contentBox: {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            padding: '30px',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            width: '100%',
            maxWidth: '900px',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        },
        searchBar: { 
            width: '100%', 
            padding: '15px', 
            marginBottom: '25px', 
            borderRadius: '10px', 
            border: 'none', 
            fontSize: '16px',
            outline: 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        },
        table: { width: '100%', borderCollapse: 'collapse', color: 'white' },
        th: { borderBottom: '2px solid rgba(255,255,255,0.3)', padding: '15px', textAlign: 'left', fontSize: '18px' },
        td: { padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
        qtyInput: { width: '60px', padding: '8px', marginRight: '10px', borderRadius: '5px', border: 'none', textAlign: 'center' },
        buyBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' },
        cartBox: { 
            marginTop: '30px', 
            padding: '20px', 
            backgroundColor: 'rgba(40, 167, 69, 0.2)', 
            borderRadius: '15px', 
            border: '1px solid #28a745' 
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.contentBox}>
                <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>🏥 E-Pharmacy Store</h1>

                <input 
                    type="text" 
                    placeholder="🔍 Search for medicine name..." 
                    style={styles.searchBar}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Medicine Name</th>
                            <th style={styles.th}>Price (BDT)</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMedicines.length > 0 ? (
                            filteredMedicines.map(med => (
                                <tr key={med.medicine_id}>
                                    <td style={styles.td}>{med.name}</td>
                                    <td style={styles.td}>{med.price} ৳</td>
                                    <td style={styles.td}>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            defaultValue="1" 
                                            id={`qty-${med.medicine_id}`}
                                            style={styles.qtyInput} 
                                        />
                                        <button 
                                            style={styles.buyBtn}
                                            onClick={() => {
                                                const qty = document.getElementById(`qty-${med.medicine_id}`).value;
                                                addToCart(med, qty);
                                            }}
                                        >
                                            Add to Cart
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#ff4d4d', fontWeight: 'bold' }}>
                                    ⚠️ No medicine found in our stock!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {cart.length > 0 && (
                    <div style={styles.cartBox}>
                        <h3>🛒 Your Shopping Cart</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {cart.map((item, index) => (
                                <li key={index} style={{ marginBottom: '10px', borderBottom: '1px ridge rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
                                    ✅ {item.name} — {item.quantity} পিস x {item.price} = <strong>{(item.price * item.quantity).toFixed(2)} ৳</strong>
                                </li>
                            ))}
                        </ul>
                        <div style={{ textAlign: 'right', marginTop: '15px' }}>
                            <h3 style={{ borderTop: '2px solid white', paddingTop: '10px' }}>
                                Total Amount: {totalPrice.toFixed(2)} ৳
                            </h3>
                            <button 
                                style={{ ...styles.buyBtn, backgroundColor: '#007bff', padding: '12px 30px', marginTop: '10px' }}
                                onClick={() => alert(`Order Confirmed! Total Bill: ${totalPrice} ৳`)}
                            >
                                Checkout Now
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Medicines;
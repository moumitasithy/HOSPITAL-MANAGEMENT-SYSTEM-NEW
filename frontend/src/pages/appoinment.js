import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarPlus, FaArrowLeft, FaSearch } from 'react-icons/fa';
import coverImage from '../assets/appoinment.jpg'; 

const Appointment = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [doctorServices, setDoctorServices] = useState([]); 
    const [timeSlots, setTimeSlots] = useState([]); 
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        email: '',
        age: '',
        gender: '',
        blood_group: '',
        patient_type: 'Out-patient',
        date: '', // এটিই ডাটাবেসের appointment_date হিসেবে যাবে
        slotId: '',
        doctorId: '' 
    });

    useEffect(() => {
        fetch('http://localhost:5000/api/get-time-slots')
            .then(res => res.json())
            .then(data => setTimeSlots(data))
            .catch(err => console.error("Error fetching slots:", err));
    }, []);

    const handleSearch = async () => {
        if (!searchTerm) return alert("Please type something to search!");
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/search-doctors-service?query=${searchTerm}`);
            const data = await response.json();
            setDoctorServices(data);
            if(data.length === 0) alert("No doctors found for this specialization!");
        } catch (err) {
            alert("Search failed! Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // ভ্যালিডেশন চেক
        if(!formData.doctorId || !formData.slotId || !formData.date) {
            return alert("Please select a Doctor, Date, and Time Slot!");
        }
        
        setLoading(true);

        // ডাটাবেসের সাথে মিল রাখার জন্য ডাটা অবজেক্ট তৈরি
        const payload = {
            ...formData,
            appointment_date: formData.date, // 'date' কে 'appointment_date' নামে পাঠানো হচ্ছে
        };

        try {
            const response = await fetch('http://localhost:5000/api/book-appointment-full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload), // formData এর বদলে payload পাঠানো হচ্ছে
            });

            const result = await response.json();

            if (response.ok) {
                alert("Success! Your appointment request has been sent to the receptionist.");
                navigate('/');
            } else {
                throw new Error(result.error || "Booking failed");
            }
        } catch (error) {
            console.error("Submission Error:", error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        container: {
            minHeight: '100vh', width: '100%',
            backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${coverImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px',
            fontFamily: 'Poppins, sans-serif'
        },
        formBox: {
            backgroundColor: 'rgba(255, 255, 255, 0.98)', padding: '35px',
            borderRadius: '20px', maxWidth: '650px', width: '100%', boxShadow: '0 15px 35px rgba(0,0,0,0.5)'
        },
        label: { fontWeight: '600', color: '#333', marginTop: '15px', display: 'block' },
        input: {
            width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px',
            border: '1px solid #ccc', fontSize: '15px', boxSizing: 'border-box'
        },
        searchBtn: { padding: '0 20px', backgroundColor: '#00796b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
        submitBtn: { width: '100%', padding: '15px', backgroundColor: '#00796b', color: 'white', fontWeight: 'bold', fontSize: '18px', marginTop: '20px', cursor: 'pointer', border: 'none', borderRadius: '8px' }
    };

    return (
        <div style={styles.container}>
            <button onClick={() => navigate('/')} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaArrowLeft /> Back to Home
            </button>

            <div style={styles.formBox}>
                <h2 style={{ color: '#00796b', textAlign: 'center', marginBottom: '20px' }}>
                    <FaCalendarPlus /> Direct Appointment Request
                </h2>

                <div style={{ marginBottom: '25px', padding: '20px', background: '#f0f4f4', borderRadius: '12px', border: '1px solid #dee2e6' }}>
                    <label style={styles.label}>1. Find Your Doctor:</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input style={{ ...styles.input, margin: 0 }} placeholder="Search Doctor or Specialization..." onChange={(e) => setSearchTerm(e.target.value)} />
                        <button onClick={handleSearch} style={styles.searchBtn}>
                            <FaSearch />
                        </button>
                    </div>
                    {doctorServices.length > 0 && (
                        <select style={{ ...styles.input, marginTop: '15px', borderColor: '#00796b' }} name="doctorId" required onChange={handleChange}>
                            <option value="">-- Click to Select Doctor --</option>
                            {doctorServices.map(doc => (
                                <option key={doc.user_id} value={doc.user_id}>{doc.name} ({doc.specialization_name})</option>
                            ))}
                        </select>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <label style={styles.label}>2. Patient Details:</label>
                    <input style={styles.input} type="text" name="name" placeholder="Full Name" required onChange={handleChange} />
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input style={styles.input} type="email" name="email" placeholder="Email Address" required onChange={handleChange} />
                        <input style={styles.input} type="tel" name="phone_number" placeholder="Phone Number" required onChange={handleChange} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input style={styles.input} type="number" name="age" placeholder="Age" required onChange={handleChange} />
                        <select style={styles.input} name="gender" required onChange={handleChange}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        <select style={styles.input} name="blood_group" required onChange={handleChange}>
                            <option value="">Blood Group</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                    </div>

                    <label style={styles.label}>3. Select Schedule:</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input style={styles.input} type="date" name="date" required onChange={handleChange} />
                        <select style={styles.input} name="slotId" required onChange={handleChange}>
                            <option value="">Choose Time Slot</option>
                            {timeSlots.map(slot => (
                                <option key={slot.time_slot_id} value={slot.time_slot_id}>
                                    {slot.start_time} - {slot.end_time}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" style={styles.submitBtn} disabled={loading}>
                        {loading ? "Sending Request..." : "Confirm & Book Now"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Appointment;
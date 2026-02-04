import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCalendarPlus, FaArrowLeft } from 'react-icons/fa';
import coverImage from '../assets/appoinment.jpg'; 



const Appointment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const preSelectedDoctor = location.state?.doctorName || "";

    const [formData, setFormData] = useState({
        patientName: '',
        phone: '',
        doctorName: preSelectedDoctor,
        date: '',
        time: '',
    });

    const [loading, setLoading] = useState(false); 

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

   
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

   
        const appointmentData = {
            patient_name: formData.patientName, 
            phone: formData.phone,
            doctor_name: formData.doctorName,
            appointment_date: formData.date,
            time_slot: formData.time 
        };

        try {
          
            const response = await fetch('http://localhost:5000/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointmentData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Something went wrong!");
            }

            alert("Appointment Booked Successfully in Local Database!");
            navigate('/');
        } catch (error) {
            alert("Connection Error: " + error.message + ". Make sure your backend server is running.");
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        container: {
            minHeight: '100vh',
            width: '100%',
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: "'Segoe UI', Roboto, sans-serif",
            padding: '40px 20px'
        },
        formBox: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '40px',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            textAlign: 'left'
        },
        input: {
            width: '100%',
            padding: '12px',
            margin: '10px 0',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
            boxSizing: 'border-box'
        },
        button: {
            width: '100%',
            padding: '15px',
            backgroundColor: loading ? '#ccc' : '#0097a7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '20px',
            transition: '0.3s'
        }
    };

    return (
        <div style={styles.container}>
            <div 
                onClick={() => navigate('/doctors')} 
                style={{ cursor: 'pointer', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'center' }}
            >
                <FaArrowLeft /> Back to Doctors
            </div>

            <div style={styles.formBox}>
                <h2 style={{ color: '#0097a7', textAlign: 'center', marginBottom: '25px' }}>
                    <FaCalendarPlus style={{ marginRight: '10px' }} /> Book Appointment
                </h2>
                
                <form onSubmit={handleSubmit}>
                    <label style={{fontWeight: 'bold'}}>Patient Name:</label>
                    <input style={styles.input} type="text" name="patientName" placeholder="Enter Full Name" required onChange={handleChange} />
                    
                    <label style={{fontWeight: 'bold'}}>Phone Number:</label>
                    <input style={styles.input} type="tel" name="phone" placeholder="Enter Phone Number" required onChange={handleChange} />
                    
                    <label style={{fontWeight: 'bold'}}>Doctor Name:</label>
                    <input style={{...styles.input, backgroundColor: '#f0f0f0'}} type="text" name="doctorName" value={formData.doctorName} readOnly />

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{fontWeight: 'bold'}}>Date:</label>
                            <input style={styles.input} type="date" name="date" required onChange={handleChange} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{fontWeight: 'bold'}}>Time Slot:</label>
                            <select style={styles.input} name="time" required onChange={handleChange}>
                                <option value="">Select</option>
                                <option value="10:00 AM">10:00 AM</option>
                                <option value="02:00 PM">02:00 PM</option>
                                <option value="06:00 PM">06:00 PM</option>
                            </select>
                        </div>
                    </div>
                    
                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? "Processing..." : "Confirm Appointment"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Appointment;
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const multer = require('multer'); // ১. multer ইমপোর্ট
const path = require('path');    // পাথ হ্যান্ডলিংয়ের জন্য
const fs = require('fs');        // ফাইল সিস্টেম চেক করার জন্য
const app = express();

app.use(cors());
app.use(express.json());

// ২. 'uploads' ফোল্ডারকে স্ট্যাটিক করা যাতে ব্রাউজার থেকে ছবি দেখা যায়
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ৩. uploads ফোল্ডার না থাকলে তৈরি করা
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ৪. Multer স্টোরেজ কনফিগারেশন
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // ফাইল সেভ হওয়ার লোকেশন
    },
    filename: (req, file, cb) => {
        // ফাইলের নাম ইউনিক করা (যেমন: 1712345678-doctor.jpg)
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// --- API Routes ---

app.get('/users', async (req, res) => {
  try {
    const allUsers = await pool.query("SELECT * FROM users");
    res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/api/specializations', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM specializations ORDER BY specialization_name ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/qualifications', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM qualification ORDER BY qualification_name ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/*
app.post('/api/appointments', async (req, res) => {
  try {
    const { patient_name, phone, doctor_name, appointment_date, time_slot } = req.body;
    const newAppointment = await pool.query(
      "INSERT INTO quick_appointments (patient_name, phone, doctor_name, appointment_date, time_slot) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [patient_name, phone, doctor_name, appointment_date, time_slot]
    );
    res.json({ message: "Success", data: newAppointment.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Database insertion failed!" });
  }
});*/app.post('/api/book-appointment-full', async (req, res) => {
    // ফ্রন্টএন্ড থেকে 'date', 'slotId', 'doctorId' এই নামে ডাটা আসছে
    const { 
        name, phone_number, email, age, gender, blood_group, patient_type,
        date, slotId, doctorId 
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ধাপ ১: পেশেন্ট তৈরি বা আপডেট
        const patientRes = await client.query(
            `INSERT INTO patients (name, phone_number, email, age, gender, blood_group, patient_type) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT (email) DO UPDATE SET phone_number = EXCLUDED.phone_number 
             RETURNING patient_id`,
            [name, phone_number, email, age, gender, blood_group, patient_type || 'Out-patient']
        );
        const patientId = patientRes.rows[0].patient_id;

        // ধাপ ২: সার্ভিস রো তৈরি
        const serviceRes = await client.query(
            'INSERT INTO service (patient_id) VALUES ($1) RETURNING service_id',
            [patientId]
        );
        const serviceId = serviceRes.rows[0].service_id;

        // ধাপ ৩: ডক্টর ও সার্ভিস ম্যাপিং
        await client.query(
            'INSERT INTO DOCTOR_SERVES (user_id, service_id) VALUES ($1, $2)',
            [doctorId, serviceId]
        );

        // ধাপ ৪: অ্যাপয়েন্টমেন্ট বুক করা (এখানে $1 এ 'date' পাঠানো হয়েছে)
        await client.query(
            `INSERT INTO appointments (appointment_date, time_slot_id, service_id, status) 
             VALUES ($1, $2, $3, 'Pending')`,
            [date, slotId, serviceId] 
        );

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: "Appointment booked successfully!" });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Booking Error Detail:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});
// ৫. Modified Create Account with Multer
app.post('/api/createaccount', upload.single('image'), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { name, email, phone_number, password, role, consultation_fee, qualification, specialization } = req.body;

        // ইমেজ পাথ তৈরি করা (যদি ছবি থাকে)
        const image_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

        const roleRes = await client.query("SELECT role_id FROM roles WHERE role_name = $1", [role]);
        const roleId = roleRes.rows[0].role_id;

        const userRes = await client.query(
            "INSERT INTO users (name, email, phone_number, password, role_id) VALUES($1, $2, $3, $4, $5) RETURNING user_id",
            [name, email, phone_number, password, roleId]
        );
        const userId = userRes.rows[0].user_id;

        if (role === 'Doctor') {
            await client.query(
                "INSERT INTO doctors (user_id, consultation_fee, image_url) VALUES($1, $2, $3)",
                [userId, consultation_fee, image_url]
            );

            if (specialization) {
                await client.query(
                    "INSERT INTO doctor_specialization (specialization_id, doctor_id) VALUES($1, $2)",
                    [specialization, userId]
                );
            }

            if (qualification) {
                await client.query(
                    "INSERT INTO doctor_qualification (qualification_id, doctor_id) VALUES($1, $2)",
                    [qualification, userId]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: "Account created successfully!" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Registration Error:", err.message);
        res.status(500).json({ error: "Database error: " + err.message });
    } finally {
        client.release();
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userQuery = await pool.query(
            `SELECT u.*, r.role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.role_id 
             WHERE u.email = $1`, 
            [email]
        );

        if (userQuery.rows.length === 0) {
            return res.status(401).json({ error: "ইউজার পাওয়া যায়নি!" });
        }

        const user = userQuery.rows[0];
        if (user.password !== password) {
            return res.status(401).json({ error: "ভুল পাসওয়ার্ড!" });
        }

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.user_id,
                name: user.name,
                role: user.role_name,
                email: user.email
            }
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ error: "Server error: " + err.message });
    }
});

app.get('/api/doctors-list', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.name, 
                d.consultation_fee, 
                d.image_url,
                STRING_AGG(DISTINCT s.specialization_name, ', ') as specializations,
                STRING_AGG(DISTINCT q.qualification_name, ', ') as qualifications
            FROM doctors d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN doctor_specialization ds ON d.user_id = ds.doctor_id
            LEFT JOIN specializations s ON ds.specialization_id = s.specialization_id
            LEFT JOIN doctor_qualification dq ON d.user_id = dq.doctor_id
            LEFT JOIN qualification q ON dq.qualification_id = q.qualification_id
            GROUP BY u.user_id, d.consultation_fee, d.image_url;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to fetch doctors" });
    }
});
// মেডিসিন লিস্ট নিয়ে আসা
app.get('/api/medicines', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM medicines ORDER BY name ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// মেডিসিন কেনার (Order) API
app.post('/api/buy-medicine', async (req, res) => {
    const { medicine_id, buy_quantity } = req.body;
    try {
        // স্টকে পর্যাপ্ত মেডিসিন আছে কি না চেক করা এবং আপডেট করা
        const result = await pool.query(
            "UPDATE medicines SET quantity_instock = quantity_instock - $1 WHERE medicine_id = $2 AND quantity_instock >= $1 RETURNING *",
            [buy_quantity, medicine_id]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Insufficient stock or medicine not found!" });
        }
        res.json({ message: "Purchase successful!", data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/search-doctors-service', async (req, res) => {
    const { query } = req.query;
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.name, spec.specialization_name 
             FROM users u
             JOIN roles r ON u.role_id = r.role_id
             JOIN doctor_specialization d_spec ON u.user_id = d_spec.doctor_id
             JOIN specializations spec ON d_spec.specialization_id = spec.specialization_id
             WHERE r.role_name = 'Doctor' 
             AND (u.name ILIKE $1 OR spec.specialization_name ILIKE $1)`,
            [`%${query}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ২. ডাটাবেস থেকে টাইম স্লট নিয়ে আসা
app.get('/api/get-time-slots', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM time_slot");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ১. সকল পেন্ডিং অ্যাপয়েন্টমেন্ট দেখার এপিআই
app.get('/api/pending-appointments', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.appointment_id, a.appointment_date, ts.start_time, ts.end_time, 
                    p.name as patient_name, p.phone_number, u.name as doctor_name
             FROM appointments a
             JOIN service s ON a.service_id = s.service_id
             JOIN patients p ON s.patient_id = p.patient_id
             JOIN doctor_serves ds ON s.service_id = ds.service_id
             JOIN users u ON ds.user_id = u.user_id
             JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
             WHERE a.status = 'Pending'
             ORDER BY a.appointment_date ASC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ২. অ্যাপয়েন্টমেন্ট কনফার্ম করার এপিআই
app.put('/api/confirm-appointment/:id', async (req, res) => {
    const { id } = req.params;
    const { receptionist_id } = req.body; // ফ্রন্টএন্ড থেকে লগইন করা রিসেপশনিস্টের আইডি আসবে

    try {
        await pool.query(
            `UPDATE appointments 
             SET status = 'Confirmed', receptionists_id = $1 
             WHERE appointment_id = $2`,
            [receptionist_id, id]
        );
        res.json({ message: "Appointment Confirmed Successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
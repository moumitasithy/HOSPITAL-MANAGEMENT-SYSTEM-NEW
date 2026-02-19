const express = require('express');
const cors = require('cors');
const pool = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });

// --- API Routes ---


app.get('/users', async (req, res) => {
  try {
    const allUsers = await pool.query("SELECT * FROM users");
    return res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

app.post('/api/book-appointment-full', async (req, res) => {
    const { 
        name, phone_number, email, age, gender, blood_group, patient_type,
        date, appointment_time, doctorId 
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const patientRes = await client.query(
            `INSERT INTO patients (name, phone_number, email, age, gender, blood_group, patient_type) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT (email) DO UPDATE SET phone_number = EXCLUDED.phone_number 
             RETURNING patient_id`,
            [name, phone_number, email, age, gender, blood_group, patient_type || 'Out-patient']
        );
        const patientId = patientRes.rows[0].patient_id;

        const serviceRes = await client.query(
            'INSERT INTO service (patient_id) VALUES ($1) RETURNING service_id',
            [patientId]
        );
        const serviceId = serviceRes.rows[0].service_id;

        await client.query(
            'INSERT INTO doctor_serves (user_id, service_id) VALUES ($1, $2)',
            [doctorId, serviceId]
        );

        await client.query(
            `INSERT INTO appointments (appointment_date, appointment_time, service_id, status) 
             VALUES ($1, $2, $3, 'Pending')`,
            [date, appointment_time, serviceId] 
        );

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: "Appointment booked successfully!" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ২. পেন্ডিং অ্যাপয়েন্টমেন্ট লিস্ট (রিসেপশনিস্ট ড্যাশবোর্ডের জন্য)

// server.js এর এই অংশটি পরিবর্তন করুন
app.get('/api/pending-appointments', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.appointment_id, a.appointment_date, a.appointment_time, 
                    p.name as patient_name, p.phone_number, 
                    u.name as doctor_name, u.user_id as doctor_id 
             FROM appointments a
             JOIN service s ON a.service_id = s.service_id
             JOIN patients p ON s.patient_id = p.patient_id
             JOIN doctor_serves ds ON s.service_id = ds.service_id
             JOIN users u ON ds.user_id = u.user_id
             WHERE a.status = 'Pending'
             ORDER BY a.appointment_date ASC`
        );
        return res.json(result.rows);
    } catch (err) {
        return res.status(500).json({ error: "Database error" });
    }
});
// নির্দিষ্ট ডক্টরের শিডিউল দেখার জন্য এপিআই
app.get('/api/doctor-availability/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT date, day, hours_start, hours_end, details 
             FROM schedules 
             WHERE doctor_id = $1 AND IS_ACTIVE = 1 
             ORDER BY date ASC`, 
            [id]
        );
        return res.json(result.rows);
    } catch (err) {
        console.error("Schedule Error:", err.message);
        return res.status(500).json({ error: "Failed to fetch schedule" });
    }
});
// ৩. একাউন্ট ক্রিয়েশন (রিসেপশনিস্ট টেবিল হ্যান্ডলিং সহ)
app.post('/api/createaccount', upload.single('image'), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { 
            name, email, phone_number, password, role, 
            consultation_fee, qualification, specialization 
        } = req.body;
        
        const image_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

        const roleRes = await client.query("SELECT role_id FROM roles WHERE role_name = $1", [role]);
        if (roleRes.rows.length === 0) throw new Error("Role not found");
        const roleId = roleRes.rows[0].role_id;

        const userRes = await client.query(
            "INSERT INTO users (name, email, phone_number, password, role_id) VALUES($1, $2, $3, $4, $5) RETURNING user_id",
            [name, email, phone_number, password, roleId]
        );
        const userId = userRes.rows[0].user_id;

        // যদি রোল 'Doctor' হয়
        if (role === 'Doctor') {
            await client.query(
                "INSERT INTO doctors (user_id, consultation_fee, image_url) VALUES($1, $2, $3)",
                [userId, consultation_fee, image_url]
            );

            if (specialization && specialization !== "" && specialization !== "undefined") {
                await client.query(
                    "INSERT INTO doctor_specialization (specialization_id, doctor_id) VALUES($1, $2)", 
                    [parseInt(specialization), userId]
                );
            }

            if (qualification && qualification !== "" && qualification !== "undefined") {
                await client.query(
                    "INSERT INTO doctor_qualification (qualification_id, doctor_id) VALUES($1, $2)", 
                    [parseInt(qualification), userId]
                );
            }
        } 
        // যদি রোল 'Receptionist' হয় (রিসেপশনিস্ট টেবিলে ইনসার্ট)
        else if (role === 'Receptionist') {
            await client.query(
                "INSERT INTO receptionists (user_id) VALUES($1)",
                [userId]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: "Account created successfully" });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Signup Error:", err.message);
        res.status(500).json({ error: "Failed: " + err.message });
    } finally {
        client.release();
    }
});


// ৫. ডক্টর শিডিউল দেখা (রিসেপশনিস্ট এবং পেশেন্টদের জন্য)
app.get('/api/doctor-schedules', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, u.name as doctor_name 
             FROM schedules s 
             JOIN users u ON s.doctor_id = u.user_id 
             WHERE s.IS_ACTIVE = 1`
        );
        return res.json(result.rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// ৮. ডক্টর শিডিউল সেভ করা (DoctorSchedule.js এর জন্য)
app.post('/api/add-doctor-schedule', async (req, res) => {
    const { doctor_id, date, day, hours_start, hours_end, details } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO schedules (doctor_id, date, day, hours_start, hours_end, details, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, 1) RETURNING *`, 
            [doctor_id, date, day, hours_start, hours_end, details]
        );
        res.status(201).json({ success: true, message: "Schedule Saved!", data: result.rows[0] });
    } catch (err) {
        console.error("Save Schedule Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});
// ৬. ড্রপডাউন ডাটা (Specializations & Qualifications)
app.get('/api/specializations', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM specializations ORDER BY specialization_name ASC");
        return res.json(result.rows);
    } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/qualifications', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM qualification ORDER BY qualification_name ASC");
        return res.json(result.rows); 
    } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ৭. লগইন
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query(
            "SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.email = $1", [email]
        );
        if (result.rows.length === 0 || result.rows[0].password !== password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        res.json({ user: { id: result.rows[0].user_id, name: result.rows[0].name, role: result.rows[0].role_name } });
    } catch (err) { return res.status(500).json({ error: err.message }); }
});


// সার্চ ডক্টর (পেশেন্ট অ্যাপয়েন্টমেন্টের জন্য)
app.get('/api/search-doctors-service', async (req, res) => {
    const { query } = req.query;
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.name, spec.specialization_name 
             FROM users u
             JOIN doctor_specialization d_spec ON u.user_id = d_spec.doctor_id
             JOIN specializations spec ON d_spec.specialization_id = spec.specialization_id
             WHERE u.name ILIKE $1 OR spec.specialization_name ILIKE $1`,
            [`%${query}%`]
        );
        return res.json(result.rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// কনফার্ম অ্যাপয়েন্টমেন্ট
app.put('/api/confirm-appointment/:id', async (req, res) => {
    const { id } = req.params;
    const { receptionist_id } = req.body; // ফ্রন্টএন্ড থেকে আসা ৫

    try {
        const result = await pool.query(
            "UPDATE appointments SET status = 'Confirmed', receptionists_id = $1 WHERE appointment_id = $2",
            [receptionist_id, id]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "DB Error: " + err.message });
    }
});
app.get('/api/doctors-list', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.user_id,
                u.name, 
                d.consultation_fee, 
                d.image_url,
                COALESCE(STRING_AGG(DISTINCT s.specialization_name, ', '), 'General') as specializations,
                COALESCE(STRING_AGG(DISTINCT q.qualification_name, ', '), 'MBBS') as qualifications
            FROM doctors d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN doctor_specialization ds ON d.user_id = ds.doctor_id
            LEFT JOIN specializations s ON ds.specialization_id = s.specialization_id
            LEFT JOIN doctor_qualification dq ON d.user_id = dq.doctor_id
            LEFT JOIN qualification q ON dq.qualification_id = q.qualification_id
            GROUP BY u.user_id, u.name, d.consultation_fee, d.image_url;
        `;
        const result = await pool.query(query);
        return res.json(result.rows);
    } catch (err) {
        console.error("Doctor List Error:", err.message);
        return res.status(500).json({ error: "Failed to fetch doctors" });
    }
});


// মেডিসিন এপিআই
app.get('/api/medicines', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM medicines ORDER BY name ASC");
        return res.json(result.rows);
    } catch (err) {
        console.error("Medicine Error:", err.message);
        return res.status(500).json({ error: err.message });
    }
});
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
        return res.status(500).json({ error: err.message });
    }
});

// স্পেশালাইজেশন লিস্ট পাওয়ার এপিআই


// কোয়ালিফিকেশন লিস্ট পাওয়ার এপিআই
// এই কোডটি server.js এ আপডেট করুন
// server.js এর ভেতরে


app.listen(5000, () => { console.log("Server running on port 5000"); });
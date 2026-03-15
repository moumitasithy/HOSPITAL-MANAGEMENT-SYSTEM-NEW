const express = require('express');
const cors = require('cors');
const pool = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const bcrypt = require('bcrypt');
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
// server.js

app.get('/api/receptionist-users', async (req, res) => {
    try {
        // ডাটাবেস থেকে role_id = 2 (Receptionist) এর ডাটা আনা হচ্ছে
        const result = await pool.query(`
            SELECT u.user_id, u.name, u.email, u.phone_number, r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.role_id = 2
            ORDER BY u.user_id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("API Error:", err.message);
        res.status(500).json({ error: "ডাটা লোড করা যায়নি" });
    }
});

app.get('/users', async (req, res) => {
  try {
    const allUsers = await pool.query("SELECT * FROM users");
    return res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});
app.post('/api/book-appointment', async (req, res) => {
    const { 
        name, phone_number, email, age, gender, 
        date, appointment_time, doctor_id 
    } = req.body;

    try {
        // নতুন প্রসিডিউর কল করা হচ্ছে (v3)
        // এই প্রসিডিউরটি patients এবং appointments টেবিলে ডাটা ইনসার্ট করবে
        await pool.query(
            'CALL book_appointment_v3($1, $2, $3, $4, $5, $6, $7, $8)',
            [name, phone_number, email, age, gender, date, appointment_time, doctor_id]
        );

        res.status(200).json({ 
            success: true, 
            message: "Appointment request sent to receptionist!" 
        });
    } catch (err) {
        console.error("Booking Error:", err.message);
        res.status(500).json({ 
            success: false, 
            error: "Internal Server Error. Please try again." 
        });
    }
});
// ২. পেন্ডিং অ্যাপয়েন্টমেন্ট লিস্ট (রিসেপশনিস্ট ড্যাশবোর্ডের জন্য)

app.get('/api/pending-appointments', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                a.appointment_id, 
                a.appointment_date, 
                a.appointment_time, 
                a.status,
                p.name as patient_name, 
                p.phone_number as patient_phone, 
                u.name as doctor_name, 
                u.user_id as doctor_id 
             FROM appointments a
             JOIN patients p ON a.patient_id = p.patient_id
             JOIN users u ON a.doctor_id = u.user_id
             WHERE a.status = 'Pending'
             ORDER BY a.appointment_date ASC, a.appointment_time ASC`
        );
        
        return res.json(result.rows);
    } catch (err) {
        console.error("Fetch Pending Error:", err.message);
        return res.status(500).json({ error: "Database error while fetching pending appointments" });
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

app.post('/api/createaccount', upload.single('image'), async (req, res) => {
    try {
        const { name, email, phone_number, password, role, consultation_fee, qualification, specialization } = req.body;
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const image_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

        // ফ্রন্টএন্ড থেকে আসা স্ট্রিংগুলোকে অবজেক্টে রূপান্তর
        const specArr = specialization ? JSON.parse(specialization) : [];
        const qualArr = qualification ? JSON.parse(qualification) : [];

        if (role === 'Doctor') {
            await pool.query(
                "INSERT INTO pending_doctors (name, email, phone_number, password, consultation_fee, image_url, specialization, qualification) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                [name, email, phone_number, hashedPassword, consultation_fee, image_url, JSON.stringify(specArr), JSON.stringify(qualArr)]
            );
            return res.status(201).json({ success: true, message: "Pending for Admin Approval" });
        }

        // বাকিদের জন্য (Receptionist/Admin) সরাসরি তৈরি
        await pool.query("CALL create_account($1, $2, $3, $4, $5, $6, $7, $8, $9)", [
            name, email, phone_number, hashedPassword, role, consultation_fee || 0, image_url, specArr, qualArr
        ]);
        res.status(201).json({ success: true, message: "Account created" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userRes = await pool.query(
            "SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.email = $1", 
            [email]
        );

        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = userRes.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        res.json({
            success: true,
            user: { id: user.user_id, name: user.name, role: user.role_name }
        });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
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
app.post('/api/add-bulk-schedule', async (req, res) => {
    const { doctor_id, startDate, endDate, selectedDays, hours_start, hours_end } = req.body;
    
    // ১. চেক করুন ইনপুট ডাটা ঠিকমতো আসছে কি না
    console.log("--- DEBUG START ---");
    console.log("Doctor ID:", doctor_id);
    console.log("Date Range:", startDate, "to", endDate);
    console.log("Selected Days:", selectedDays);

    const daysMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    const selectedIndexes = selectedDays.map(d => daysMap[d]);

    let current = new Date(startDate + "T00:00:00");
    const last = new Date(endDate + "T00:00:00");

    let matchFound = 0;
    let insertCount = 0;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        while (current <= last) {
            if (selectedIndexes.includes(current.getDay())) {
                matchFound++; // চেক করছি লুপের ভেতর দিন ম্যাচ করছে কি না
                
                const dateStr = current.toISOString().split('T')[0];
                
                const result = await client.query(
                    `INSERT INTO schedules (doctor_id, date, day, hours_start, hours_end, is_active)
                     VALUES ($1, $2, $3, $4, $5, 1)
                     ON CONFLICT (doctor_id, date) DO NOTHING
                     RETURNING *`,
                    [doctor_id, dateStr, selectedDays.find(d => daysMap[d] === current.getDay()), hours_start, hours_end]
                );

                if (result.rowCount > 0) {
                    insertCount++;
                } else {
                    console.log(`Skipped (Already Exists): ${dateStr}`);
                }
            }
            current.setDate(current.getDate() + 1);
        }

        await client.query('COMMIT');
        
        console.log("Matches Found in Loop:", matchFound);
        console.log("Successfully Inserted:", insertCount);
        console.log("--- DEBUG END ---");

        res.json({ 
            success: true, 
            message: insertCount > 0 ? `${insertCount} days saved!` : `0 days saved. (Matches: ${matchFound}, check terminal)` 
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("DB ERROR:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
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
 //ড্রপডাউন ডাটা (Specializations & Qualifications)
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


// Medical Tests list poyar API
app.get('/api/test_details', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM test_details ORDER BY test_id ASC");
        res.json(result.rows); // result.rows একটি অ্যারে পাঠায়
    } catch (err) {
        res.status(500).json([]); // এরর হলে খালি অ্যারে পাঠান
    }
});

app.get('/api/search-doctors-service', async (req, res) => {
    const { query } = req.query;
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.name, spec.specialization_name 
             FROM users u
             JOIN doctor_specialization d_spec ON u.user_id = d_spec.doctor_id
             JOIN specializations spec ON d_spec.specialization_id = spec.specialization_id
             WHERE u.name ILIKE $1 OR spec.specialization_name ILIKE $1`,
            [`%${query || ''}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ১. নির্দিষ্ট ডাক্তারের সব শিডিউল গেট করা
app.get('/api/doctor-manage-schedules/:id', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM schedules WHERE doctor_id = $1 ORDER BY date ASC", 
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ২. শিডিউল স্ট্যাটাস (Active/Inactive) আপডেট করা
app.put('/api/update-schedule-status', async (req, res) => {
    const { schedule_id, is_active } = req.body;
    try {
        await pool.query(
            "UPDATE schedules SET is_active = $1 WHERE schedule_id = $2",
            [is_active, schedule_id]
        );
        res.json({ success: true, message: "Status updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ১. টোটাল সার্ভড সংখ্যা (যেটা আপনি দিয়েছেন)

/*app.get('/api/doctor-appointment-counts/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                appointment_date::DATE as appointment_date, 
                COUNT(*)::INT as daily_count 
            FROM appointments a
            JOIN service s ON a.service_id = s.service_id
            JOIN doctor_serves ds ON s.service_id = ds.service_id
            WHERE ds.user_id = $1
            GROUP BY appointment_date::DATE
            ORDER BY appointment_date DESC`, 
            [req.params.id]
        );
        console.log("Data for ID " + req.params.id + ":", result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send(err.message);
    }
});*/

app.delete('/api/delete-user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
        res.json({ success: true, message: "User and all related profiles deleted successfully!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to delete user: " + err.message });
    }
});
// ১. ক্যানসেল এপিআই
app.delete('/api/cancel-appointment/:id', async (req, res) => {
    try {
        await pool.query('CALL cancel_appointment_v3($1)', [req.params.id]);
        res.json({ success: true, message: "Deleted and Archived!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.put('/api/confirm-appointment/:id', async (req, res) => {
    const { receptionist_id } = req.body;
    try {
        await pool.query('CALL confirm_appointment_v3($1, $2)', [req.params.id, receptionist_id]);
        res.json({ success: true, message: "Appointment Confirmed!" });
    } catch (err) {
        // ডাটাবেসের RAISE EXCEPTION এখানে ক্যাচ হবে
        console.error(err.message);
        res.status(400).json({ error: err.message }); 
    }
});


// ১. পেন্ডিং ডাক্তারদের লিস্ট পাওয়ার এপিআই
app.get('/api/admin/pending-doctors', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM pending_doctors ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Pending Error:", err.message);
        res.status(500).json({ error: "পেন্ডিং লিস্ট লোড করতে সমস্যা হয়েছে" });
    }
});
app.post('/api/admin/approve-doctor/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect(); 

    try {
        await client.query('BEGIN');

        const pendingResult = await client.query("SELECT * FROM pending_doctors WHERE pending_id = $1", [id]);
        if (pendingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "ডাক্তারের তথ্য পাওয়া যায়নি" });
        }

        const d = pendingResult.rows[0];

        // ডাটাবেস থেকে আসা JSON/String ডাটাকে Array তে রূপান্তর
        const spec = Array.isArray(d.specialization) ? d.specialization : JSON.parse(d.specialization || '[]');
        const qual = Array.isArray(d.qualification) ? d.qualification : JSON.parse(d.qualification || '[]');

        await client.query(
            "CALL create_account($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [d.name, d.email, d.phone_number, d.password, 'Doctor', d.consultation_fee || 0, d.image_url, spec, qual]
        );

        await client.query("DELETE FROM pending_doctors WHERE pending_id = $1", [id]);
        await client.query('COMMIT'); 
        res.json({ success: true, message: "Doctor approved successfully!" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});


app.delete('/api/delete-user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // এই একটি লাইন কমান্ড দিলে ট্রিগার অটোমেটিক আর্কাইভ এবং ক্লিনআপ করে দিবে
        const result = await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
        
        if (result.rowCount > 0) {
            res.json({ message: "User deleted and archived successfully!" });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// ১. পেন্ডিং ডাক্তারকে সরাসরি ডিলিট/রিজেক্ট করার এপিআই
// Pending doctor reject/delete korar jonno (Kono archive hobe na)
app.delete('/api/admin/reject-doctor/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Shudhu pending_doctors table theke delete korbe
        const result = await pool.query("DELETE FROM pending_doctors WHERE pending_id = $1", [id]);
        
        if (result.rowCount > 0) {
            res.json({ success: true, message: "Doctor request removed permanently." });
        } else {
            res.status(404).json({ error: "Doctor not found in pending list." });
        }
    } catch (err) {
        console.error("Delete Error:", err.message);
        res.status(500).json({ error: "Failed to delete: " + err.message });
    }
});

app.get('/api/admin/pending-details/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const doctorId = parseInt(id); // স্ট্রিং থেকে ইনটিজারে রূপান্তর

        if (isNaN(doctorId)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const result = await pool.query("SELECT * FROM pending_doctors WHERE pending_id = $1", [doctorId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        const doc = result.rows[0];

        // JSONB আইডি থেকে নাম রিট্রিভ করা
        const specIds = Array.isArray(doc.specialization) ? doc.specialization : [];
        const qualIds = Array.isArray(doc.qualification) ? doc.qualification : [];

        const specs = await pool.query("SELECT specialization_name FROM specializations WHERE specialization_id = ANY($1::int[])", [specIds]);
        const quals = await pool.query("SELECT qualification_name FROM qualifications WHERE qualification_id = ANY($1::int[])", [qualIds]);

        res.json({
            ...doc,
            specialization_names: specs.rows.map(r => r.specialization_name),
            qualification_names: quals.rows.map(r => r.qualification_name)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.listen(5000, () => { console.log("Server running on port 5000"); });
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


const jwt = require('jsonwebtoken');
const JWT_SECRET = "HMS2305"; // এটি একটি গোপন স্ট্রিং
// ২. মিডলওয়্যার ফাংশন (লগইন এপিআই-এর আগে বা পরে যেকোনো জায়গায়)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // চেক করুন হেডার আছে কি না এবং সেটি 'Bearer ' দিয়ে শুরু কি না
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: "No token provided or invalid format" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Unauthorized! Token expired or invalid." });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};
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
    const client = await pool.connect(); // কানেকশন শুরু
    const { 
        name, phone_number, email, age, gender, 
        blood_group, date, appointment_time, doctor_id 
    } = req.body;

    try {
        await client.query('BEGIN'); // ট্রানজ্যাকশন শুরু

        await client.query(
            'CALL book_appointment_v3($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [name, phone_number, email, age, gender, blood_group, date, appointment_time, doctor_id]
        );

        await client.query('COMMIT'); // সব ঠিক থাকলে সেভ হবে
        res.status(200).json({ success: true, message: "Success!" });
    } catch (err) {
        await client.query('ROLLBACK'); // ভুল হলে আগের অবস্থায় ফেরত
        console.error("Booking Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release(); // কানেকশন ফ্রি করা
    }
});

// ২. পেন্ডিং অ্যাপয়েন্টমেন্ট লিস্ট (রিসেপশনিস্ট ড্যাশবোর্ডের জন্য)
app.get('/api/pending-appointments', verifyToken, async (req, res) => {
    // ১. শুধুমাত্র রিসেপশনিস্ট কি না তা চেক করা
    // আপনার ডাটাবেসে রোল যদি 'Receptionist' এভাবে থাকে
    if (req.userRole !== 'Receptionist') {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Only Receptionists can view pending appointments." 
        });
    }

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
        
        // ২. সাকসেসফুল রেসপন্স পাঠানো
        return res.json(result.rows);
    } catch (err) {
        console.error("Fetch Pending Error:", err.message);
        return res.status(500).json({ 
            success: false, 
            error: "Database error while fetching pending appointments" 
        });
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
    // ১. ডাটাবেস ক্লায়েন্ট কানেকশন শুরু
    const client = await pool.connect(); 

    try {
        const { name, email, phone_number, password, role, consultation_fee, qualification, specialization } = req.body;
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const image_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

        const specArr = specialization ? JSON.parse(specialization) : [];
        const qualArr = qualification ? JSON.parse(qualification) : [];

        // ২. ট্রানজ্যাকশন শুরু
        await client.query('BEGIN'); 

        if (role === 'Doctor') {
            await client.query(
                "INSERT INTO pending_doctors (name, email, phone_number, password, consultation_fee, image_url, specialization, qualification) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                [name, email, phone_number, hashedPassword, consultation_fee, image_url, JSON.stringify(specArr), JSON.stringify(qualArr)]
            );
            
            // ৩. কাজ সফল হলে কমিট
            await client.query('COMMIT'); 
            return res.status(201).json({ success: true, message: "Pending for Admin Approval" });
        }

        // বাকিদের জন্য (Receptionist/Admin)
        await client.query("CALL create_account($1, $2, $3, $4, $5, $6, $7, $8, $9)", [
            name, email, phone_number, hashedPassword, role, consultation_fee || 0, image_url, specArr, qualArr
        ]);

        // ৪. কাজ সফল হলে কমিট
        await client.query('COMMIT'); 
        res.status(201).json({ success: true, message: "Account created" });

    } catch (err) {
        // ৫. কোনো ভুল হলে সব রোলব্যাক (আগের অবস্থায় ফেরত)
        await client.query('ROLLBACK'); 
        console.error("Transaction Error:", err.message);
        res.status(500).json({ error: "Account creation failed", details: err.message });

    } finally {
        // ৬. ক্লায়েন্ট রিলিজ করা (অবশ্যই করতে হবে)
        client.release(); 
    }
});
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // ১. প্রথমে শুধু ইমেইল দিয়ে ইউজারকে খুঁজে বের করা (পাসওয়ার্ডসহ)
        const result = await pool.query(
            `SELECT u.user_id, u.name, u.password, r.role_name as role 
             FROM users u 
             JOIN roles r ON u.role_id = r.role_id 
             WHERE u.email = $1`, 
            [email]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];

            // ২. Bcrypt দিয়ে পাসওয়ার্ড চেক করা (পাসওয়ার্ড বনাম হ্যাশ)
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                // ৩. পাসওয়ার্ড মিললে JWT টোকেন তৈরি করা
                const token = jwt.sign(
                    { id: user.user_id, role: user.role }, 
                    JWT_SECRET, 
                    { expiresIn: '30m' }
                );

                // ৪. ফ্রন্টএন্ডে ডাটা পাঠানো
                return res.status(200).json({
                    success: true,
                    token: token,
                    user: { 
                        id: user.user_id, 
                        name: user.name, 
                        role: user.role 
                    }
                });
            } else {
                // পাসওয়ার্ড না মিললে
                return res.status(401).json({ 
                    success: false, 
                    message: "Invalid email or password" 
                });
            }
        } else {
            // ইমেইল না পাওয়া গেলে
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

    } catch (err) {
        console.error("Login Error Detailed:", err.message); 
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error"
        });
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
app.get('/api/doctor-manage-schedules/:id', verifyToken, async (req, res) => {
    // শুধুমাত্র ডক্টর কি না চেক করা
    if (req.userRole !== 'Doctor') {
        return res.status(403).json({ error: "Access denied. Only doctors can view their schedules." });
    }

    // নিজের আইডি ছাড়া অন্য কারও আইডি চেক করার চেষ্টা করলে ব্লক করা
    if (req.userId !== parseInt(req.params.id)) {
        return res.status(403).json({ error: "Access denied. You can only view your own schedule." });
    }

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
app.put('/api/update-schedule-status', verifyToken, async (req, res) => {
    // রোল চেক
    if (req.userRole !== 'Doctor') {
        return res.status(403).json({ error: "Access denied. Only doctors can update status." });
    }

    const { schedule_id, is_active } = req.body;

    try {
        // অতিরিক্ত নিরাপত্তা: নিশ্চিত করা যে এই শিডিউলটি আসলেই এই ডাক্তারের কি না
        const checkOwnership = await pool.query(
            "SELECT doctor_id FROM schedules WHERE schedule_id = $1", 
            [schedule_id]
        );

        if (checkOwnership.rows.length === 0) {
            return res.status(404).json({ error: "Schedule not found" });
        }

        if (checkOwnership.rows[0].doctor_id !== req.userId) {
            return res.status(403).json({ error: "Unauthorized! You can only update your own schedule." });
        }

        // সব ঠিক থাকলে আপডেট করা
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
app.delete('/api/delete-user/:id', verifyToken, async (req, res) => {
    // ২. শুধুমাত্র অ্যাডমিনকে অনুমতি দেওয়া
    if (req.userRole !== 'Admin') {
        return res.status(403).json({ success: false, message: "Access denied. Only Admins can delete users." });
    }

    const { id } = req.params;
    const client = await pool.connect(); 

    try {
        await client.query('BEGIN'); // ৩. ট্রানজ্যাকশন শুরু

        const result = await client.query("DELETE FROM users WHERE user_id = $1", [id]);
        
        if (result.rowCount > 0) {
            await client.query('COMMIT'); 
            res.json({ success: true, message: "User and all related profiles deleted successfully!" });
        } else {
            await client.query('ROLLBACK');
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        await client.query('ROLLBACK'); 
        console.error("Delete Error:", err.message);
        res.status(500).json({ error: "Failed to delete user: " + err.message });
    } finally {
        client.release(); 
    }
});


// ১. ক্যানসেল এপিআই

app.delete('/api/cancel-appointment/:id', verifyToken, async (req, res) => {
    // ১. সুনির্দিষ্ট রোল চেক (শুধুমাত্র Receptionist)
    if (req.userRole !== 'Receptionist') {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Only Receptionists can cancel appointments." 
        });
    }

    const client = await pool.connect(); 

    try {
        await client.query('BEGIN'); 

        // ২. ক্যানসেল প্রোসিডিউর কল করা
        await client.query('CALL cancel_appointment_v3($1)', [req.params.id]);

        await client.query('COMMIT'); 
        res.json({ success: true, message: "Appointment Cancelled and Archived!" });

    } catch (err) {
        await client.query('ROLLBACK'); 
        console.error("Cancel Error:", err.message);
        res.status(500).json({ success: false, error: err.message });

    } finally {
        client.release(); 
    }
});

app.put('/api/confirm-appointment/:id', verifyToken, async (req, res) => {
    // ১. সুনির্দিষ্ট রোল চেক (শুধুমাত্র Receptionist)
    if (req.userRole !== 'Receptionist') {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Only Receptionists can confirm appointments." 
        });
    }

    const client = await pool.connect();
    const { receptionist_id } = req.body;
    
    try {
        await client.query('BEGIN');

        // প্রসিডিউর কল করা
        await client.query('CALL confirm_appointment_v3($1, $2)', [req.params.id, receptionist_id]);

        await client.query('COMMIT');
        res.json({ success: true, message: "Appointment Confirmed!" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Confirmation Error:", err.message);
        // ডাটাবেসের RAISE EXCEPTION এখানে ক্যাচ হয়ে ৪00 এরর দিবে
        res.status(400).json({ error: err.message }); 
    } finally {
        client.release();
    }
});


// ১. পেন্ডিং ডাক্তারদের লিস্ট পাওয়ার এপিআই
app.get('/api/admin/pending-doctors',verifyToken, async (req, res) => {
    // ১. সুনির্দিষ্ট রোল চেক (শুধুমাত্র Admin)
    if (req.userRole !== 'Admin') {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Only Admins can view pending doctors." 
        });
    }

    try {
        const result = await pool.query("SELECT * FROM pending_doctors ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Pending Error:", err.message);
        res.status(500).json({ error: "পেন্ডিং লিস্ট লোড করতে সমস্যা হয়েছে" });
    }
});
app.post('/api/admin/approve-doctor/:id', verifyToken, async (req, res) => {
    // ১. সুনির্দিষ্ট রোল চেক (শুধুমাত্র Admin)
    if (req.userRole !== 'Admin') {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Only Admins can approve doctors." 
        });
    }

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
/*
app.delete('/api/delete-user/:id', verifyToken, async (req, res) => {
    // ১. রোল চেক: শুধুমাত্র অ্যাডমিনকে ডিলিট করার অনুমতি দেওয়া
    if (req.userRole !== 'Admin') {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Only Admins can delete users." 
        });
    }

    const client = await pool.connect(); 

    try {
        const { id } = req.params;

        // ২. ট্রানজ্যাকশন শুরু
        await client.query('BEGIN'); 

        // ৩. ডিলিট কমান্ড চালানো
        const result = await client.query("DELETE FROM users WHERE user_id = $1", [id]);
        
        if (result.rowCount > 0) {
            // ৪. ডিলিট সফল হলে কমিট
            await client.query('COMMIT'); 
            res.json({ success: true, message: "User deleted and archived successfully!" });
        } else {
            // ৫. ইউজার পাওয়া না গেলে রোলব্যাক
            await client.query('ROLLBACK');
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        // ৬. এরর হলে রোলব্যাক
        await client.query('ROLLBACK'); 
        console.error("Delete Error:", err.message);
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    } finally {
        // ৭. ক্লায়েন্ট রিলিজ
        client.release(); 
    }
});*/
// ১. পেন্ডিং ডাক্তারকে সরাসরি ডিলিট/রিজেক্ট করার এপিআই
// Pending doctor reject/delete korar jonno (Kono archive hobe na)
app.delete('/api/admin/reject-doctor/:id', verifyToken, async (req, res) => {
    // ১. সুনির্দিষ্ট রোল চেক (শুধুমাত্র Admin)
    if (req.userRole !== 'Admin') {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Only Admins can reject doctors." 
        });
    }

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

app.get('/api/admin/pending-details/:id', verifyToken, async (req, res) => {
    // ১. শুধুমাত্র অ্যাডমিন কি না চেক করা
    if (req.userRole !== 'Admin') {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Only Admins can view pending doctor details." 
        });
    }

    try {
        const { id } = req.params;
        const doctorId = parseInt(id);

        if (isNaN(doctorId)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        // ২. পেন্ডিং টেবিল থেকে ডাটা রিট্রিভ
        const result = await pool.query("SELECT * FROM pending_doctors WHERE pending_id = $1", [doctorId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        const doc = result.rows[0];

        // ৩. JSONB আইডি থেকে নাম রিট্রিভ করা (Specializations & Qualifications)
        const specIds = Array.isArray(doc.specialization) ? doc.specialization : [];
        const qualIds = Array.isArray(doc.qualification) ? doc.qualification : [];

        const specs = await pool.query("SELECT specialization_name FROM specializations WHERE specialization_id = ANY($1::int[])", [specIds]);
        const quals = await pool.query("SELECT qualification_name FROM qualification WHERE qualification_id = ANY($1::int[])", [qualIds]);

        // ৪. ডিটেইলস ডাটা পাঠানো
        res.json({
            ...doc,
            specialization_names: specs.rows.map(r => r.specialization_name),
            qualification_names: quals.rows.map(r => r.qualification_name)
        });
        
    } catch (err) {
        console.error("Fetch Pending Details Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});
// এই একটি API দিয়েই এখন আপনার কাজ হয়ে যাবে
app.post('/api/patients/start-service', verifyToken, async (req, res) => {
    // ১. শুধুমাত্র ডক্টর কি না তা চেক করা (verifyToken থেকে প্রাপ্ত Role)
    if (req.userRole !== 'Doctor') {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Only doctors can start a service." 
        });
    }

    const { patient_id, doctor_id } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ২. পেশেন্টের তথ্য চেক (পেশেন্ট বিদ্যমান কি না নিশ্চিত করা)
        const patientRes = await client.query("SELECT * FROM patients WHERE patient_id = $1", [patient_id]);
        if (patientRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Patient not found" });
        }

        // ৩. ডেটাবেস ফাংশন কল করা (SELECT function_name)
        const funcRes = await client.query(
            "SELECT start_patient_service_fn($1, $2) as service_id",
            [patient_id, doctor_id]
        );
        
        const newServiceId = funcRes.rows[0].service_id;

        await client.query('COMMIT');

        // ৪. ফ্রন্টএন্ডে রেসপন্স পাঠানো
        res.json({
            success: true,
            patient: patientRes.rows[0], // পেশেন্টের ডিটেইলস (নাম, বয়স ইত্যাদি)
            service_id: newServiceId     // নতুন তৈরি হওয়া সার্ভিস আইডি
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Start Service Function Error:", err.message);
        res.status(500).json({ error: "Server error occurred while executing service function" });
    } finally {
        client.release();
    }
});

app.get('/api/admin/doctor-stats', async (req, res) => {
    const { month, year } = req.query;
    try {
        const result = await pool.query(
            "SELECT * FROM get_monthly_doctor_stats($1, $2)",
            [parseInt(month), parseInt(year)]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/admit-patient', async (req, res) => {
    const { 
        name, phone, email, age, gender, blood_group, 
        admission_date, disease_id, doctor_id, bed_no 
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ফাংশন কল করা হচ্ছে (১০টি প্যারামিটারসহ)
        const result = await client.query(
            `SELECT admit_patient_fn($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) as success`,
            [name, phone, email, age, gender, blood_group, admission_date, disease_id, doctor_id, bed_no]
        );

        if (result.rows[0].success) {
            await client.query('COMMIT');
            res.json({ success: true, message: "Patient admitted and bed booked successfully!" });
        } else {
            throw new Error("Admission function returned false");
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Admission Error:", err.message);
        res.status(500).json({ success: false, message: "Admission failed: " + err.message });
    } finally {
        client.release();
    }
});

// ডাক্তার, রোগ এবং বেড ডাটা আনার জন্য প্রয়োজনীয় রুটগুলো:
// ১. ডাক্তার এবং রোগের লিস্ট ড্যাশবোর্ডের জন্য পাঠানো
app.get('/api/get-admission-data', async (req, res) => {
    try {
        // শুধুমাত্র সেই ইউজারদের নাম আনবে যারা 'doctors' টেবিলে আছে
        const doctorsResult = await pool.query(`
            SELECT u.user_id, u.name 
            FROM users u 
            JOIN doctors d ON u.user_id = d.user_id
            ORDER BY u.name ASC
        `);

        // admit_disease টেবিল থেকে সব রোগের নাম আনবে
        const diseasesResult = await pool.query(`
            SELECT disease_id, name 
            FROM admit_disease 
            ORDER BY name ASC
        `);

        res.json({
            doctors: doctorsResult.rows,
            diseases: diseasesResult.rows
        });
    } catch (err) {
        console.error("Error fetching admission data:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// ২. ক্যাটাগরি অনুযায়ী 'Available' বেড খুঁজে বের করা
app.get('/api/available-beds/:category', async (req, res) => {
    const { category } = req.params;
    try {
        const bedsResult = await pool.query(`
            SELECT bed_no 
            FROM beds 
            WHERE category = $1 AND status = 'Available'
            ORDER BY bed_no ASC
        `, [category]);

        res.json(bedsResult.rows);
    } catch (err) {
        console.error("Error fetching beds:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/api/release-patient', async (req, res) => {
    const client = await pool.connect();
    try {
        const { admission_id, release_date } = req.body;
        await client.query('BEGIN');

        // ১. admission টেবিলে রিলিজ ডেট আপডেট
        await client.query(
            `UPDATE admission SET release_date = $1 WHERE admission_id = $2`,
            [release_date, admission_id]
        );

        // ২. ALLOCATION টেবিল আপডেট এবং প্রয়োজনীয় ডাটা সংগ্রহ
        const allocRes = await client.query(
            `UPDATE ALLOCATION 
             SET TO_DATE = $1 
             WHERE admission_id = $2 
             RETURNING bed_no, FROM_DATE`,
            [release_date, admission_id]
        );

        if (allocRes.rows.length > 0) {
            const { bed_no, from_date } = allocRes.rows[0];

            // ৩. bedsallocated টেবিলে ডিলিট না করে end_date আপডেট (আপনার রিকোয়েস্ট অনুযায়ী)
            // এখানে bed_no এবং start_date (from_date) ব্যবহার করে সঠিক রো টি খুঁজে বের করা হচ্ছে
            await client.query(
                `UPDATE bedsallocated 
                 SET end_date = $1 
                 WHERE bed_no = $2 AND start_date = $3`,
                [release_date, bed_no, from_date]
            );

            // ৪. beds টেবিলের স্ট্যাটাস 'Available' করা
            await client.query(
                `UPDATE beds SET status = 'Available' WHERE bed_no = $1`,
                [bed_no]
            );
        } else {
            throw new Error("Admission ID-র বিপরীতে কোনো সচল বেড পাওয়া যায়নি।");
        }

        await client.query('COMMIT');
        res.json({ success: true, message: "পেশেন্ট সফলভাবে রিলিজ হয়েছে এবং বেড এখন ফাঁকা।" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ success: false, message: "ব্যর্থ হয়েছে: " + err.message });
    } finally {
        client.release();
    }
});

// ১. রোগ অনুযায়ী স্ট্যাটাস এন্ডপয়েন্ট
app.get('/api/admin/disease-stats', async (req, res) => {
    const { fromDate, toDate } = req.query;
    try {
        // ফাংশন কল করা হচ্ছে
        const result = await pool.query(
            `SELECT * FROM get_disease_stats($1, $2)`,
            [fromDate, toDate]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Database error while fetching disease stats" });
    }
});

// ২. স্টে ডিউরেশন স্ট্যাটাস এন্ডপয়েন্ট
app.get('/api/admin/stay-duration-stats', async (req, res) => {
    const { fromDate, toDate } = req.query;
    try {
        // ফাংশন কল করা হচ্ছে
        const result = await pool.query(
            `SELECT * FROM get_stay_duration_stats($1, $2)`,
            [fromDate, toDate]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Database error while fetching duration stats" });
    }
});

app.post('/api/patients/save-prescription', verifyToken, async (req, res) => {
    // ডক্টর রোল চেক
    if (req.userRole !== 'Doctor') {
        return res.status(403).json({ success: false, message: "Access denied." });
    }

    const { service_id, patient_id, description, advice, history, diagnoses, medicines, tests } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ১. Medical Histories এ ডাটা ইনসার্ট (Multiple Rows)
        if (history && history.length > 0) {
            for (let h of history) {
                if (h.condition) {
                    await client.query(
                        `INSERT INTO medical_histories (patient_id, disease_name, medication) 
                         VALUES ($1, $2, $3)`,
                        [patient_id, h.condition, h.current_meds]
                    );
                }
            }
        }

        // ২. Diagnosis এ ডাটা ইনসার্ট (Multiple Rows)
        if (diagnoses && diagnoses.length > 0) {
            for (let d of diagnoses) {
                if (d.disease) {
                    await client.query(
                        `INSERT INTO diagnosis (service_id, diagnosis_name, severity) 
                         VALUES ($1, $2, $3)`,
                        [service_id, d.disease, d.severity]
                    );
                }
            }
        }

        // ৩. পূর্ণাঙ্গ প্রিসক্রিপশন টেক্সট তৈরি করা (PDF Link Column এর জন্য)
        const fullPrescriptionText = `
            CHIEF COMPLAINTS: ${description}
            DIAGNOSIS: ${diagnoses.map(d => `${d.disease} (${d.severity})`).join(', ')}
            PAST HISTORY: ${history.map(h => `${h.condition}: ${h.current_meds}`).join(' | ')}
            MEDICINES (Rx): ${medicines.map(m => `${m.name} - ${m.schedule} - ${m.duration} days (${m.timing})`).join(' | ')}
            TESTS: ${tests.map(t => t.test_name).join(', ')}
            ADVICE: ${advice}
        `.trim();

        // ৪. Prescription টেবিলে ইনসার্ট
        await client.query(
            `INSERT INTO prescription (service_id, pdf_link) VALUES ($1, $2)`,
            [service_id, fullPrescriptionText]
        );

        await client.query('COMMIT');
        res.json({ success: true, message: "Prescription and Histories saved successfully!" });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Save Prescription Error:", err.message);
        res.status(500).json({ error: "Failed to save prescription data." });
    } finally {
        client.release();
    }
});

app.listen(5000, () => { console.log("Server running on port 5000"); });
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
const JWT_SECRET = "HMS2305";

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
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



app.get('/api/receptionist-users', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'Admin') {
            return res.status(403).json({ message: "Access denied।" });
        }

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
        res.status(500).json({ error: "Data could not be loaded" });
    }
});


// app.get('/users', async (req, res) => {
//   try {
//     const allUsers = await pool.query("SELECT * FROM users");
//     return res.json(allUsers.rows);
//   } catch (err) {
//     console.error(err.message);
//     return res.status(500).send("Server Error");
//   }
// });

app.post('/api/book-appointment', async (req, res) => {
    const client = await pool.connect(); 
    const { 
        name, phone_number, email, age, gender, 
        blood_group, date, appointment_time, doctor_id 
    } = req.body;

    try {
        await client.query('BEGIN'); 

        await client.query(
            'CALL book_appointment_v3($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [name, phone_number, email, age, gender, blood_group, date, appointment_time, doctor_id]
        );

        await client.query('COMMIT'); 
        res.status(200).json({ success: true, message: "Success!" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Booking Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release(); 
    }
});


app.get('/api/pending-appointments', verifyToken, async (req, res) => {
    
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
        
        return res.json(result.rows);
    } catch (err) {
        console.error("Fetch Pending Error:", err.message);
        return res.status(500).json({ 
            success: false, 
            error: "Database error while fetching pending appointments" 
        });
    }
});

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
    const client = await pool.connect(); 

    try {
        const { name, email, phone_number, password, role, consultation_fee, qualification, specialization } = req.body;
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const image_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

        const specArr = specialization ? JSON.parse(specialization) : [];
        const qualArr = qualification ? JSON.parse(qualification) : [];

        await client.query('BEGIN'); 

        if (role === 'Doctor') {
            await client.query(
                "INSERT INTO pending_doctors (name, email, phone_number, password, consultation_fee, image_url, specialization, qualification) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                [name, email, phone_number, hashedPassword, consultation_fee, image_url, JSON.stringify(specArr), JSON.stringify(qualArr)]
            );
            
            await client.query('COMMIT'); 
            return res.status(201).json({ success: true, message: "Pending for Admin Approval" });
        }

        await client.query("CALL create_account($1, $2, $3, $4, $5, $6, $7, $8, $9)", [
            name, email, phone_number, hashedPassword, role, consultation_fee || 0, image_url, specArr, qualArr
        ]);

        await client.query('COMMIT'); 
        res.status(201).json({ success: true, message: "Account created" });

    } catch (err) {
        await client.query('ROLLBACK'); 
        console.error("Transaction Error:", err.message);
        res.status(500).json({ error: "Account creation failed", details: err.message });

    } finally {
        client.release(); 
    }
});
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            `SELECT u.user_id, u.name, u.password, r.role_name as role 
             FROM users u 
             JOIN roles r ON u.role_id = r.role_id 
             WHERE u.email = $1`, 
            [email]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];

            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                const token = jwt.sign(
                    { id: user.user_id, role: user.role }, 
                    JWT_SECRET, 
                    { expiresIn: '30m' }
                );

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
                return res.status(401).json({ 
                    success: false, 
                    message: "Invalid email or password" 
                });
            }
        } else {
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
app.post('/api/add-bulk-schedule', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'Doctor') {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied. Data only for doctors" 
            });
        }

        const { doctor_id, startDate, endDate, selectedDays, hours_start, hours_end } = req.body;
        if (req.userId !== parseInt(doctor_id)) {
        }

        console.log("--- DEBUG START ---");
        console.log("Authorized Doctor ID:", req.userId);

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
                    matchFound++; 
                    
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
                message: insertCount > 0 ? `${insertCount} day-schedule successfully saved for` : `০ days saved. match found ${matchFound})` 
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err; 
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("DB ERROR:", err.message);
        res.status(500).json({ success: false, error: "server error: schedule could not be changed" });
    }
});


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


app.get('/api/test_details', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM test_details ORDER BY test_id ASC");
        res.json(result.rows); 
    } catch (err) {
        res.status(500).json([]);
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
    if (req.userRole !== 'Doctor') {
        return res.status(403).json({ error: "Access denied. Only doctors can view their schedules." });
    }

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
    if (req.userRole !== 'Doctor') {
        return res.status(403).json({ error: "Access denied. Only doctors can update status." });
    }

    const { schedule_id, is_active } = req.body;

    try {
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

        await pool.query(
            "UPDATE schedules SET is_active = $1 WHERE schedule_id = $2",
            [is_active, schedule_id]
        );
        res.json({ success: true, message: "Status updated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/delete-user/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'Admin') {
        return res.status(403).json({ success: false, message: "Access denied. Only Admins can delete users." });
    }

    const { id } = req.params;
    const client = await pool.connect(); 

    try {
        await client.query('BEGIN'); 

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


app.delete('/api/cancel-appointment/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'Receptionist') {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Only Receptionists can cancel appointments." 
        });
    }

    const client = await pool.connect(); 

    try {
        await client.query('BEGIN'); 
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

        await client.query('CALL confirm_appointment_v3($1, $2)', [req.params.id, receptionist_id]);

        await client.query('COMMIT');
        res.json({ success: true, message: "Appointment Confirmed!" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Confirmation Error:", err.message);
        res.status(400).json({ error: err.message }); 
    } finally {
        client.release();
    }
});


app.get('/api/admin/pending-doctors',verifyToken, async (req, res) => {
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
        res.status(500).json({ error: "problem loeading pending list" });
    }
});
app.post('/api/admin/approve-doctor/:id', verifyToken, async (req, res) => {
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
            return res.status(404).json({ error: "doctors info could not be fetched" });
        }

        const d = pendingResult.rows[0];

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


app.delete('/api/admin/reject-doctor/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'Admin') {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Only Admins can reject doctors." 
        });
    }

    try {
        const { id } = req.params;

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
        const result = await pool.query("SELECT * FROM pending_doctors WHERE pending_id = $1", [doctorId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        const doc = result.rows[0];

        const specIds = Array.isArray(doc.specialization) ? doc.specialization : [];
        const qualIds = Array.isArray(doc.qualification) ? doc.qualification : [];

        const specs = await pool.query("SELECT specialization_name FROM specializations WHERE specialization_id = ANY($1::int[])", [specIds]);
        const quals = await pool.query("SELECT qualification_name FROM qualification WHERE qualification_id = ANY($1::int[])", [qualIds]);

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

app.post('/api/patients/start-service', verifyToken, async (req, res) => {

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

        const patientRes = await client.query("SELECT * FROM patients WHERE patient_id = $1", [patient_id]);
        if (patientRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Patient not found" });
        }

        const funcRes = await client.query(
            "SELECT start_patient_service_fn($1, $2) as service_id",
            [patient_id, doctor_id]
        );
        
        const newServiceId = funcRes.rows[0].service_id;

        await client.query('COMMIT');
        res.json({
            success: true,
            patient: patientRes.rows[0],
            service_id: newServiceId    
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Start Service Function Error:", err.message);
        res.status(500).json({ error: "Server error occurred while executing service function" });
    } finally {
        client.release();
    }
});

app.get('/api/admin/doctor-stats', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied. Data only for admins." 
            });
        }

        const { month, year, limit } = req.query;
        if (!month || !year) {
            return res.status(400).json({ error: "Month and Year are required" });
        }

        const finalLimit = limit ? parseInt(limit) : 1000; 

        const result = await pool.query(
            "SELECT * FROM get_monthly_doctor_stats($1, $2, $3)",
            [parseInt(month), parseInt(year), finalLimit]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Doctor Stats API Error:", err.message);
        res.status(500).json({ error: "server error: Doctor_stats could not be loaded" });
    }
});


app.get('/api/admin/disease-stats', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied. Data only for admins." 
            });
        }

        const { fromDate, toDate, limit } = req.query;

        if (!fromDate || !toDate) {
            return res.status(400).json({ error: "Date range is required" });
        }

        const finalLimit = limit ? parseInt(limit) : 1000;

        const result = await pool.query(
            "SELECT * FROM get_disease_stats($1, $2, $3)",
            [fromDate, toDate, finalLimit]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Disease Stats API Error:", err.message);
        res.status(500).json({ error: "server error: Doctor_stats could not be loaded" });
    }
});

app.post('/api/admit-patient', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'Receptionist') {
            return res.status(403).json({ success: false, message: "Access Denied" });
        }

        const { 
            name, phone, email, age, gender, blood_group, 
            admission_date, disease_id, doctor_id, bed_no 
        } = req.body;

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

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
            throw err; 
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Admission Error:", err.message);
        res.status(500).json({ success: false, message: "Admission failed: " + err.message });
    }
});

app.get('/api/get-admission-data', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'Receptionist') {
            return res.status(403).json({ message: "access denied।" });
        }

        const doctorsResult = await pool.query(`
            SELECT u.user_id, u.name 
            FROM users u 
            JOIN doctors d ON u.user_id = d.user_id
            ORDER BY u.name ASC
        `);

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
        res.status(500).json({ error: "server error" });
    }
});

app.get('/api/available-beds/:category', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'Receptionist') {
            return res.status(403).json({ message: "access denied" });
        }

        const { category } = req.params;
        const bedsResult = await pool.query(`
            SELECT bed_no 
            FROM beds 
            WHERE category = $1 AND status = 'Available'
            ORDER BY bed_no ASC
        `, [category]);

        res.json(bedsResult.rows);
    } catch (err) {
        console.error("Error fetching beds:", err.message);
        res.status(500).json({ error: "server error" });
    }
});

app.post('/api/release-patient', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'Receptionist') {
            return res.status(403).json({ success: false, message: "Access Denied." });
        }

        const { admission_id, release_date } = req.body;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            await client.query(
                `UPDATE admission SET release_date = $1 WHERE admission_id = $2`,
                [release_date, admission_id]
            );

            const allocRes = await client.query(
                `UPDATE ALLOCATION 
                 SET TO_DATE = $1 
                 WHERE admission_id = $2 
                 RETURNING bed_no, FROM_DATE`,
                [release_date, admission_id]
            );

            if (allocRes.rows.length > 0) {
                const { bed_no, from_date } = allocRes.rows[0];

                await client.query(
                    `UPDATE bedsallocated 
                     SET end_date = $1 
                     WHERE bed_no = $2 AND start_date = $3`,
                    [release_date, bed_no, from_date]
                );

                await client.query(
                    `UPDATE beds SET status = 'Available' WHERE bed_no = $1`,
                    [bed_no]
                );
            } else {
                throw new Error("No available beds against the Admission ID");
            }

            await client.query('COMMIT');
            res.json({ success: true, message: "Patient released and bed is available" });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Release Error:", err.message);
        res.status(500).json({ success: false, message: "failed: " + err.message });
    }
});

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


app.get('/api/admin/stay-duration-stats', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Access Denied. Data only for admins!" 
            });
        }

        const { fromDate, toDate } = req.query;

        if (!fromDate || !toDate) {
            return res.status(400).json({ error: "Date range (fromDate, toDate) is required" });
        }

        const result = await pool.query(
            `SELECT * FROM get_stay_duration_stats($1, $2)`,
            [fromDate, toDate]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Stay Duration Stats Error:", err.message);
        res.status(500).json({ error: "server error: Doctor_stats could not be loaded" });
    }
});

app.post('/api/patients/save-prescription', verifyToken, async (req, res) => {
    if (req.userRole !== 'Doctor') {
        return res.status(403).json({ success: false, message: "Access denied." });
    }

    const { service_id, patient_id, description, advice, history, diagnoses, medicines, tests } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

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

        const fullPrescriptionText = `
            CHIEF COMPLAINTS: ${description}
            DIAGNOSIS: ${diagnoses.map(d => `${d.disease} (${d.severity})`).join(', ')}
            PAST HISTORY: ${history.map(h => `${h.condition}: ${h.current_meds}`).join(' | ')}
            MEDICINES (Rx): ${medicines.map(m => `${m.name} - ${m.schedule} - ${m.duration} days (${m.timing})`).join(' | ')}
            TESTS: ${tests.map(t => t.test_name).join(', ')}
            ADVICE: ${advice}
        `.trim();

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
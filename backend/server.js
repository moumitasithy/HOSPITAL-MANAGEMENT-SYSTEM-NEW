
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const app = express();

app.use(cors());
app.use(express.json());


app.get('/users', async (req, res) => {
  try {
    const allUsers = await pool.query("SELECT * FROM users");
    res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


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
});

app.post('/api/createaccount', async (req, res) => {
    try {
        const { name, email, phone_number, password, role } = req.body;

        // ১. ROLE table theke ROLE_ID khuje ber kora
        const roleData = await pool.query(
            "SELECT ROLE_ID FROM roles WHERE ROLE_NAME = $1", 
            [role]
        );

        if (roleData.rows.length === 0) {
            return res.status(400).json({ error: "Invalid Role Selected!" });
        }

        const roleId = roleData.rows[0].role_id;

        // ২. users table-e data insert kora (ROLE_ID foreign key shoho)
        const newUser = await pool.query(
            "INSERT INTO users (name, email, phone_number, password, ROLE_ID) VALUES($1, $2, $3, $4, $5) RETURNING *",
            [name, email, phone_number, password, roleId]
        );

        res.status(201).json({ message: "Success", user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error: " + err.message });
    }
});
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login request for:", email);

        // ১. SQL Query-তে কলামের নামগুলো ছোট হাতের ব্যবহার করা নিরাপদ
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

        const user = userQuery.rows[0]; // এখানে 'user' সিঙ্গুলার

        // ২. পাসওয়ার্ড চেক
        if (user.password !== password) {
            return res.status(401).json({ error: "ভুল পাসওয়ার্ড!" });
        }

        // ৩. রেসপন্স পাঠানোর সময় ভেরিয়েবল নাম 'user' রাখুন
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.user_id,
                name: user.name,
                role: user.role_name, // নিশ্চিত হোন roles টেবিলে এই কলামটি আছে
                email: user.email
            }
        });

    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ error: "Server error: " + err.message });
    }
});
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
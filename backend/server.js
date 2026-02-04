
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
        console.log("Data Received from Frontend:", req.body); 
        const { name, email, phone_number, password, role } = req.body;
        
        const newUser = await pool.query(
            "INSERT INTO users (name, email, phone_number, password, role) VALUES($1, $2, $3, $4, $5) RETURNING *",
            [name, email, phone_number, password, role]
        );

        res.status(201).json({ message: "Success", user: newUser.rows[0] });
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
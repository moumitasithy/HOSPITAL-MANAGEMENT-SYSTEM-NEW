
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'Hospital_Management_System', 
  password: '123111232', 
  port: 5432,
});

module.exports = pool;
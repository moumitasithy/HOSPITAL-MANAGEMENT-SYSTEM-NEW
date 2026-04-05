const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'Hospital_Management_System', 
  password: 'sjt05lara!',  
  port: 5432,
  max: 50, 
  idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
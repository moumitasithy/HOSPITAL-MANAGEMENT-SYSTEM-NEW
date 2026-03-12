/*
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'Hospital_Management_System', 
  password: '123111232', 
  port: 5432,
});

module.exports = pool;*/
/*
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'Hospital_Management_System', 
  password: '123111232', 
  port: 5432,
  // নিচে এই দুটি লাইন যোগ করুন
  max: 100, // একসাথে সর্বোচ্চ ১০টি কানেকশন খোলা থাকবে
  idleTimeoutMillis: 30000 // ৩০ সেকেন্ড কোনো কাজ না থাকলে কানেকশন কেটে যাবে
});

module.exports = pool;*/
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'Hospital_Management_System', 
  password: '123111232', 
  port: 5432,
  max: 50, // আপনি এটি চাচ্ছেন
  idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
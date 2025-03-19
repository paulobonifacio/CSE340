const pool = require("./database");

async function testDB() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database connected at:", res.rows[0].now);
  } catch (err) {
    console.error("Database connection error:", err);
  }
}

testDB();

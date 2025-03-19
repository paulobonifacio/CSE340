const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables

// Conexão sempre com o banco do Render
const pool = new Pool({
  user: "cse340w02pb",
  host: "dpg-cvbfhulsvqrc73c6qv30-a.frankfurt-postgres.render.com",
  database: "cse340w02pb_gqrz",
  password: "ocsSc33yMu7hjbJAySWDlWZ8yBO6gfHJ",
  port: 5432,
  ssl: { rejectUnauthorized: false } // Importante para evitar problemas de SSL no Render
});

// Teste a conexão ao iniciar
pool.connect()
  .then(client => {
    console.log("✅ Conectado ao PostgreSQL no Render!");
    client.release();
  })
  .catch(err => console.error("❌ Erro ao conectar ao banco:", err.stack));

module.exports = pool;

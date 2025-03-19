const { Pool } = require("pg");
require("dotenv").config(); // Carregar variáveis do .env

// Criar a conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Evita erros de SSL no Render
  },
});

// Testar conexão ao iniciar
pool.connect()
  .then(() => console.log("✅ Conectado ao banco de dados!"))
  .catch(err => console.error("❌ Erro ao conectar ao banco de dados:", err));

// Exportar pool para ser usado no projeto
module.exports = pool;

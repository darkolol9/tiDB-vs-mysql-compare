const express = require('express');
const todoRoutes = require('./routes/todo');
const tidbPool = require('./db');
const mysqlPool = require('./db-mysql');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/todos', todoRoutes);

// Initialize database tables
async function initializeDatabase(pool, dbName) {
  try {
    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create todos table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS todos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log(`${dbName} database initialized successfully`);
  } catch (error) {
    console.error(`Error initializing ${dbName} database:`, error);
  }
}

// Start server
app.listen(PORT, async () => {
  await initializeDatabase(tidbPool, 'TiDB');
  await initializeDatabase(mysqlPool, 'MySQL');
  console.log(`Server is running on port ${PORT}`);
}); 
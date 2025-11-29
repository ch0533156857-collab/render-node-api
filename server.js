const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 CORS - מאפשר לפרונטאנד לדבר עם הבקאנד
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

app.use(express.json());

// 🔌 חיבור למסד הנתונים MySQL
const pool = mysql.createPool({
  host: 'b4fuox3wd8ik7tvsur9p-mysql.services.clever-cloud.com',
  port: 3306,
  user: 'uqpjjszrqvbsl0a2',
  password: process.env.DB_PASSWORD, // תוסיפי את הסיסמה ב-Render
  database: 'b4fuox3wd8ik7tvsur9p',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 🏗️ יצירת טבלה אם היא לא קיימת
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    connection.release();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// הרצת אתחול המסד
initDatabase();

// ✅ Route: GET /tasks - מחזיר את כל המשימות
app.get('/tasks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ✅ Route: POST /tasks - יוצר משימה חדשה
app.post('/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, completed) VALUES (?, ?, ?)',
      [title, description || '', false]
    );
    
    const [newTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    
    res.status(201).json(newTask[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// ✅ Route: PUT /tasks/:id - מעדכן משימה
app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;
    
    const [result] = await pool.query(
      'UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?',
      [title, description, completed, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const [updatedTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ✅ Route: DELETE /tasks/:id - מחיקת משימה
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// 🏠 Route: בדיקה שהשרת עובד
app.get('/', (req, res) => {
  res.json({ 
    message: 'Todo API is running!',
    endpoints: {
      tasks: '/tasks',
      create: 'POST /tasks',
      update: 'PUT /tasks/:id',
      delete: 'DELETE /tasks/:id'
    }
  });
});

// 🚀 הפעלת השרת
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// טיפול בסגירה נקייה
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Route: GET /services - מחזיר רשימת שירותים מ-Render
app.get('/services', async (req, res) => {
  try {
    const RENDER_API_KEY = process.env.RENDER_API_KEY;

    if (!RENDER_API_KEY) {
      return res.status(500).json({ error: 'RENDER_API_KEY not configured' });
    }

    // קריאה ל-Render API
    const response = await fetch('https://api.render.com/v1/services?limit=20', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${RENDER_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Render API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route: בדיקה שהשרבר עובד
app.get('/', (req, res) => {
  res.json({ message: 'Render API is running!' });
});

// הפעלת השרבר
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
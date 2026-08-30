const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/homework', require('./routes/homework'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/corkboard', require('./routes/corkboard'));
app.use('/api/family', require('./routes/family'));

// Fallback route for Single Page Application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Family Connect Hub running on http://localhost:${PORT}`);
});

const express = require('express');
const router = express.Router();
const db = require('../config/firebase');

// GET /api/trips
router.get('/', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected." });
  try {
    const snapshot = await db.collection('trips').get();
    const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trips", details: err.message });
  }
});

// POST /api/trips
router.post('/', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected." });
  try {
    const { title, start, end, lodging, items } = req.body;
    const newDoc = await db.collection('trips').add({
      title,
      start,
      end,
      lodging: lodging || '',
      items: items || [],
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: newDoc.id, success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to create trip", details: err.message });
  }
});

// PATCH /api/trips/:id/checklist
router.patch('/:id/checklist', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected." });
  try {
    const { items } = req.body;
    await db.collection('trips').doc(req.params.id).update({ items });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update checklist", details: err.message });
  }
});

// DELETE /api/trips/:id
router.delete('/:id', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected." });
  try {
    await db.collection('trips').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete trip", details: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/firebase');

// GET /api/homework
router.get('/', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected." });
  try {
    const snapshot = await db.collection('homework').get();
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch homework", details: err.message });
  }
});

// POST /api/homework
router.post('/', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected." });
  try {
    const { title, member, subject, due, status, notes } = req.body;
    const newDoc = await db.collection('homework').add({
      title,
      member: member || "Kids",
      subject: subject || "General",
      due: due || "",
      status: status || 'todo',
      notes: notes || '',
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: newDoc.id, success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to add homework", details: err.message });
  }
});

// PATCH /api/homework/:id
router.patch('/:id', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected." });
  try {
    const { status } = req.body;
    await db.collection('homework').doc(req.params.id).update({ status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update homework status", details: err.message });
  }
});

// DELETE /api/homework/:id
router.delete('/:id', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected." });
  try {
    await db.collection('homework').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete homework", details: err.message });
  }
});

module.exports = router;

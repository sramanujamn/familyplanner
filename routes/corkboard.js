const express = require('express');
const router = express.Router();
const db = require('../config/firebase');

// GET /api/corkboard
router.get('/', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected." });
  try {
    const snapshot = await db.collection('corkboard').orderBy('createdAt', 'desc').get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch corkboard items", details: err.message });
  }
});

// POST /api/corkboard
router.post('/', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected." });
  try {
    const { type, title, content, author, color, items, url } = req.body;
    const newDoc = await db.collection('corkboard').add({
      type: type || 'note',
      title: title || '',
      content: content || '',
      author: author || 'Family',
      color: color || 'yellow',
      items: items || [],
      url: url || '',
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: newDoc.id, success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to pin item", details: err.message });
  }
});

// PATCH /api/corkboard/:id/list
router.patch('/:id/list', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected." });
  try {
    const { items } = req.body;
    await db.collection('corkboard').doc(req.params.id).update({ items });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update list", details: err.message });
  }
});

// DELETE /api/corkboard/:id
router.delete('/:id', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected." });
  try {
    await db.collection('corkboard').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to unpin item", details: err.message });
  }
});

module.exports = router;

// routes/events.js
const express = require('express');
const router = express.Router();
const db = require('../config/firebase');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// GET /api/events - Strictly fetch events for requesting user's family
router.get('/', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database connection unavailable." });
  if (!req.user.familyId) return res.status(400).json({ error: "User belongs to no family." });

  try {
    const snapshot = await db.collection('families')
      .doc(req.user.familyId)
      .collection('schedules')
      .orderBy('date', 'asc')
      .get();

    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events", details: err.message });
  }
});

// POST /api/events - Save event under current family's subcollection
router.post('/', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database connection unavailable." });
  if (!req.user.familyId) return res.status(400).json({ error: "User belongs to no family." });

  try {
    const { title, date, time, member, location, notes } = req.body;

    const newDoc = await db.collection('families')
      .doc(req.user.familyId)
      .collection('schedules')
      .add({
        title: title.trim(),
        date: date.trim(),
        time: time ? time.trim() : "",
        member: member ? member.trim() : "Everyone",
        location: location ? location.trim() : "",
        notes: notes ? notes.trim() : "",
        createdBy: req.user.uid,
        createdAt: new Date().toISOString()
      });

    res.status(201).json({ id: newDoc.id, success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to create event", details: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database connection unavailable." });

  try {
    await db.collection('families')
      .doc(req.user.familyId)
      .collection('schedules')
      .doc(req.params.id)
      .delete();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete event", details: err.message });
  }
});

module.exports = router;

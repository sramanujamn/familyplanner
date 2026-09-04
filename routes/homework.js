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

/**
 * PATCH /api/homework/:id
 * Updates homework fields including completed/verified flags, ratings, and status.
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completed, verified, rating, title, subject, due, member } = req.body;

    const updateData = {};

    // Map all potential update fields dynamically
    if (status !== undefined) updateData.status = status;
    if (completed !== undefined) updateData.completed = Boolean(completed);
    if (verified !== undefined) updateData.verified = Boolean(verified);
    if (rating !== undefined) updateData.rating = Number(rating);
    if (title !== undefined) updateData.title = title;
    if (subject !== undefined) updateData.subject = subject;
    if (due !== undefined) updateData.due = due;
    if (member !== undefined) updateData.member = member;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

    // Update Firestore document
    await db.collection('homework').doc(id).update(updateData);

    res.json({ id, ...updateData, success: true });
  } catch (err) {
    console.error(`Error updating homework document ${req.params.id}:`, err);
    res.status(500).json({ error: "Failed to update homework item" });
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

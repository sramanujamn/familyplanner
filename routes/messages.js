const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Initialize Firestore reference
const db = require('../config/firebase');

// GET /api/messages - Retrieve recent chat messages
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('messages')
      .orderBy('createdAt', 'asc')
      .limit(50)
      .get();

    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      let formattedTimestamp = 'Just now';

      if (data.createdAt) {
        const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        formattedTimestamp = dateObj.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }

      return {
        id: doc.id,
        ...data,
        timestamp: formattedTimestamp
      };
    });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/messages - Send a new message
router.post('/', async (req, res) => {
  try {
    const { text, sender } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const senderName = sender || req.user?.displayName || req.user?.name || 'Family Member';

    const newMessage = {
      text: text.trim(),
      sender: senderName,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('messages').add(newMessage);
    res.json({ id: docRef.id, ...newMessage });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;

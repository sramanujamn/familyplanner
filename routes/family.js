// routes/family.js
const express = require('express');
const router = express.Router();
const db = require('../config/firebase');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// GET /api/family - Fetch active workspace & custom member roster
router.get('/', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database unavailable." });
  
  try {
    if (!req.user.familyId) {
      return res.json({ hasFamily: false });
    }

    const familyDoc = await db.collection('families').doc(req.user.familyId).get();
    if (!familyDoc.exists) {
      return res.json({ hasFamily: false });
    }

    res.json({ hasFamily: true, id: familyDoc.id, ...familyDoc.data() });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch family profile", details: err.message });
  }
});

// POST /api/family/create - Create a brand new Family Workspace
router.post('/create', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database unavailable." });

  try {
    const { familyName, initialMembers } = req.body;
    const membersList = initialMembers && initialMembers.length 
      ? initialMembers 
      : ["Raja", "Amma", "Krishna", "Harini"];

    // Generate readable join code (e.g., NAIDU-7429)
    const joinCode = `${(familyName || 'FAM').substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const familyRef = await db.collection('families').add({
      name: familyName || "My Family Workspace",
      ownerId: req.user.uid,
      members: membersList,
      joinCode: joinCode,
      createdAt: new Date().toISOString()
    });

    // Link current user to this new family
    await db.collection('users').doc(req.user.uid).set({
      email: req.user.email,
      familyId: familyRef.id,
      role: 'owner',
      name: membersList[0] || 'Raja'
    }, { merge: true });

    res.status(201).json({ id: familyRef.id, joinCode, success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to create family workspace", details: err.message });
  }
});

// POST /api/family/join - Join an existing family using a join code
router.post('/join', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database unavailable." });

  try {
    const { joinCode, memberName } = req.body;
    const snapshot = await db.collection('families').where('joinCode', '==', joinCode.trim()).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Invalid Family Join Code." });
    }

    const familyDoc = snapshot.docs[0];
    const familyId = familyDoc.id;

    // Link user document
    await db.collection('users').doc(req.user.uid).set({
      email: req.user.email,
      familyId: familyId,
      role: 'member',
      name: memberName || 'Family Member'
    }, { merge: true });

    res.json({ success: true, familyId });
  } catch (err) {
    res.status(500).json({ error: "Failed to join family workspace", details: err.message });
  }
});

// POST /api/family/members - Add a custom family member to the dropdown list
router.post('/members', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database unavailable." });

  try {
    const { newMember } = req.body;
    if (!req.user.familyId) return res.status(400).json({ error: "No active family workspace." });

    const familyRef = db.collection('families').doc(req.user.familyId);
    const doc = await familyRef.get();
    
    const currentMembers = doc.data().members || [];
    if (!currentMembers.includes(newMember.trim())) {
      currentMembers.push(newMember.trim());
      await familyRef.update({ members: currentMembers });
    }

    res.json({ success: true, members: currentMembers });
  } catch (err) {
    res.status(500).json({ error: "Failed to add member", details: err.message });
  }
});

// GET /api/family/profile - Get logged-in user profile with avatar
router.get('/profile', async (req, res) => {
  res.json({
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    nickname: req.user.nickname,
    photoURL: req.user.photoURL,
    dob: req.user.dob,
    phone: req.user.phone,
    email: req.user.email
  });
});

// PUT /api/family/profile - Update user profile & avatar picture
router.put('/profile', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database unavailable." });
  try {
    const { firstName, lastName, nickname, photoURL, dob, phone } = req.body;

    await db.collection('users').doc(req.user.uid).update({
      firstName: firstName || '',
      lastName: lastName || '',
      nickname: nickname || '',
      photoURL: photoURL || '',
      dob: dob || '',
      phone: phone || ''
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile", details: err.message });
  }
});

module.exports = router;

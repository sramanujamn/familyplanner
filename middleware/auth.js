const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Check for valid Authorization Bearer Header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error("❌ Auth Failed: Missing or invalid authorization header format.");
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // 2. Verify Firebase Auth ID Token using modular getAuth()
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    // 3. Access Firestore database instance using modular getFirestore()
    const db = getFirestore();
    let userData = {};

    if (db) {
      try {
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
          userData = userDoc.data();
        }
      } catch (dbErr) {
        console.warn("⚠️ Firestore user lookup warning during auth:", dbErr.message);
      }
    }

    // 4. Attach user context to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      familyId: userData.familyId || null,
      role: userData.role || 'member',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      nickname: userData.nickname || (decodedToken.email ? decodedToken.email.split('@')[0] : 'User'),
      photoURL: userData.photoURL || decodedToken.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${decodedToken.uid}`,
      dob: userData.dob || '',
      phone: userData.phone || ''
    };

    next();
  } catch (error) {
    console.error("❌ Token Verification Failed in Auth Middleware:", error.message);
    return res.status(403).json({ 
      error: 'Unauthorized: Invalid or expired token.', 
      details: error.message 
    });
  }
}

module.exports = requireAuth;

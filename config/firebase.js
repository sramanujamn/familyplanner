//const admin = require('firebase-admin');

const { initializeApp, cert, getApps } = require('firebase-admin/app');

const { getFirestore } = require('firebase-admin/firestore');

let db = null

// Ensure you store your service account key path or JSON in environment variables
//const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
//  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
//  : require('../serviceAccountKey.json');

//var admin = require("firebase-admin");

//var serviceAccount = require("../../../firebase/serviceAccountKey.json");

//if (!admin.apps.length) {
//  admin.initializeApp({
//    credential: admin.credential.cert(serviceAccount)
//  });
//}

try {
  console.log('Reached here.')
  //var keyPath = path.join(__dirname, '../serviceAccountKey.json');
  const keyPath = '../serviceAccountKey.json';
  console.log('Below is keyPath');
  console.log(keyPath);
  var serviceAccount = require(keyPath);
  console.log('Loaded.');

  // Check if any app has already been initialized
  //if (!admin.apps || admin.apps.length === 0) {
    console.log('Reached here...');
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('Reached here too...')
  //}
  
  db = getFirestore();

} catch (error) {
  console.error("⚠️ Warning: Firebase service account key not found or failed to load. Running without database connection.", error.message);
}

// Safely export Firestore instance if an app exists
//const db = (admin.apps && admin.apps.length > 0) ? admin.firestore() : null;

module.exports = db;

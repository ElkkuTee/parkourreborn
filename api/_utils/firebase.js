import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const firebaseConfig = JSON.parse(
      Buffer.from(process.env.FIREBASE_KEY_BASE64, 'base64').toString()
    );

    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export default admin;
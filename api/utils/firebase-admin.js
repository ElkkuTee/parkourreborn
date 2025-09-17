import admin from 'firebase-admin';

function initializeFirebase() {
  if (!admin.apps.length) {
    const firebaseConfig = JSON.parse(
      Buffer.from(process.env.FIREBASE_KEY_BASE64, 'base64').toString()
    );

    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });
  }

  return admin;
}

export default initializeFirebase;
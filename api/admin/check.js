import admin from '../_utils/firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await admin.auth().getUser(decodedToken.uid);
    const customClaims = user.customClaims || {};

    const ADMIN_DISCORD_ID = '1020704620722528256';
    
    const isAdmin = customClaims.discord_id === ADMIN_DISCORD_ID;
    
    res.status(200).json({ isAdmin });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
}
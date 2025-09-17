import initializeFirebase from './utils/firebase-admin';

export default async function handler(req, res) {
  const admin = initializeFirebase();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { techId, message } = req.body;
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const { discord_id, username } = decodedToken;

    const response = await fetch('YOUR_DISCORD_BOT_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.DISCORD_BOT_API_KEY,
      },
      body: JSON.stringify({ discord_id, username, tech_id: techId, message }),
    });

    if (!response.ok) throw new Error('Failed to send to Discord bot');
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
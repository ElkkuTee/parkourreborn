import admin from './_utils/firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { techId, message } = req.body;
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { discord_id, username } = decodedToken;

    // Send to the Discord bot endpoint
    const response = await fetch('https://fofr.onrender.com/receive-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DISCORD_BOT_API_KEY}`
      },
      body: JSON.stringify({
        discord_username: username,
        discord_id: discord_id,
        tech: techId,
        message: message || ''
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send to Discord bot');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: error.message });
  }
}
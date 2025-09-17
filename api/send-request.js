import admin from './_utils/firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { techId, message } = req.body;
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get the user's custom claims which contain Discord info
    const user = await admin.auth().getUser(decodedToken.uid);
    const { discord_id, username } = user.customClaims || {};

    if (!discord_id || !username) {
      return res.status(400).json({ error: 'Missing Discord information' });
    }

    const requestBody = {
      discord_username: username,
      discord_id: discord_id,
      tech: techId,
      message: message || ''
    };

    // Send to Discord bot
    const response = await fetch('https://fofr.onrender.com/receive-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DISCORD_BOT_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send to Discord bot: ${errorText}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
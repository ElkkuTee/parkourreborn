import admin from './_utils/firebase.js';
import fetch from 'node-fetch'; // Add this if not already imported

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

    // Log request data
    console.log('Received request:', { techId, hasMessage: !!message });

    // Verify token and get user
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await admin.auth().getUser(decodedToken.uid);
    const customClaims = user.customClaims || {};

    // Log user data
    console.log('User data:', { 
      uid: user.uid, 
      claims: customClaims,
      hasDiscordId: !!customClaims.discord_id,
      hasUsername: !!customClaims.username
    });

    if (!customClaims.discord_id || !customClaims.username) {
      return res.status(400).json({ error: 'Discord account not linked properly' });
    }

    const requestBody = {
      discord_username: customClaims.username,
      discord_id: customClaims.discord_id,
      tech: techId,
      message: message || ''
    };

    console.log('Sending to Discord bot:', requestBody);

    // Send to Discord bot
    const botResponse = await fetch('https://fofr.onrender.com/receive-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DISCORD_BOT_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    // Log bot response status
    console.log('Bot response status:', botResponse.status);

    if (!botResponse.ok) {
      const errorText = await botResponse.text();
      console.error('Discord bot error response:', errorText);
      return res.status(502).json({ 
        error: 'Failed to send to Discord bot',
        details: errorText
      });
    }

    const responseData = await botResponse.json();
    console.log('Bot response data:', responseData);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
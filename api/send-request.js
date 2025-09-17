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

    if (!techId) {
      return res.status(400).json({ error: 'Tech ID is required' });
    }

    // Verify the ID token and get user data
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await admin.auth().getUser(decodedToken.uid);
    const customClaims = user.customClaims || {};

    // Check if user has complete Discord info in claims
    if (!customClaims.discord_id || !customClaims.username || !customClaims.discriminator) {
      console.error('Missing Discord info:', { 
        uid: user.uid, 
        claims: customClaims 
      });
      return res.status(400).json({ 
        error: 'Missing Discord information. Please logout and login again.' 
      });
    }

    const requestBody = {
      discord_username: `${customClaims.username}#${customClaims.discriminator}`,
      discord_id: customClaims.discord_id,
      tech: techId,
      message: message || ''
    };

    console.log('Sending request to Discord bot:', requestBody);

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
      console.error('Discord bot error:', errorText);
      throw new Error('Failed to send to Discord bot');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Request error:', error);
    res.status(error.status || 500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
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

    console.log('Received request:', { techId, message }); // Debug log

    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    console.log('Token decoded:', decodedToken); // Debug log

    // Extract Discord information from custom claims
    const { discord_id, username } = decodedToken;
    
    if (!discord_id || !username) {
      console.error('Missing Discord info in token:', decodedToken);
      return res.status(400).json({ error: 'Missing Discord information' });
    }

    const requestBody = {
      discord_username: username,
      discord_id: discord_id,
      tech: techId,
      message: message || ''
    };

    console.log('Sending to Discord bot:', requestBody); // Debug log

    // Send to the Discord bot endpoint
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
      console.error('Discord bot response error:', errorText);
      throw new Error(`Failed to send to Discord bot: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Discord bot response:', responseData); // Debug log

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
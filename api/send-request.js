import admin from './_utils/firebase.js';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { techId, message } = req.body;
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    
    // Validate request
    if (!idToken) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    if (!techId) {
      return res.status(400).json({ error: 'Tech name is required' });
    }

    // Verify Firebase token and get user
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await admin.auth().getUser(decodedToken.uid);
    const customClaims = user.customClaims || {};

    // Check for required Discord info
    if (!customClaims.discord_id || !customClaims.username || !customClaims.discriminator) {
      return res.status(400).json({ 
        error: 'Discord account not properly linked. Please logout and login again.' 
      });
    }

    // Format request body exactly as bot expects
    const requestBody = {
      discord_username: customClaims.username,
      discord_id: customClaims.discord_id,
      tech: techId,
      message: message || ''
    };

    console.log('[Help Request] Sending to bot:', requestBody);

    // Send request to Discord bot with correct headers
    const botResponse = await fetch('https://fofr.onrender.com/receive-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.DISCORD_BOT_API_KEY // Changed to match bot's expected header
      },
      body: JSON.stringify(requestBody)
    });

    if (!botResponse.ok) {
      const errorText = await botResponse.text();
      console.error('[Help Request] Bot error:', errorText);
      
      // Map specific bot error responses
      if (botResponse.status === 401) {
        return res.status(500).json({ error: 'Bot authentication failed' });
      } else if (botResponse.status === 400) {
        return res.status(400).json({ error: 'Invalid request format' });
      }
      
      return res.status(502).json({
        error: 'Failed to send to Discord bot',
        details: errorText
      });
    }

    const responseData = await botResponse.json();
    console.log('[Help Request] Success:', responseData);

    res.status(200).json({ 
      success: true,
      message: 'Help request sent successfully! A helper will contact you on Discord.'
    });

  } catch (error) {
    console.error('[Help Request] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
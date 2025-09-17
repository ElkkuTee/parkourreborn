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

    // Log the incoming request
    console.log('[Help Request] Received:', { techId, hasMessage: !!message });

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await admin.auth().getUser(decodedToken.uid);
    const customClaims = user.customClaims || {};

    console.log('[Help Request] User data:', {
      uid: user.uid,
      hasDiscordId: !!customClaims.discord_id,
      hasUsername: !!customClaims.username
    });

    if (!customClaims.discord_id || !customClaims.username) {
      return res.status(400).json({ 
        error: 'Discord account not linked. Please logout and login again.' 
      });
    }

    // Prepare request to Discord bot
    const requestBody = {
      discord_username: customClaims.username,
      discord_id: customClaims.discord_id,
      tech: techId,
      message: message || ''
    };

    console.log('[Help Request] Sending to bot:', requestBody);

    // Send request to Discord bot
    const botResponse = await fetch('https://fofr.onrender.com/receive-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DISCORD_BOT_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      // Add timeout to prevent hanging requests
      timeout: 8000
    });

    console.log('[Help Request] Bot response status:', botResponse.status);

    // Handle bot response
    if (!botResponse.ok) {
      const errorText = await botResponse.text().catch(() => 'No error details available');
      console.error('[Help Request] Bot error:', errorText);
      
      return res.status(502).json({
        error: 'Failed to send to Discord bot',
        details: errorText,
        status: botResponse.status
      });
    }

    // Parse successful response
    const responseData = await botResponse.json();
    console.log('[Help Request] Bot success:', responseData);

    res.status(200).json({ 
      success: true,
      message: 'Help request sent successfully'
    });

  } catch (error) {
    console.error('[Help Request] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
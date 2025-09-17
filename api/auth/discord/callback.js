import admin from '../../_utils/firebase.js';

export default async function handler(req, res) {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // Exchange code for Discord token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error('Failed to get Discord access token');
    }

    // Get Discord user data
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResponse.json();
    
    if (!userData.id) {
      throw new Error('Failed to get Discord user data');
    }

    console.log('Discord user data:', {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator
    });

    try {
      // Try to get existing user
      await admin.auth().getUser(userData.id);
    } catch (userError) {
      if (userError.code === 'auth/user-not-found') {
        // Create new user if not found
        await admin.auth().createUser({
          uid: userData.id,
          displayName: userData.username
        });
        console.log('Created new user:', userData.id);
      } else {
        throw userError;
      }
    }

    // Set custom claims for the user
    await admin.auth().setCustomUserClaims(userData.id, {
      discord_id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator || '0'
    });
    console.log('Set custom claims for:', userData.id);

    // Create custom token
    const customToken = await admin.auth().createCustomToken(userData.id);

    // Redirect with token
    res.redirect(`/?token=${customToken}`);
    
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect('/?error=' + encodeURIComponent(error.message));
  }
}
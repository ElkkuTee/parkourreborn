import admin from 'firebase-admin';

export default async function handler(req, res) {
  const { code } = req.query;
  
  try {
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

    const { access_token } = await tokenResponse.json();
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userData = await userResponse.json();

    const sessionToken = await admin.auth().createCustomToken(userData.id, {
      discord_id: userData.id,
      username: userData.username,
    });

    res.redirect(`/?token=${sessionToken}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
export default async function handler(req, res) {
  const DISCORD_ENDPOINT = 'https://discord.com/api/oauth2/authorize';
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
  });

  res.redirect(`${DISCORD_ENDPOINT}?${params.toString()}`);
}
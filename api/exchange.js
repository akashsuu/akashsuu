const DISCORD_CLIENT_ID = '1479748262591332392';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = 'https://akashsuu.github.io/akashsuu/';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  if (!DISCORD_CLIENT_SECRET) {
    return res.status(500).json({ error: 'DISCORD_CLIENT_SECRET not set in Vercel env' });
  }

  try {
    let body = req.body;
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      const raw = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
      });
      body = raw ? JSON.parse(raw) : {};
    }
    const code = body.code;
    if (!code) return res.status(400).json({ error: 'missing code' });

    const params = new URLSearchParams();
    params.append('client_id', DISCORD_CLIENT_ID);
    params.append('client_secret', DISCORD_CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).json({ error: tokenData.error || 'token exchange failed', details: tokenData });
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const user = await userRes.json();

    res.json({
      id: user.id,
      username: user.username,
      avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}

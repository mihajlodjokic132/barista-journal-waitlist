// Vercel serverless function to securely call Loops API
// Place this file at /api/loops-waitlist.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, email, skill } = req.body || {};
  if (!email || !name) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const apiKey = process.env.LOOPS_API_KEY || process.env.VITE_LOOPS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Loops API key not configured' });
    return;
  }

  try {
    const loopsRes = await fetch('https://app.loops.so/api/v1/contacts/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        name,
        source: 'waitlist',
        skill_level: skill,
      }),
    });
    if (!loopsRes.ok) {
      const errorText = await loopsRes.text();
      res.status(500).json({ error: 'Loops API error', details: errorText });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error', details: e.message });
  }
}

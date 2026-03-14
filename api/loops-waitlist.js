// Vercel serverless function to securely call Loops API
// Place this file at /api/loops-waitlist.js

export default async function handler(req, res) {
  console.log('Function invoked', { method: req.method, body: req.body });

  if (req.method !== 'POST') {
    console.log('Method not allowed');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, email, skill } = req.body || {};
  if (!email || !name) {
    console.log('Missing required fields', { name, email });
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const apiKey = process.env.LOOPS_API_KEY || process.env.VITE_LOOPS_API_KEY;
  if (!apiKey) {
    console.log('Loops API key not configured');
    res.status(500).json({ error: 'Loops API key not configured' });
    return;
  }

  try {
    const loopsRes = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        firstName: name,
        source: 'waitlist',
        skill,
      }),
    });
    const loopsText = await loopsRes.text();
    console.log('Loops API response', { status: loopsRes.status, body: loopsText });
    if (!loopsRes.ok) {
      res.status(500).json({ error: 'Loops API error', details: loopsText });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.log('Server error', { error: e.message });
    res.status(500).json({ error: 'Server error', details: e.message });
  }
}

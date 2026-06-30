export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, mediaType } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image }
            },
            {
              type: 'text',
              text: 'List every distinct food item, ingredient, or grocery item visible in this photo of a fridge or pantry. Be specific (e.g. "eggs" not "carton", "milk" not "bottle"). Return ONLY a JSON array of short item names, lowercase, nothing else. Example: ["eggs","milk","spinach","chicken breast"]'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const raw = (data.content || []).map(b => b.text || '').join('').trim();
    let items = [];
    try {
      items = JSON.parse(raw);
    } catch {
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) items = JSON.parse(m[0]);
    }
    return res.status(200).json({ items: Array.isArray(items) ? items : [] });
  } catch (error) {
    return res.status(500).json({ error: error.message, items: [] });
  }
}

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Gemini setup ---
const API_KEY = process.env.GOOGLE_API_KEY; // <-- put your key in .env
if (!API_KEY) {
  console.warn('⚠️ GOOGLE_API_KEY is missing. Create a .env file with GOOGLE_API_KEY=YOUR_KEY');
}
const genAI = new GoogleGenerativeAI(API_KEY);
// Choose a recent fast model (you can change to 1.5-pro if you want)
const MODEL = 'gemini-2.0-flash';

// --- Chat route ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ reply: 'Please send message:string' });
    }

    const model = genAI.getGenerativeModel({ model: MODEL });
    // Build content parts from simple text history
    const contents = [
      ...history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const result = await model.generateContent({ contents });
    const text = result?.response?.text?.() || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a reply.';
    return res.json({ reply: text });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ reply: 'Server error talking to Gemini.' });
  }
});

// Fallback to index.html (single-page)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ AI Study Buddy running at http://localhost:${PORT}`);
});

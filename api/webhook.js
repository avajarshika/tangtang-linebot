const crypto = require('crypto');

const LINE_TOKEN = process.env.LINE_TOKEN;
const LINE_SECRET = process.env.LINE_SECRET;
const GEMINI_KEY = process.env.GEMINI_KEY;

function verifySignature(body, signature) {
  const hash = crypto
    .createHmac('sha256', LINE_SECRET)
    .update(body)
    .digest('base64');
  return hash === signature;
}

async function askGemini(userMessage) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `คุณคือถังถัง ผู้ช่วยสอนภาษาจีนน่ารักและเป็นมิตร ตอบเป็นภาษาไทยเสมอ ช่วยตอบคำถามเรื่องภาษาจีน คำศัพท์ การออกเสียง และไวยากรณ์ ตอบสั้นกระชับและเข้าใจง่าย

คำถาม: ${userMessage}`
          }]
        }]
      })
    }
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'ขอโทษนะคะ ถังถังไม่เข้าใจคำถาม ลองถามใหม่ได้เลยค่า 🦊';
}

async function replyToLine(replyToken, message) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_TOKEN}`
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text: message }]
    })
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send('TangTang LINE Bot 🦊');

  const signature = req.headers['x-line-signature'];
  const rawBody = JSON.stringify(req.body);

  if (!verifySignature(rawBody, signature)) {
    return res.status(401).send('Unauthorized');
  }

  const events = req.body.events || [];

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;
      const replyToken = event.replyToken;
      const reply = await askGemini(userMessage);
      await replyToLine(replyToken, reply);
    }
  }

  res.status(200).send('OK');
};

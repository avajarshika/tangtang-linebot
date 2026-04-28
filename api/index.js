const http = require('http');

const LINE_TOKEN = process.env.LINE_TOKEN;
const GEMINI_KEY = process.env.GEMINI_KEY;
const PORT = process.env.PORT || 3000;

async function askGemini(userMessage) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `คุณคือถังถัง ผู้ช่วยสอนภาษาจีนน่ารักและเป็นมิตร ตอบเป็นภาษาไทยเสมอ ช่วยตอบคำถามเรื่องภาษาจีน คำศัพท์ การออกเสียง และไวยากรณ์ ตอบสั้นกระชับและเข้าใจง่าย คำถาม: ${userMessage}`
          }]
        }]
      })
    }
  );
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'ขอโทษนะคะ ลองใหม่อีกครั้งนะคะ 🦊';
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

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET') {
    res.writeHead(200);
    res.end('TangTang LINE Bot 🦊');
    return;
  }

  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const events = data.events || [];
        for (const event of events) {
          if (event.type === 'message' && event.message.type === 'text') {
            const reply = await askGemini(event.message.text);
            await replyToLine(event.replyToken, reply);
          }
        }
      } catch (e) {
        console.error(e);
      }
      res.writeHead(200);
      res.end('OK');
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`TangTang Bot running on port ${PORT}`);
});

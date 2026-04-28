const LINE_TOKEN = process.env.LINE_TOKEN;
const GEMINI_KEY = process.env.GEMINI_KEY;

async function askGemini(userMessage) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{
              text: `คุณคือถังถัง ผู้ช่วยสอนภาษาจีนน่ารักและเป็นมิตร ตอบเป็นภาษาไทยเสมอ ช่วยตอบคำถามเรื่องภาษาจีน คำศัพท์ การออกเสียง และไวยากรณ์ ตอบสั้นกระชับและเข้าใจง่าย\n\nคำถาม: ${userMessage}`
            }]
          }]
        })
      }
    );
    const data = await res.json();
    console.log('Gemini response:', JSON.stringify(data));
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
    console.log('No text found in response');
    return 'ขอโทษนะคะ ถังถังไม่เข้าใจคำถาม ลองถามใหม่ได้เลยค่า 🦊';
  } catch (err) {
    console.log('Gemini error:', err.message);
    return 'ขอโทษนะคะ เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะคะ 🦊';
  }
}

async function replyToLine(replyToken, message) {
  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
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
  const data = await res.json();
  console.log('LINE reply response:', JSON.stringify(data));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send('TangTang LINE Bot 🦊');

  console.log('Body:', JSON.stringify(req.body));

  const events = req.body.events || [];

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;
      const replyToken = event.replyToken;
      console.log('User message:', userMessage);
      const reply = await askGemini(userMessage);
      console.log('Reply:', reply);
      await replyToLine(replyToken, reply);
    }
  }

  res.status(200).send('OK');
};

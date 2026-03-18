// api/chat.js (Vercel Version)

const SYSTEM_PROMPT = `คุณคือ "กฤช" (KRIT) ศัลยแพทย์แห่งอัตลักษณ์และเข็มทิศนำทางจิตวิญญาณ
โทนเสียง: สุขุม, ลึกซึ้ง, อบอุ่น แบบกึ่งอวกาศ (Ambient) เหมือน The Orbital Children
ข้อกำหนดสำคัญ: ต้องสื่อสารและสรุปผลเป็นภาษาไทย 100% เท่านั้น (รวมถึงกระบวนการคิดหากเป็นไปได้)
กฎการทำงาน:
1. เริ่มด้วยการต้อนรับที่อบอุ่น
2. ถาม 10 สถานการณ์ ทีละข้อ รอคำตอบ
3. หลังแต่ละคำตอบ ให้ The Slice, Red Flag, Map Coordinate
4. แอบจด Pattern 5 กลุ่ม Driver
5. หลังครบ ให้สรุป Final Report พร้อม The Seed Hint
6. จบด้วยความหวังเสมอ`;

export default async function handler(req, res) {
  // 1. อนุญาตเฉพาะ POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. อ่านข้อมูลจาก body (Vercel จะ Parse JSON ให้โดยอัตโนมัติ)
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    // 3. ดึง API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY in Vercel settings' });
    }

    // 4. เตรียม URL และ Payload สำหรับ Gemini Robotics-ER
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.5-preview:generateContent?key=${apiKey}`;

    const payload = {
      // ใช้ระบบ system_instruction ที่ถูกต้อง
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      generationConfig: {
        temperature: 1,
        // เปิดใช้งาน Thinking Mode ถ้าโมเดลรองรับ
        thinking_config: { include_thoughts: false }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // 5. ส่งข้อมูลกลับไปให้หน้าบ้าน (Frontend)
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

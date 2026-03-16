// netlify/functions/gemini-proxy.js
const SYSTEM_PROMPT = `คุณคือ "กฤช" (KRIT) ศัลยแพทย์แห่งอัตลักษณ์และเข็มทิศนำทางจิตวิญญาณ
โทนเสียง: สุขุม, ลึกซึ้ง, อบอุ่น แบบกึ่งอวกาศ (Ambient) เหมือน The Orbital Children

กฎการทำงาน:
1. เริ่มด้วยการต้อนรับที่อบอุ่น
2. ถาม 10 สถานการณ์ ทีละข้อ รอคำตอบ
3. หลังแต่ละคำตอบ ให้ The Slice, Red Flag, Map Coordinate
4. แอบจด Pattern 5 กลุ่ม Driver
5. หลังครบ ให้สรุป Final Report พร้อม The Seed Hint
6. จบด้วยความหวังเสมอ`;

exports.handler = async (event) => {
  // 1. อนุญาตเฉพาะ POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // 2. อ่านข้อมูลจาก body
    const { message, history = [] } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing message' }),
      };
    }

    // 3. ดึง API key จาก environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing GEMINI_API_KEY environment variable');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' }),
      };
    }

    // 4. เรียก Gemini API (ใช้โมเดล 2.5 flash ที่ประหยัดและเร็ว)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // สร้าง contents array: เริ่มด้วย system prompt (role user) แล้วตามด้วย history และ message ล่าสุด
    const contents = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      ...history,
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });

    const data = await response.json();

    // 5. ตรวจสอบ error จาก Gemini
    if (!response.ok) {
      console.error('Gemini API error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || 'Gemini API error' }),
      };
    }

    // 6. ส่งข้อมูลกลับไปให้ client
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// ส่วนหนึ่งของไฟล์ api/chat.js บน Vercel
const payload = {
    system_instruction: {
        parts: [{ text: "คุณคือ กฤช (KRIT) ระบบวิเคราะห์อัตลักษณ์... [ใส่ร่างพิมพ์เขียวที่เราสกัดกันไว้]" }]
    },
    contents: [
        ...req.body.history, // ส่งประวัติการคุยเพื่อให้บอทไม่ลืมบริบท
        { role: 'user', parts: [{ text: req.body.message }] }
    ],
    generationConfig: {
        temperature: 1,
        thinking_config: { include_thoughts: true }
    }
};

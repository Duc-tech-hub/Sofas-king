import admin from 'firebase-admin';
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}
const ADMIN_WHITELIST = [
    Your_admin_emails
];

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Không tìm thấy thẻ bài (Token)!' });
    }
    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userEmail = decodedToken.email;
        console.log("Email thực tế từ Google:", userEmail);
        if (!ADMIN_WHITELIST.map(e => e.toLowerCase()).includes(userEmail.toLowerCase())) {
            console.warn(`Warning: ${userEmail} is accessing to database`);
            return res.status(403).json({ error: 'Thẻ bài đúng, nhưng ông không có quyền Admin!' });
        }
        const { image } = req.body;
        const IMGBB_KEY = process.env.IMGBB_API_KEY;
        const formData = new URLSearchParams();
        formData.append("image", image);

        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
            method: "POST",
            body: formData
        });

        const result = await imgbbRes.json();
        return res.status(200).json(result);
    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(401).json({ error: 'Thẻ bài giả, hết hạn hoặc lỗi hệ thống!' });
    }
}
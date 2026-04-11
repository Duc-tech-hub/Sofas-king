import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(1, "40 s"),
    analytics: true,
});

export default async function handler(req, res) {
    const allowedOrigin = "Your_domain";
    const origin = req.headers.origin;

    if (process.env.NODE_ENV === 'production' && origin !== allowedOrigin) {
        return res.status(403).json({ success: false, message: "FORBIDDEN_ORIGIN" });
    }

    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { newUsername, userId } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
        const { success: limitOk, reset } = await ratelimit.limit(`update-username:${ip}`);

        if (!limitOk) {
            const waitTime = Math.ceil((reset - Date.now()) / 1000);
            return res.status(429).json({
                success: false,
                message: "TOO_MANY_REQUESTS",
                detail: `You are changing username too much, please wait for ${waitTime} seconds.`
            });
        }

        if (!userId) return res.status(401).json({ success: false, message: "AUTH_REQUIRED" });
        if (!newUsername || newUsername.trim().length < 3) {
            return res.status(400).json({ success: false, message: "INVALID_USERNAME" });
        }
        let db;
        if (!getApps().length) {
            let saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (!saRaw) throw new Error("MISSING_FIREBASE_SERVICE_ACCOUNT");
            
            saRaw = saRaw.trim();
            if (!saRaw.startsWith('{')) {
                saRaw = Buffer.from(saRaw, 'base64').toString('utf-8');
            }
            if (saRaw.startsWith("'") && saRaw.endsWith("'")) saRaw = saRaw.slice(1, -1);
            
            let serviceAccount = JSON.parse(saRaw);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            initializeApp({ credential: cert(serviceAccount) });
        }
        db = getFirestore();
        const keysRaw = process.env.MODERATOR_KEYS_POOL || "";
        const keysGate = keysRaw.split(",").map(k => k.trim()).filter(k => k);
        const activeKey = keysGate.length > 0 
            ? keysGate[Math.floor(Math.random() * keysGate.length)] 
            : process.env.GROQ_API_KEY;

        const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${activeKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "As a content moderator, moderate offensive content. If unusual or strange language, respond BAD. Respond ONLY 'SAFE' or 'BAD'." },
                    { role: "user", content: newUsername }
                ],
                temperature: 0
            })
        });

        const aiData = await aiRes.json();
        const aiMessage = aiData.choices?.[0]?.message?.content?.trim().toUpperCase() || "SAFE";

        if (aiMessage.includes("BAD")) {
            return res.status(400).json({ success: false, message: "INAPPROPRIATE_LANGUAGE" });
        }
        const snapshot = await db.collection('users').where('username', '==', newUsername).get();
        if (!snapshot.empty) {
            const isOwner = snapshot.docs.some(doc => doc.id === userId);
            if (!isOwner) {
                return res.status(400).json({ success: false, message: "USERNAME_TAKEN" });
            }
        }

        await db.collection('users').doc(userId).update({
            username: newUsername
        });

        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({ success: false, detail: error.message });
    }
}
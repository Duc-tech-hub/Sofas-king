import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(1, "15 s"),
    analytics: true,
});

export default async function handler(req, res) {
    const allowedOrigin = "Your_domain";
    const origin = req.headers.origin;

    if (process.env.NODE_ENV === 'production' && origin !== allowedOrigin) {
        return res.status(403).json({ success: false, message: "FORBIDDEN_ORIGIN" });
    }
    
    res.setHeader('Access-Control-Allow-Origin', origin || "*");
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { text, name, product, stars, userId } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
        const { success: limitOk, reset } = await ratelimit.limit(`comment-limit:${ip}`);

        if (!limitOk) {
            const waitTime = Math.ceil((reset - Date.now()) / 1000);
            return res.status(429).json({
                success: false,
                message: "TOO_MANY_REQUESTS",
                detail: `Please wait for ${waitTime} seconds to continue.`
            });
        }

        if (!userId) {
            return res.status(401).json({ success: false, message: "AUTH_REQUIRED" });
        }
        if (!text) throw new Error("Missing text");
        let db;
        try {
            if (!getApps().length) {
                let saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
                if (!saRaw) throw new Error("MISSING_ENV_VAR");

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
        } catch (fbErr) {
            return res.status(500).json({ 
                success: false, 
                message: "FIREBASE_INIT_ERROR", 
                detail: fbErr.message 
            });
        }
        db = getFirestore();
        const keysRaw = process.env.MODERATOR_KEYS_POOL || "";
        const keysGate = keysRaw.split(",").map(k => k.trim()).filter(k => k);
        const activeKey = keysGate.length > 0 
            ? keysGate[Math.floor(Math.random() * keysGate.length)] 
            : process.env.MODERATOR_KEYS_POOL;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${activeKey}`,
                "Content-Type": "application/json"
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "As a content moderator for this website, you must moderate any offensive or inappropriate content and return the correct formatted results. Attension, if the content is unusual and contain strange language that you have never seen before, that is INAPPROPRIATE LANGUAGE. Respond ONLY 'SAFE' or 'BAD'." },
                    { role: "user", content: text }
                ],
                temperature: 0
            })
        });
        clearTimeout(timeoutId);
        
        const aiData = await aiRes.json();
        const aiMessage = aiData.choices?.[0]?.message?.content?.trim().toUpperCase() || "SAFE";

        if (aiMessage.includes("BAD")) {
            return res.status(400).json({ success: false, message: "INAPPROPRIATE_CONTENT" });
        }
        await db.collection('comments').add({
            uid: userId,
            name: name || "Anonymous",
            product: product || "Unknown",
            stars: parseInt(stars) || 5,
            text: text,
            date: FieldValue.serverTimestamp()
        });

        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "SERVER_ERROR",
            detail: error.message
        });
    }
}
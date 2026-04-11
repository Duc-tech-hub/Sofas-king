import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(1, "10 s"),
    analytics: true,
});

export default async function handler(req, res) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
    
    try {
        const { success: limitOk, reset } = await ratelimit.limit(`ai-chat-limit:${ip}`);

        if (!limitOk) {
            const waitTime = Math.ceil((reset - Date.now()) / 1000);
            return res.status(429).json({
                success: false,
                message: "TOO_MANY_REQUESTS",
                detail: `Please wait for ${waitTime} seconds to continue.`
            });
        }
        const origin = req.headers.origin || req.headers.referer;
        const ALLOWED_ORIGINS = ["Your_domain"];
        const isAllowed = ALLOWED_ORIGINS.some(domain => origin?.startsWith(domain));

        if (!isAllowed) {
            console.error(`Blocked unauthorized access from: ${origin}`);
            return res.status(403).json({ error: "Access Denied: Domain not whitelisted" });
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }
        const { userText, productsInfo, history } = req.body;
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: 'Missing Groq API Key on server' });
        }

        const safeHistory = Array.isArray(history) ? history : [];

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `Your Instruction`
                    },
                    ...safeHistory,
                    { role: "user", content: userText }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            res.status(200).json({
                text: data.choices[0].message.content
            });
        } else {
            console.error("Groq Response Error:", data);
            res.status(500).json({ error: 'Invalid response from Groq' });
        }

    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
}
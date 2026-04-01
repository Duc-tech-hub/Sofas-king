import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const API_KEY = "AIzaSyCuOUdAhnK3WzhUsQ8DO0v5SoAhIj1NA48";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash" 
}, { 
    apiVersion: "v1"
});

const getChatHistory = () => {
    const history = sessionStorage.getItem("gemini_chat_logs");
    return history ? JSON.parse(history) : [];
};

const saveChatHistory = (history) => {
    sessionStorage.setItem("gemini_chat_logs", JSON.stringify(history));
};

const showLoading = () => {
    const chatContent = document.getElementById('chat-content');
    const loader = document.createElement('div');
    loader.id = 'ai-loader';
    loader.className = 'typing-loader';
    loader.innerHTML = '<span></span><span></span><span></span>';
    chatContent.appendChild(loader);
    chatContent.scrollTop = chatContent.scrollHeight;
};

const removeLoading = () => {
    const loader = document.getElementById('ai-loader');
    if (loader) loader.remove();
};

const appendMessage = (role, text) => {
    const chatContent = document.getElementById('chat-content');
    if (!chatContent) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role === 'user' ? 'user' : 'model'}`;
    msgDiv.innerText = text;

    chatContent.appendChild(msgDiv);
    chatContent.scrollTop = chatContent.scrollHeight;
};

export const askGemini = async () => {
    const input = document.getElementById('ai-input');
    const userText = input.value.trim();
    if (!userText) return;

    appendMessage('user', userText);
    input.value = '';
    showLoading();

    const historyLogs = getChatHistory();
    const chatSession = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: "You are an AI assistant for Kingsofas. Support both Vietnamese and English. Automatically reply in the same language the user uses. Consult about sofas and furniture." }]
            },
            {
                role: "model",
                parts: [{ text: "Understood. I'm ready to help!" }]
            },
            ...historyLogs.map(item => ({
                role: item.role,
                parts: [{ text: item.parts[0].text }]
            }))
        ],
    });

    try {
        const result = await chatSession.sendMessage(userText);
        const response = await result.response;
        const botText = response.text();

        removeLoading();
        appendMessage('model', botText);

        const updatedHistory = [
            ...historyLogs,
            { role: "user", parts: [{ text: userText }] },
            { role: "model", parts: [{ text: botText }] }
        ];
        saveChatHistory(updatedHistory);

    } catch (error) {
        removeLoading();
        console.error("Gemini Error:", error);
        appendMessage('model', "System is busy, please try again later.");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const history = getChatHistory();
    const chatContent = document.getElementById('chat-content');

    if (history.length > 0 && chatContent) {
        chatContent.innerHTML = '';
        history.forEach(msg => appendMessage(msg.role, msg.parts[0].text));
    }

    document.getElementById('ai-send')?.addEventListener('click', askGemini);
    document.getElementById('ai-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') askGemini();
    });
});
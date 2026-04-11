import { db } from './firebase-config.js'; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const chatContent = document.getElementById('chat-content');
const aiInput = document.getElementById('ai-input');
const aiSend = document.getElementById('ai-send');

let chatHistory = JSON.parse(sessionStorage.getItem('sofa_chat_history')) || [];
function saveToStorage() {
    sessionStorage.setItem('sofa_chat_history', JSON.stringify(chatHistory));
}

function loadChatHistory() {
    chatHistory.forEach(msg => {
        const role = msg.role === 'user' ? 'user' : 'model';
        appendMessage(role, msg.content, false);
    });
}
loadChatHistory();

async function fetchProductsFromFirestore() {
    try {
        if (!db) return "Data system error.";
        const querySnapshot = await getDocs(collection(db, "products"));
        let productList = "Product Data:\n";
        querySnapshot.forEach((doc) => {
            const p = doc.data();
            productList += `- ${p.Name}: Price ${p.Price}, Stock: ${p.Stock}, Desc: ${p.Description}\n`;
        });
        return productList;
    } catch (error) {
        return "Failed to fetch products.";
    }
}

function appendMessage(role, text, shouldSave = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerText = text;
    chatContent.appendChild(messageDiv);
    chatContent.scrollTop = chatContent.scrollHeight;
    
    if (shouldSave) {
        const groqRole = (role === 'user') ? 'user' : 'assistant';
        chatHistory.push({ role: groqRole, content: text });
        saveToStorage();
    }
}

function showTyping() {
    const loader = document.createElement('div');
    loader.className = 'typing-loader';
    loader.innerHTML = '<span></span><span></span><span></span>';
    chatContent.appendChild(loader);
    chatContent.scrollTop = chatContent.scrollHeight;
    return loader;
}

async function handleChat() {
    const userText = aiInput.value.trim();
    if (!userText) return;

    const historyContext = [...chatHistory];

    appendMessage('user', userText);
    aiInput.value = '';

    const loader = showTyping();

    try {
        const productsData = await fetchProductsFromFirestore();

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userText: userText,
                productsInfo: productsData,
                history: historyContext
            })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); 
            if (loader) loader.remove();
            const errorMsg = response.status === 429 
                ? "You're sending messages too fast. System busy. Please try again after 10 seconds!" 
                : "System busy. Please try again later!";
                
            appendMessage('model', errorMsg);
            return;
        }

        const data = await response.json();
        if (loader) loader.remove();

        if (data.text) {
            appendMessage('model', data.text);
        } else {
            appendMessage('model', "System busy. Please try again later!");
        }

    } catch (error) {
        if (loader) loader.remove();
        console.error("Chat Error:", error);
        appendMessage('model', "System busy (Network error)!");
    }
}
const suggestions = [
    "What's your best-selling sofa?",
    "How many sofas are there?",
    "How can I buy sofas?",
    "What are the functions?"
];

const suggestionContainer = document.getElementById('quick-suggestions');
function renderSuggestions() {
    suggestionContainer.innerHTML = '';
    suggestions.forEach(text => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline-primary rounded-pill px-3 py-1 text-sm transition-all hover:bg-primary hover:text-white';
        btn.innerText = text;
        btn.onclick = () => {
            aiInput.value = text;
            handleChat();
        };
        suggestionContainer.appendChild(btn);
    });
}
renderSuggestions();

aiSend.onclick = handleChat;
aiInput.onkeypress = (e) => { if (e.key === 'Enter') handleChat(); };
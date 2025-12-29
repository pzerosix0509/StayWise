// --- START OF FILE chatbot.js ---

const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chat-box");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null;
const inputInitHeight = chatInput.scrollHeight;
const BACKEND_URL = 'https://cinnabarine-ludivina-reply.ngrok-free.dev/chat'; // Đảm bảo port đúng với server của bạn

const BOT_ICON_URL = "../assets/images/chatbotlogo.png"; 

// Helper function để parse markdown links
const parseMarkdownLinks = (text) => {
    let html = text;
    
    // Pattern: **[text](url)** -> Bold Link
    html = html.replace(/\*\*\[([^\]]+)\]\(([^)]+)\)\*\*/g, (match, text, url) => {
        return `<a href="${url}" style="font-weight: bold;">${text}</a>`;
    });
    
    // Pattern: [text](url) -> Normal Link
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        return `<a href="${url}">${text}</a>`;
    });
    
    // Pattern: **text** -> Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // List & Line breaks
    const lines = html.split('\n');
    const processed = [];
    let inList = false;
    
    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ')) {
            if (!inList) {
                processed.push('<ul>');
                inList = true;
            }
            processed.push('<li>' + trimmed.substring(2) + '</li>');
        } else {
            if (inList) {
                processed.push('</ul>');
                inList = false;
            }
            if (trimmed) {
                processed.push(trimmed);
            }
        }
    }
    
    if (inList) {
        processed.push('</ul>');
    }
    
    html = processed.join('<br>');
    return html;
};

const generateSessionId = () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            return 'sess-user-' + user.uid;
        } catch (e) {
            console.error('Error parsing user:', e);
        }
    }
    return 'sess-guest-' + Math.random().toString(36).substr(2, 9);
}

let sessionId = sessionStorage.getItem("chatSessionId");
const currentUser = localStorage.getItem('currentUser');

if (currentUser) {
    const newSessionId = generateSessionId();
    if (sessionId !== newSessionId) {
        sessionId = newSessionId;
        sessionStorage.setItem("chatSessionId", sessionId);
        sessionStorage.removeItem("chatHistory");
    }
} else if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem("chatSessionId", sessionId);
}
console.log("Current Session ID:", sessionId);

// ============================================
// 2. QUẢN LÝ LỊCH SỬ CHAT
// ============================================

window.clearChatSession = () => {
    sessionStorage.removeItem("chatSessionId");
    sessionStorage.removeItem("chatHistory");
    if (chatbox) {
        chatbox.innerHTML = "";
    }
    console.log("🗑️ Chat session cleared");
};

const saveMessageToHistory = (message, role) => {
    let history = JSON.parse(sessionStorage.getItem("chatHistory")) || [];
    history.push({ message, role });
    sessionStorage.setItem("chatHistory", JSON.stringify(history));
}

const loadChatHistory = () => {
    let history = JSON.parse(sessionStorage.getItem("chatHistory")) || [];
    if (history.length === 0) return; 
    
    chatbox.innerHTML = "";

    history.forEach(chat => {
        const li = createChatLi(chat.message, chat.role === "user" ? "outgoing" : "incoming");
        chatbox.appendChild(li);
        
        // Re-attach event cho nút Khám phá (vì onclick bị mất khi lưu string HTML)
        if (chat.role === "bot") {
            const btn = li.querySelector('.explore-results-btn');
            if (btn) {
                btn.onclick = () => {
                    window.location.href = 'explore.html?from=chatbot';
                };
            }
        }
    });
    chatbox.scrollTo(0, chatbox.scrollHeight);
}

// ============================================
// 3. LOGIC CHATBOT
// ============================================

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat-message", className);
    
    let chatContent;
    if (className === "outgoing") {
        chatContent = `<div class="message-content"><p>${message}</p></div>`;
    } else {
        chatContent = `
            <img src="${BOT_ICON_URL}" alt="bot-icon" class="bot-icon">
            <div class="message-content">${message}</div>
        `;
    }
    chatLi.innerHTML = chatContent;
    return chatLi;
}

const generateResponse = async (chatElement) => {
    const messageElement = chatElement.querySelector(".message-content");

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: userMessage,
                sessionId: sessionId
            }),
        });

        if (!response.ok) throw new Error(`Lỗi mạng: ${response.status}`);

        const data = await response.json();
        
        let botReplyText;
        if (typeof data.reply === 'string') {
            botReplyText = data.reply;
        } else if (data.reply && data.reply.text) {
            botReplyText = data.reply.text;
        } else if (data.text) {
            botReplyText = data.text;
        } else {
            botReplyText = data.reply || 'Xin lỗi, tôi không hiểu câu hỏi của bạn.';
        }
        
        // Xử lý Search Results để hiện nút
        const searchResults = data.searchResults || (data.reply && data.reply.searchResults);
        if (searchResults && searchResults.length > 0) {
            // Lưu ngay lập tức khi nhận response
            sessionStorage.setItem('chatbotSearchResults', JSON.stringify({
                hotels: searchResults,
                criteria: data.searchCriteria || (data.reply && data.reply.searchCriteria) || {},
                timestamp: Date.now()
            }));
            console.log(`💾 Saved ${searchResults.length} hotels to sessionStorage`);
        }

        // Parse markdown
        let finalHtml = parseMarkdownLinks(botReplyText);

        messageElement.innerHTML = finalHtml;
        
        // Style links
        messageElement.querySelectorAll('a').forEach(link => {
            link.style.color = '#2196F3';
            link.style.textDecoration = 'underline';
            link.style.fontWeight = '600';
        });
        
        // Thêm nút "Xem trong trang Khám Phá"
        if (searchResults && searchResults.length > 0) {
            const exploreBtn = document.createElement('button');
            exploreBtn.className = 'explore-results-btn';
            exploreBtn.innerHTML = `🔍 Xem ${searchResults.length} kết quả trong trang Khám Phá`;
            exploreBtn.style.cssText = `
                margin-top: 12px;
                padding: 12px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                display: block;
                width: 100%;
                transition: transform 0.2s;
            `;
            
            // Logic Click trực tiếp
            exploreBtn.onclick = () => {
                // Save lại lần nữa cho chắc
                sessionStorage.setItem('chatbotSearchResults', JSON.stringify({
                    hotels: searchResults,
                    criteria: data.searchCriteria || {},
                    timestamp: Date.now()
                }));
                window.location.href = 'explore.html?from=chatbot';
            };
            
            messageElement.appendChild(exploreBtn);
        }
        
        // Lưu tin nhắn Bot vào lịch sử (bao gồm cả HTML của nút)
        saveMessageToHistory(messageElement.innerHTML, "bot");

    } catch (error) {
        console.error('❌ Client error:', error);
        messageElement.textContent = "Xin lỗi, không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
        messageElement.style.color = "#cc0000";
    } finally {
        chatbox.scrollTo(0, chatbox.scrollHeight);
    }
}

const handleChat = () => {
    userMessage = chatInput.value.trim();
    if(!userMessage) return;

    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
    saveMessageToHistory(userMessage, "user");

    const incomingChatLi = createChatLi(`<p>Typing...</p>`, "incoming");
    chatbox.appendChild(incomingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);

    generateResponse(incomingChatLi);
}

// Event Listeners
chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

// [FIX QUAN TRỌNG] Chặn Enter khi đang gõ tiếng Việt (Telex/VNI)
chatInput.addEventListener("keydown", (e) => {
    // !e.isComposing chặn việc gửi khi đang chọn từ gợi ý hoặc gõ dấu
    if(e.key === "Enter" && !e.shiftKey && window.innerWidth > 800 && !e.isComposing) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));

// Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadChatHistory);
} else {
    loadChatHistory();
}
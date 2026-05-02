let mode = 'adult';

function enterApp() {
    const ageInput = document.getElementById('ageInput');
    const age = parseInt(ageInput.value || 0);
    
    if (age <= 0) {
        alert("Mohon masukkan usia yang valid.");
        return;
    }

    mode = (age < 13) ? 'child' : 'adult';
    document.getElementById('ageScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    
    const badge = document.getElementById('modeBadge');
    badge.innerText = mode === 'child' ? 'ANAK-ANAK' : 'DEWASA';
    badge.style.color = mode === 'child' ? '#0ea5e9' : '#064e3b';
}

function handleKeyPress(e) {
    if (e.key === 'Enter') {
        sendMsg();
    }
}

function addBubble(content, who, isRaw = false) {
    const chatArea = document.getElementById('chatArea');
    const bubble = document.createElement('div');
    bubble.className = `bubble ${who}`;
    
    if (isRaw) {
        bubble.innerHTML = content;
    } else {
        bubble.innerText = content;
    }
    
    chatArea.appendChild(bubble);
    chatArea.scrollTop = chatArea.scrollHeight;
    return bubble;
}

function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'bubble bot loading-bubble';
    loader.innerHTML = `
        <div class="typing">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    document.getElementById('chatArea').appendChild(loader);
    document.getElementById('chatArea').scrollTop = document.getElementById('chatArea').scrollHeight;
    return loader;
}

async function sendMsg() {
    const input = document.getElementById('msgInput');
    const msg = input.value.trim();
    
    if (!msg) return;
    
    addBubble(msg, 'user');
    input.value = '';
    
    const loader = showLoading();
    
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, mode: mode })
        });
        
        const data = await response.json();
        loader.remove();
        
        const reply = data.reply || data.message || "Maaf, saya tidak mendapatkan jawaban.";
        const formattedReply = formatAIResponse(reply);
        addBubble(formattedReply, 'bot', true);
        
    } catch (error) {
        console.error("Error:", error);
        loader.remove();
        addBubble("Maaf, terjadi gangguan koneksi. Silakan coba lagi.", 'bot');
    }
}

/**
 * Formats AI response into a structured Doa card.
 * Handles numbered format: 1. Title, 2. Arabic, 3. Latin, 4. Meaning, 5. Notes
 */
function formatAIResponse(text) {
    const lines = text.split('\n').filter(l => l.trim() !== '');

    if (lines.length < 3) {
        return `<div class="doa-card">${escapeAndBreak(text)}</div>`;
    }

    let html = '<div class="doa-card">';

    lines.forEach(line => {
        // Strip numbered prefix (e.g. "1. ", "2. ") first
        const stripped = line.replace(/^\d+\.\s*/, '');
        // Remove common label prefixes the AI might add
        const noLabel = stripped
            .replace(/^(Judul\s*(Doa)?|Teks Arab|Pelafalan Latin|Latin|Arti(\s*dalam\s*Bahasa\s*Indonesia)?|Artinya|Penjelasan\s*singkat(\s*\(Opsional\))?|Saran\s*singkat)\s*[:：]\s*/i, '');

        // Determine type
        if (/^\d+\./.test(line) && /^1\./.test(line)) {
            // Title line
            html += `<div class="doa-title">${noLabel || stripped}</div>`;
        } else if (isArabicOnly(stripped) || isArabicOnly(noLabel)) {
            // Pure Arabic text
            const arabicText = extractArabic(stripped) || stripped;
            html += `<div class="arabic">${arabicText}</div>`;
        } else if (/^\d+\./.test(line)) {
            const num = parseInt(line);
            if (num === 2) {
                // Arabic section — extract only the Arabic part
                const arab = extractArabic(stripped);
                if (arab) {
                    html += `<div class="arabic">${arab}</div>`;
                } else {
                    html += `<p>${stripped}</p>`;
                }
            } else if (num === 3) {
                html += `<div class="doa-latin">${noLabel || stripped}</div>`;
            } else if (num === 4) {
                html += `<div class="doa-meaning"><strong>Artinya:</strong> ${noLabel || stripped}</div>`;
            } else if (num === 5) {
                html += `<div class="doa-note">${noLabel || stripped}</div>`;
            } else {
                html += `<p>${stripped}</p>`;
            }
        } else if (/[\u0600-\u06FF]/.test(line) && countArabicRatio(line) > 0.5) {
            // Mostly Arabic line not inside a numbered list
            html += `<div class="arabic">${extractArabic(line) || line}</div>`;
        } else {
            html += `<p>${line}</p>`;
        }
    });

    html += '</div>';
    return html;
}

/** Check if a string is predominantly Arabic characters */
function isArabicOnly(str) {
    if (!str) return false;
    const cleaned = str.replace(/[\s\d.,،:!؟?'"()-]/g, '');
    if (cleaned.length === 0) return false;
    const arabicCount = (cleaned.match(/[\u0600-\u06FF]/g) || []).length;
    return arabicCount / cleaned.length > 0.8;
}

/** Get ratio of Arabic characters in a string */
function countArabicRatio(str) {
    const cleaned = str.replace(/\s/g, '');
    if (cleaned.length === 0) return 0;
    const arabicCount = (cleaned.match(/[\u0600-\u06FF]/g) || []).length;
    return arabicCount / cleaned.length;
}

/** Extract only Arabic text from a mixed line */
function extractArabic(str) {
    const match = str.match(/([\u0600-\u06FF][\u0600-\u06FF\s،,.؛:'"()\d]*[\u0600-\u06FF])/);
    return match ? match[1].trim() : null;
}

/** Escape HTML and convert newlines to <br> */
function escapeAndBreak(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}
// **********************************************
// 1. მონაცემების შეგროვება
// **********************************************
function collectBrowserData() {
    return {
        user_agent: navigator.userAgent,
        resolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas_hash: generateCanvasFingerprint()
    };
}

// **********************************************
// 2. კანვასის ფინგერპრინტის გენერირება
// **********************************************
function generateCanvasFingerprint() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    // რთული ნახატი, რომელიც უნიკალურ ჰეშს ქმნის
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Test String for Unique Fingerprint 123", 2, 15);
    
    return canvas.toDataURL();
}

// **********************************************
// 3. სერვერთან კომუნიკაცია და ჩვენება
// **********************************************
async function fetchDataAndDisplay() {
    const browserData = collectBrowserData();

    try {
        // მონაცემების გაგზავნა სერვერზე (server.py)
        const response = await fetch('/api/get-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(browserData)
        });

        const data = await response.json();
        const current = data.current_visit;
        const history = data.history;

        // აჩვენეთ მიმდინარე მონაცემები
        document.getElementById('public_ip').textContent = current.public_ip;
        document.getElementById('geolocation').textContent = 
            `ქვეყანა: ${current.geolocation.country || 'N/A'}, ISP: ${current.geolocation.isp || 'N/A'}, ქალაქი: ${current.geolocation.city || 'N/A'}`;
        document.getElementById('user_agent').textContent = current.user_agent;
        document.getElementById('resolution').textContent = current.resolution;
        document.getElementById('language').textContent = current.language;
        document.getElementById('timezone').textContent = current.timezone;
        document.getElementById('canvas_hash').textContent = current.canvas_hash.substring(0, 80) + '...';

        // აჩვენეთ ისტორია
        displayHistory(history);

    } catch (error) {
        console.error("Error communicating with server:", error);
        document.getElementById('public_ip').textContent = 'შეცდომა: ვერ დაუკავშირდა სერვერს.';
    }
}

// **********************************************
// 4. ისტორიის ჩვენება და შედარება
// **********************************************
function displayHistory(history) {
    const historyElement = document.getElementById('history_log');
    if (!historyElement) return;

    let html = '<h2>ჩანაწერების ისტორია</h2>';
    
    history.forEach((item, index) => {
        // შეადარეთ IP და ჰეში წინა ჩანაწერს (თუ არსებობს)
        const isSameIP = (index > 0 && item.public_ip === history[index - 1].public_ip) ? '' : ' <span class="mismatch">(IP შეიცვალა!)</span>';
        const isSameHash = (index > 0 && item.canvas_hash === history[index - 1].canvas_hash) ? '' : ' <span class="mismatch">(ჰეში შეიცვალა!)</span>';

        html += `
            <div class="history-item">
                <strong>№${index + 1} (${item.timestamp}):</strong><br>
                IP: ${item.public_ip} ${isSameIP}<br>
                ქვეყანა: ${item.geolocation.country}<br>
                კანვასის ჰეში: ${item.canvas_hash.substring(0, 20)}... ${isSameHash}
            </div>
        `;
    });
    
    historyElement.innerHTML = html;
}

// **********************************************
// 5. გაშვება
// **********************************************
document.addEventListener('DOMContentLoaded', fetchDataAndDisplay);
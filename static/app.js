// 1. ჰეშირების ფუნქცია (SHA-256)
async function hashString(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 2. აუდიო ფინგერპრინტი
async function getAudioFingerprint() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const analyser = audioCtx.createAnalyser();
        const gain = audioCtx.createGain();
        gain.gain.value = 0;
        oscillator.connect(analyser);
        analyser.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.start(0);
        const data = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(data);
        oscillator.stop();
        return data.slice(0, 10).join('');
    } catch (e) { return "Blocked"; }
}

// 3. კანვასის მონაცემების გენერაცია (აქ იყო შეცდომა სახელში)
function generateCanvasRawData() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillText("Fingerprint-Test-123", 2, 2);
    return canvas.toDataURL();
}

// 4. ელემენტის სტატუსი
async function getBattery() {
    try {
        const b = await navigator.getBattery();
        return `${Math.round(b.level * 100)}% (${b.charging ? 'იტენება' : 'არა'})`;
    } catch(e) { return "N/A"; }
}

// 5. ინტერფეისის განახლება
function updateUI(record, isArchive = false) {
    document.getElementById('display_title').textContent = isArchive ? `📜 არქივი: ${record.timestamp}` : "📍 მიმდინარე ვიზიტი";
    document.getElementById('main_display').className = isArchive ? "card archive-active" : "card";
    
    document.getElementById('public_ip').textContent = record.public_ip || "N/A";
    document.getElementById('geolocation').textContent = `${record.country || 'N/A'}, ${record.isp || ''}`;
    document.getElementById('cpu_cores').textContent = record.cpu_cores || "0";
    document.getElementById('ram').textContent = record.ram || "8 GB+";
    document.getElementById('battery').textContent = record.battery || "N/A";
    document.getElementById('resolution').textContent = record.resolution || "N/A";
    document.getElementById('dark_mode').textContent = record.dark_mode || "N/A";
    document.getElementById('audio_hash').textContent = (record.audio_hash || "N/A").substring(0, 15) + "...";
    document.getElementById('canvas_hash').textContent = (record.canvas_hash || "N/A").substring(0, 15) + "...";
    document.getElementById('system_id').textContent = (record.system_id || "N/A").substring(0, 20) + "...";
}

// 6. DNS Leak ტესტი
async function runDNSLeakTest() {
    try {
        const res = await fetch('https://edns.ip-api.com/json');
        const data = await res.json();
        document.getElementById('dns_results').innerHTML = `ნაპოვნია რეზოლვერი: <b style="color:red">${data.dns.ip}</b> (${data.dns.geo})`;
    } catch (e) { document.getElementById('dns_results').textContent = "DNS ტესტი ვერ მოხერხდა"; }
}

// 7. მთავარი ფუნქცია (მონაცემების შეგროვება და გაგზავნა)
async function fetchData() {
    const audioRaw = await getAudioFingerprint();
    const canvasRaw = generateCanvasRawData();
    const battery = await getBattery();
    const ram = navigator.deviceMemory ? navigator.deviceMemory + " GB" : "8 GB+";
    const resSize = `${window.screen.width}x${window.screen.height}`;
    
    // ჰეშების გენერაცია
    const canvasHash = await hashString(canvasRaw);
    const audioHash = await hashString(audioRaw);
    const systemId = await hashString(canvasHash + audioHash + ram + resSize);

    const browserData = {
        timestamp: new Date().toLocaleString('ka-GE'),
        cpu_cores: navigator.hardwareConcurrency || 0,
        ram: ram,
        battery: battery,
        resolution: resSize,
        dark_mode: window.matchMedia('(prefers-color-scheme: dark)').matches ? "ჩართულია" : "გამორთულია",
        canvas_hash: canvasHash,
        audio_hash: audioHash,
        system_id: systemId
    };

    try {
        const response = await fetch('/api/get-data', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(browserData)
        });
        
        const data = await response.json();
        updateUI(data.current_visit);
        
        // ისტორიის შევსება
        const log = document.getElementById('history_log');
        log.innerHTML = "";
        data.history.forEach(item => {
            const div = document.createElement('div');
            div.className = "history-item";
            div.onclick = () => updateUI(item, true);
            div.innerHTML = `<strong>${item.timestamp}</strong><small>${item.public_ip}</small>`;
            log.appendChild(div);
        });
    } catch (error) {
        console.error("სერვერთან კავშირის შეცდომა:", error);
    }
    runDNSLeakTest();
}

document.addEventListener('DOMContentLoaded', fetchData);
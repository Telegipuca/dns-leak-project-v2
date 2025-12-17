async function hashString(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
        return btoa(data.slice(0, 5).join('')).substring(0, 12);
    } catch (e) { return "Blocked"; }
}

function updateUI(record, isArchive = false) {
    document.getElementById('display_title').textContent = isArchive ? `📜 არქივი: ${record.timestamp}` : "📍 მიმდინარე ვიზიტი";
    document.getElementById('main_display').className = isArchive ? "card archive-active" : "card";
    
    document.getElementById('public_ip').textContent = record.public_ip;
    document.getElementById('geolocation').textContent = `${record.country || 'N/A'}, ${record.isp || ''}`;
    document.getElementById('cpu_cores').textContent = record.cpu_cores;
    document.getElementById('ram').textContent = record.ram || "8 GB+";
    document.getElementById('battery').textContent = record.battery || "N/A";
    document.getElementById('dark_mode').textContent = record.dark_mode || "N/A";
    document.getElementById('audio_hash').textContent = record.audio_hash || "N/A";
    document.getElementById('canvas_hash').textContent = (record.canvas_hash || "").substring(0, 20) + "...";
}

async function fetchData() {
    const audioRaw = await getAudioFingerprint(); // ნედლი მონაცემი
    const canvasRaw = generateCanvasRawData(); // სრული კანვას კოდი
    const specs = await getAdvancedSpecs();

    // ვქმნით ერთიან სტრიქონს ყველა მონაცემისგან
    const combinedData = audioRaw + canvasRaw + specs.ram + specs.cpu + specs.resolution;
    
    // ვაგენერირებთ უნიკალურ ჰეშს
    const systemID = await hashString(combinedData);
    const canvasHash = await hashString(canvasRaw);
    const audioHash = await hashString(audioRaw);

    const browserData = {
        system_id: systemID, // ეს არის მომხმარებლის მთავარი "სახე"
        canvas_hash: canvasHash,
        audio_hash: audioHash,
        // ... დანარჩენი მონაცემები
    };

    // UI-ში გამოჩნდება მხოლოდ ლამაზი, უნიკალური კოდები
    document.getElementById('system_id').textContent = systemID;
    document.getElementById('canvas_hash').textContent = canvasHash;
    document.getElementById('audio_hash').textContent = audioHash;
    
    // ... გაგზავნა სერვერზე
}

document.addEventListener('DOMContentLoaded', fetchData);
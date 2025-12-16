async function getAdvancedSpecs() {
    let batteryInfo = "N/A";
    try {
        const battery = await navigator.getBattery();
        batteryInfo = `${Math.round(battery.level * 100)}% (${battery.charging ? 'იტენება' : 'არ იტენება'})`;
    } catch (e) {}

    return {
        ram: navigator.deviceMemory ? navigator.deviceMemory + " GB" : "N/A",
        battery: batteryInfo,
        platform: navigator.platform,
        touch: navigator.maxTouchPoints > 0 ? "დიახ" : "არა",
        dark_mode: window.matchMedia('(prefers-color-scheme: dark)').matches ? "ჩართულია" : "გამორთულია"
    };
}

async function getLocalIP() {
    return new Promise((resolve) => {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel("");
        pc.createOffer().then(pc.setLocalDescription.bind(pc));
        pc.onicecandidate = (ice) => {
            if (!ice || !ice.candidate) return;
            const ip = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate);
            if(ip) { resolve(ip[1]); pc.onicecandidate = null; }
        };
        setTimeout(() => resolve("N/A"), 2000);
    });
}

async function fetchDataAndDisplay() {
    const specs = await getAdvancedSpecs();
    const local_ip = await getLocalIP();
    
    const browserData = {
        timestamp: new Date().toLocaleString('ka-GE'),
        user_agent: navigator.userAgent,
        resolution: `${window.screen.width}x${window.screen.height}`,
        cpu_cores: navigator.hardwareConcurrency || 0,
        local_ip: local_ip,
        canvas_hash: (() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.fillText("LeakTest", 10, 10);
            return canvas.toDataURL().substring(0, 40);
        })(),
        // დამატებითი specs
        ram: specs.ram,
        battery: specs.battery,
        dark_mode: specs.dark_mode
    };

    const response = await fetch('/api/get-data', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(browserData)
    });

    const data = await response.json();
    
    // UI-ს განახლება
    document.getElementById('public_ip').textContent = data.current_visit.public_ip;
    document.getElementById('local_ip').textContent = data.current_visit.local_ip;
    document.getElementById('geolocation').textContent = `${data.current_visit.country}, ${data.current_visit.isp}`;
    document.getElementById('cpu_cores').textContent = data.current_visit.cpu_cores;
    document.getElementById('ram').textContent = specs.ram;
    document.getElementById('battery').textContent = specs.battery;
    document.getElementById('dark_mode').textContent = specs.dark_mode;
    document.getElementById('resolution').textContent = data.current_visit.resolution;
    
    // ისტორიის გამოჩენა
    const historyLog = document.getElementById('history_log');
    historyLog.innerHTML = "";
    data.history.forEach(item => {
        historyLog.innerHTML += `<div class="history-item">
            <strong>${item.timestamp}</strong> - IP: ${item.public_ip} (${item.country})
        </div>`;
    });
}

document.addEventListener('DOMContentLoaded', fetchDataAndDisplay);
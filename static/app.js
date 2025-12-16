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
        setTimeout(() => resolve("N/A"), 1500);
    });
}

async function fetchDataAndDisplay() {
    const local_ip = await getLocalIP();
    
    const browserData = {
        timestamp: new Date().toLocaleString(),
        user_agent: navigator.userAgent,
        resolution: `${window.screen.width}x${window.screen.height}`,
        cpu_cores: navigator.hardwareConcurrency || 0,
        local_ip: local_ip,
        canvas_hash: (() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.fillText("Fingerprint", 10, 10);
            return canvas.toDataURL().substring(0, 50);
        })()
    };

    const response = await fetch('/api/get-data', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(browserData)
    });

    const data = await response.json();
    updateUI(data);
}

function updateUI(data) {
    const current = data.current_visit;
    document.getElementById('public_ip').textContent = current.public_ip;
    document.getElementById('local_ip').textContent = current.local_ip;
    document.getElementById('cpu_cores').textContent = current.cpu_cores;
    // ... დანარჩენი UI განახლება
}
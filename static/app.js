async function getAdvancedSpecs() {
    let batteryInfo = "N/A";
    try {
        const battery = await navigator.getBattery();
        batteryInfo = `${Math.round(battery.level * 100)}% (${battery.charging ? 'იტენება' : 'არ იტენება'})`;
    } catch (e) {}

    return {
        ram: navigator.deviceMemory ? navigator.deviceMemory + " GB+" : "8 GB+",
        battery: batteryInfo,
        dark_mode: window.matchMedia('(prefers-color-scheme: dark)').matches ? "ჩართულია" : "გამორთულია"
    };
}

// ახალი მეთოდი DNS ტესტისთვის (გარე API-ს გამოყენებით)
async function runDNSLeakTest() {
    const dnsContainer = document.getElementById('dns_results');
    try {
        // ვიყენებთ Cloudflare-ის ან სხვა გარე სერვისის API-ს რეალური DNS-ის დასანახად
        const res = await fetch('https://edns.ip-api.com/json');
        const data = await res.json();
        dnsContainer.innerHTML = `ნაპოვნია DNS რეზოლვერი: <b style="color:red">${data.dns.ip}</b> (${data.dns.geo})`;
    } catch (e) {
        dnsContainer.innerHTML = "DNS ტესტირება ვერ მოხერხდა.";
    }
}

async function fetchDataAndDisplay() {
    const specs = await getAdvancedSpecs();
    
    // კანვასის ჰეშის ხელახალი გენერაცია
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillText("Fingerprint-Test-123", 2, 2);
    const cHash = canvas.toDataURL().substring(0, 30);

    const browserData = {
        timestamp: new Date().toLocaleString('ka-GE'),
        user_agent: navigator.userAgent,
        resolution: `${window.screen.width}x${window.screen.height}`,
        cpu_cores: navigator.hardwareConcurrency || 0,
        local_ip: "ბლოკირებულია ბრაუზერის მიერ",
        canvas_hash: cHash,
        ram: specs.ram,
        battery: specs.battery,
        dark_mode: specs.dark_mode
    };

    // მონაცემების გაგზავნა სერვერზე (Supabase-ში შესანახად)
    const response = await fetch('/api/get-data', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(browserData)
    });

    const data = await response.json();
    
    // UI განახლება
    document.getElementById('public_ip').textContent = data.current_visit.public_ip;
    document.getElementById('geolocation').textContent = `${data.current_visit.country}, ${data.current_visit.isp}`;
    document.getElementById('cpu_cores').textContent = data.current_visit.cpu_cores;
    document.getElementById('ram').textContent = specs.ram;
    document.getElementById('battery').textContent = specs.battery;
    document.getElementById('dark_mode').textContent = specs.dark_mode;
    document.getElementById('resolution').textContent = browserData.resolution;
    document.getElementById('canvas_hash').textContent = cHash + "...";

    // ისტორიის განახლება
    const historyLog = document.getElementById('history_log');
    historyLog.innerHTML = "";
    data.history.forEach(item => {
        historyLog.innerHTML += `<div class="history-item">
            <strong>${item.timestamp}</strong> - ${item.public_ip}
        </div>`;
    });

    runDNSLeakTest();
}

document.addEventListener('DOMContentLoaded', fetchDataAndDisplay);
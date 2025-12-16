async function checkDNSLeak() {
    const dnsContainer = document.getElementById('dns_results');
    try {
        const response = await fetch('/api/dns-check');
        const data = await response.json();
        
        dnsContainer.innerHTML = `
            <div style="background: #e7f3ff; padding: 15px; border-left: 5px solid #2196F3; margin-top: 10px;">
                <strong>ნაპოვნია DNS რეზოლვერი:</strong> ${data.dns_resolver_ip} <br>
                <small>თუ ეს IP თქვენი პროვაიდერისაა (მაგ. Silknet/Magti) და ჩართული გაქვთ VPN, მაშინ გაქვთ გაჟონვა!</small>
            </div>
        `;
    } catch (e) {
        dnsContainer.innerHTML = "DNS ტესტის ჩატვირთვა ვერ მოხერხდა.";
    }
}

async function fetchDataAndDisplay() {
    const browserData = {
        user_agent: navigator.userAgent,
        resolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas_hash: (() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.fillText("LeakTest", 10, 10);
            return canvas.toDataURL();
        })()
    };

    try {
        const response = await fetch('/api/get-data', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(browserData)
        });

        const data = await response.json();
        const current = data.current_visit;

        document.getElementById('public_ip').textContent = current.public_ip;
        document.getElementById('geolocation').textContent = `${current.geolocation.country}, ${current.geolocation.isp}`;
        document.getElementById('user_agent').textContent = current.user_agent;
        document.getElementById('resolution').textContent = current.resolution;
        document.getElementById('language').textContent = current.language;
        document.getElementById('timezone').textContent = current.timezone;
        document.getElementById('canvas_hash').textContent = current.canvas_hash.substring(0, 50) + "...";

        checkDNSLeak(); // DNS ტესტის გამოძახება
    } catch (error) { console.error(error); }
}

document.addEventListener('DOMContentLoaded', fetchDataAndDisplay);
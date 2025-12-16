from flask import Flask, render_template, request, jsonify
import json
import os
import requests
from datetime import datetime

app = Flask(__name__)

HISTORY_FILE = 'history.json'

def load_history():
    if not os.path.exists(HISTORY_FILE): return []
    try:
        with open(HISTORY_FILE, 'r') as f: return json.load(f)
    except: return []

def save_history(history):
    with open(HISTORY_FILE, 'w') as f: json.dump(history, f, indent=4)

def get_clean_ip():
    """გამოყოფს მხოლოდ რეალურ საჯარო IP-ს ჯაჭვიდან"""
    ip_data = request.headers.get('X-Forwarded-For', request.remote_addr)
    # ვიღებთ პირველ IP-ს სიიდან (ეს არის კლიენტის რეალური IP)
    return ip_data.split(',')[0].strip()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/dns-check')
def dns_check():
    """აბრუნებს იმ IP-ს, რომელიც აკეთებს მოთხოვნას (DNS Resolver)"""
    return jsonify({"dns_resolver_ip": request.remote_addr})

@app.route('/api/get-data', methods=['POST'])
def get_data():
    client_ip = get_clean_ip()
    
    # გეოლოკაციის მოპოვება გასუფთავებული IP-ით
    geo_data = {}
    try:
        geo_response = requests.get(f'http://ip-api.com/json/{client_ip}')
        if geo_response.status_code == 200:
            geo_data = geo_response.json()
    except: pass
        
    current_data = request.json
    current_data['timestamp'] = datetime.now().strftime("%H:%M:%S")
    current_data['public_ip'] = client_ip
    current_data['geolocation'] = {
        'country': geo_data.get('country', 'N/A'),
        'isp': geo_data.get('isp', 'N/A'),
        'city': geo_data.get('city', 'N/A')
    }
    
    history = load_history()
    history.insert(0, current_data)
    save_history(history[:20])
    
    return jsonify({'current_visit': current_data, 'history': history})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
from flask import Flask, render_template, request, jsonify
import json
import os
import requests
from datetime import datetime

app = Flask(__name__)

# მონაცემთა ბაზის ფაილი
HISTORY_FILE = 'history.json'

def load_history():
    """ისტორიის ჩატვირთვა JSON ფაილიდან"""
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_history(history):
    """ისტორიის შენახვა JSON ფაილში"""
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=4)

@app.route('/')
def index():
    """მთავარი გვერდის ჩვენება"""
    return render_template('index.html')

@app.route('/api/get-data', methods=['POST'])
def get_data():
    """IP, გეოლოკაციის და ისტორიის შენახვა/დაბრუნება."""
    
    # Render-ის შემთხვევაში, IP მისამართი მოდის X-Forwarded-For ჰედერიდან
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    
    # 1. გეოლოკაციის მონაცემების მოპოვება
    geo_data = {}
    try:
        geo_response = requests.get(f'http://ip-api.com/json/{client_ip}')
        if geo_response.status_code == 200:
            geo_data = geo_response.json()
    except Exception:
        pass
        
    # 2. მონაცემთა ობიექტის შექმნა
    current_data = request.json
    current_data['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_data['public_ip'] = client_ip
    current_data['geolocation'] = {
        'country': geo_data.get('country', 'N/A'),
        'isp': geo_data.get('isp', 'N/A'),
        'city': geo_data.get('city', 'N/A')
    }
    
    # 3. ისტორიის შენახვა
    history = load_history()
    history.insert(0, current_data) 
    if len(history) > 20:
        history.pop() 
    save_history(history)
    
    # 4. Front-end-ისთვის მონაცემების დაბრუნება
    return jsonify({
        'current_visit': current_data,
        'history': history
    })

if __name__ == '__main__':
    # Render-ისთვის აუცილებელია პორტის დინამიური აღება
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
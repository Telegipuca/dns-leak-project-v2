from flask import Flask, render_template, request, jsonify
import os
import requests
from supabase import create_client, Client

app = Flask(__name__)

# Supabase კონფიგურაცია - ჩაწერეთ თქვენი მონაცემები
SUPABASE_URL = "https://dtuvcmjbcrlzhoplaxmj.supabase.co"
SUPABASE_KEY = "sb_secret_sbJ0YYAr0_Zml1cOFtUJ9w_3pdB0gYE"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_clean_ip():
    ip_data = request.headers.get('X-Forwarded-For', request.remote_addr)
    return ip_data.split(',')[0].strip()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/get-data', methods=['POST'])
def get_data():
    client_ip = get_clean_ip()
    geo_data = {}
    try:
        geo_response = requests.get(f'http://ip-api.com/json/{client_ip}')
        geo_data = geo_response.json() if geo_response.status_code == 200 else {}
    except: pass
        
    data = request.json
    log_entry = {
        "timestamp": data.get('timestamp'),
        "public_ip": client_ip,
        "country": geo_data.get('country', 'N/A'),
        "isp": geo_data.get('isp', 'N/A'),
        "cpu_cores": int(data.get('cpu_cores', 0)),
        "ram": data.get('ram'),
        "battery": data.get('battery'),
        "resolution": data.get('resolution'),
        "dark_mode": data.get('dark_mode'),
        "canvas_hash": data.get('canvas_hash'),
        "audio_hash": data.get('audio_hash'),
        "system_id": data.get('system_id')
    }
    
    try:
        supabase.table("visitor_logs").insert(log_entry).execute()
    except Exception as e:
        print(f"Supabase Error: {e}")

    history = supabase.table("visitor_logs").select("*").order("id", desc=True).limit(50).execute()
    return jsonify({'current_visit': log_entry, 'history': history.data})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
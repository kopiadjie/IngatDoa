# app.py

from flask import Flask, render_template, request, jsonify
import os, requests
from dotenv import load_dotenv
load_dotenv()
app = Flask(__name__)
API_URL=os.getenv('API_URL','')
TOKEN=os.getenv('TOKEN','')
MODEL=os.getenv('MODEL','')
SYSTEM_PROMPT = """Anda adalah asisten doa harian agama Islam yang akurat. 
Tugas Anda adalah memberikan doa yang relevan berdasarkan aktivitas atau kondisi pengguna.

Setiap jawaban HARUS mengikuti format berikut secara ketat:
1. Judul Doa
2. Teks Arab (menggunakan harakat yang benar)
3. Pelafalan Latin
4. Arti dalam Bahasa Indonesia
5. (Opsional) Penjelasan singkat atau adab terkait.

Gunakan bahasa yang sopan dan menenangkan. Jika aktivitas tidak memiliki doa spesifik, berikan dzikir umum atau nasihat yang baik."""

@app.route('/')
def home():
    return render_template('index.html')
@app.route('/chat', methods=['POST'])
def chat():
    data=request.get_json()
    msg=data.get('message','')
    mode=data.get('mode','adult')
    # Use OpenAI-compatible format if it's Sumopod/OpenAI
    openai_url = f"{API_URL.rstrip('/')}/v1/chat/completions"
    payload = {
        'model': MODEL,
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': msg}
        ],
        'temperature': 0.7
    }
    
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json'
    }
    
    try:
        r = requests.post(openai_url, json=payload, headers=headers, timeout=30)
        if r.status_code != 200:
            print(f"API Error: {r.status_code} - {r.text}")
        r.raise_for_status()
        
        res_data = r.json()
        reply = res_data['choices'][0]['message']['content']
        return jsonify({'reply': reply})
        
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}")
        return jsonify({'reply': 'Gagal menghubungi AI API. Silakan coba lagi nanti.'})
    except (KeyError, IndexError) as e:
        print(f"Parsing Error: {e}")
        return jsonify({'reply': 'Gagal memproses jawaban AI.'})
    except Exception as e:
        print(f"General Error: {e}")
        return jsonify({'reply': 'Terjadi kesalahan sistem.'})



if __name__=='__main__':
    app.run(debug=True)



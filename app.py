from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json
import os

app = Flask(__name__)

# Arquivo para armazenar as transações
DATA_FILE = 'transactions.json'

def load_transactions():
    """Carrega as transações do arquivo JSON"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_transactions(transactions):
    """Salva as transações no arquivo JSON"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(transactions, f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Retorna todas as transações"""
    transactions = load_transactions()
    return jsonify(transactions)

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Adiciona uma nova transação"""
    data = request.json
    transactions = load_transactions()
    
    new_transaction = {
        'id': str(int(datetime.now().timestamp() * 1000)),
        'description': data['description'],
        'amount': float(data['amount']),
        'type': data['type'],
        'date': data['date']
    }
    
    transactions.append(new_transaction)
    save_transactions(transactions)
    
    return jsonify(new_transaction), 201

@app.route('/api/transactions/<transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Remove uma transação"""
    transactions = load_transactions()
    transactions = [t for t in transactions if t['id'] != transaction_id]
    save_transactions(transactions)
    return jsonify({'success': True})

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Retorna o resumo financeiro"""
    transactions = load_transactions()
    
    total_entrada = sum(t['amount'] for t in transactions if t['type'] == 'entrada')
    total_saida = sum(t['amount'] for t in transactions if t['type'] == 'saida')
    saldo_atual = total_entrada - total_saida
    
    return jsonify({
        'totalEntrada': total_entrada,
        'totalSaida': total_saida,
        'saldoAtual': saldo_atual
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

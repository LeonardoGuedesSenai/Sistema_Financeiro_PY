from flask import Flask, render_template, request, jsonify
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Configuração do banco (arquivo SQLite na raiz do projeto)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ----------------- MODELOS -----------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(10), nullable=False)   # 'entrada' ou 'saida'
    date = db.Column(db.DateTime, nullable=False)

# ----------------- ROTAS PÁGINAS -----------------

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('formulario.html')

# ----------------- ROTAS USUÁRIO (EXEMPLO) -----------------

@app.route('/register', methods=['POST'])
def register():
    email = request.form['email']
    password = request.form['password']
    user = User(email=email, password=password)
    db.session.add(user)
    db.session.commit()
    return 'Usuário criado'

# ----------------- ROTAS API TRANSACOES -----------------

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Retorna todas as transações do banco"""
    transactions = Transaction.query.order_by(Transaction.date.asc()).all()
    result = []
    for t in transactions:
        result.append({
            'id': t.id,
            'description': t.description,
            'amount': t.amount,
            'type': t.type,
            'date': t.date.isoformat()
        })
    return jsonify(result)


@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Adiciona uma nova transação no banco"""
    data = request.json

    new_transaction = Transaction(
        description=data['description'],
        amount=float(data['amount']),
        type=data['type'],
        date=datetime.fromisoformat(data['date'])   # recebe ISO do front
    )

    db.session.add(new_transaction)
    db.session.commit()

    return jsonify({
        'id': new_transaction.id,
        'description': new_transaction.description,
        'amount': new_transaction.amount,
        'type': new_transaction.type,
        'date': new_transaction.date.isoformat()
    }), 201


@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Remove uma transação do banco"""
    transaction = Transaction.query.get_or_404(transaction_id)
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({'success': True})


@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Retorna o resumo financeiro a partir do banco"""
    transactions = Transaction.query.all()

    total_entrada = sum(t.amount for t in transactions if t.type == 'entrada')
    total_saida = sum(t.amount for t in transactions if t.type == 'saida')
    saldo_atual = total_entrada - total_saida

    return jsonify({
        'totalEntrada': total_entrada,
        'totalSaida': total_saida,
        'saldoAtual': saldo_atual
    })

# ----------------- INICIALIZAÇÃO -----------------

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # cria finance.db e tabelas se não existirem
    app.run(debug=True, host='0.0.0.0', port=5000)



from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# chave para sessão (use algo mais seguro em produção)
app.config['SECRET_KEY'] = 'chave-muito-secreta-aqui'

# Configuração do banco
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

# ----------------- HELPERS -----------------

def is_logged_in():
    return 'user_id' in session

# ----------------- ROTAS DE PÁGINA -----------------

@app.route('/')
def login_page():
    # se já estiver logado, manda para home
    if is_logged_in():
        return redirect(url_for('home'))
    return render_template('formulario.html')

@app.route('/home')
def home():
    # protege a home: só entra logado
    if not is_logged_in():
        return redirect(url_for('login_page'))
    return render_template('index.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

# ----------------- AUTENTICAÇÃO -----------------

@app.route('/register', methods=['POST'])
def register():
    """Cadastro de novo usuário a partir do formulário de cadastro"""
    email = request.form.get('Cadastrando_Email')
    password = request.form.get('Cadastrando_Senha')

    if not email or not password:
        return "E-mail e senha são obrigatórios", 400

    # opcional: verificar se já existe
    existing = User.query.filter_by(email=email).first()
    if existing:
        return "E-mail já cadastrado", 400

    user = User(email=email, password=password)
    db.session.add(user)
    db.session.commit()
    return redirect(url_for('login_page'))

@app.route('/login', methods=['POST'])
def login():
    """Login do usuário a partir do formulário de login"""
    email = request.form.get('Email_Valido')
    password = request.form.get('Senha_Valida')

    user = User.query.filter_by(email=email, password=password).first()
    if not user:
        # simples: volta para tela de login (pode adicionar mensagem depois)
        return redirect(url_for('login_page'))

    session['user_id'] = user.id
    session['user_email'] = user.email
    return redirect(url_for('home'))

# ----------------- ROTAS API TRANSACOES -----------------

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Retorna todas as transações do banco"""
    if not is_logged_in():
        return jsonify({'error': 'unauthorized'}), 401

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
    if not is_logged_in():
        return jsonify({'error': 'unauthorized'}), 401

    data = request.json
    new_transaction = Transaction(
        description=data['description'],
        amount=float(data['amount']),
        type=data['type'],
        date=datetime.fromisoformat(data['date'])
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
    if not is_logged_in():
        return jsonify({'error': 'unauthorized'}), 401

    transaction = Transaction.query.get_or_404(transaction_id)
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Retorna o resumo financeiro a partir do banco"""
    if not is_logged_in():
        return jsonify({'error': 'unauthorized'}), 401

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
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)

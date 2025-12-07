from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
from flask_mail import Mail, Message
import secrets
import re
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# chave para sessão (use algo mais seguro em produção)
app.config['SECRET_KEY'] = 'chave-muito-secreta-aqui'

# Configuração do banco
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
# Configuração de Email
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'lucas8ecef20@gmail.com'  # ← Mude para seu email
app.config['MAIL_PASSWORD'] = 'gwft raiz udpo mdzs'  # ← Veja abaixo como gerar
app.config['MAIL_DEFAULT_SENDER'] = 'seu_email@gmail.com'

mail = Mail(app)


# ----------------- MODELOS -----------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    verified = db.Column(db.Boolean, default=False)  # ← Novo
    verification_token = db.Column(db.String(255), unique=True, nullable=True)  # ← Novo



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
def send_verification_email(email, token):
    """Envia email de confirmação"""
    try:
        verification_link = url_for('verify_email', token=token, _external=True)
        
        msg = Message(
            subject='Confirme seu email - Controle de Gastos',
            recipients=[email],
            html=f"""
            <html>
                <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                    <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
                        <h2 style="color: #22c55e;">Bem-vindo ao Controle de Gastos!</h2>
                        <p>Obrigado por se cadastrar. Para ativar sua conta, clique no botão abaixo:</p>
                        <a href="{verification_link}" style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                            Confirmar Email
                        </a>
                        <p>Ou copie e cole este link no seu navegador:</p>
                        <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
                            {verification_link}
                        </p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">
                            Este link expira em 24 horas.
                        </p>
                    </div>
                </body>
            </html>
            """
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        return False

@app.route('/register', methods=['POST'])
def register():
    email = request.form.get('Cadastrando_Email', '').strip()
    password = request.form.get('Cadastrando_Senha', '')
    confirm_password = request.form.get('Confirmando_Senha', '')
    
    errors = []
    
    # Validar campos obrigatórios
    if not email or not password or not confirm_password:
        errors.append('Todos os campos são obrigatórios')
    
    # Validar senhas
    if password != confirm_password:
        errors.append('As senhas não coincidem')
    
    if len(password) < 6:
        errors.append('A senha deve ter pelo menos 6 caracteres')
    
    # Validar formato do email
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        errors.append('Email inválido')
    
    # Verificar se email já existe
    if User.query.filter_by(email=email).first():
        errors.append('Este email já está cadastrado')
    
    # Se há erros, retornar
    if errors:
        for error in errors:
            flash(error, 'error')
        return redirect(url_for('login_page'))
    
    try:
        # Gerar token único
        verification_token = secrets.token_urlsafe(32)
        
        # Criar usuário não verificado
        user = User(
            email=email,
            password=password,
            verified=False,
            verification_token=verification_token
        )
        db.session.add(user)
        db.session.commit()
        
        # Enviar email de confirmação
        send_verification_email(email, verification_token)
        
        flash('Cadastro realizado! Verifique seu email para confirmar.', 'success')
        return redirect(url_for('login_page'))
    
    except Exception as e:
        flash(f'Erro ao cadastrar: {str(e)}', 'error')
        return redirect(url_for('login_page'))

@app.route('/verify/<token>')
def verify_email(token):
    """Verifica o email do usuário"""
    user = User.query.filter_by(verification_token=token).first()
    
    if not user:
        flash('Link de verificação inválido ou expirado', 'error')
        return redirect(url_for('login_page'))
    
    # Marcar como verificado
    user.verified = True
    user.verification_token = None  # Limpar token após uso
    db.session.commit()
    
    flash('Email verificado com sucesso! Você já pode fazer login.', 'success')
    return redirect(url_for('login_page'))

@app.route('/login', methods=['POST'])
def login():
    """Login do usuário"""
    email = request.form.get('Email_Valido')
    password = request.form.get('Senha_Valida')
    
    user = User.query.filter_by(email=email, password=password).first()
    
    if not user:
        flash('Email ou senha incorretos', 'error')
        return redirect(url_for('login_page'))
    
    # Verificar se o email foi confirmado
    if not user.verified:
        flash('Verifique seu email antes de fazer login', 'warning')
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

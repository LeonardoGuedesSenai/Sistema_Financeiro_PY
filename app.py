
from turtle import home
from flask import Flask,render_template,request,redirect
import json


app = Flask(__name__) # coração do site

# CORAÇÃO DO SITE
# ==========================================================
@app.route('/')
def homepage():
    gastos = carregar_gasto()
    total = sum(float(item["Valor"]) for item in gastos)
    return render_template("index.html",gastos_gerais=gastos, total=total)
# ==========================================================






@app.route('/adicionar',methods=['POST'])
def adicionar():
    # Pega os valores do HTML
    # =============================================
    produto = request.form["Produto"]
    valor = request.form["Preco"]
    data = request.form["data"]
    # =============================================

    # Se em alguma das opções estiverem vazia ele dá erro, se não ele salva no arquivo JSON
    # ==========================================================
    if produto != "" and valor != "" and valor.isdigit() == True:
        gastos = carregar_gasto()
        gastos.append({"Produto": produto, 'Valor': valor, "Data": data})
        salvar_gastos(gastos)
        return redirect('/')
    else:
        return homepage()
    # ==========================================================
    





@app.route('/remover', methods=['POST'] )
def remover():
    # Pega o valor do HTML (Posição)
    # =============================================
    posicao = request.form["Produto_remover"]
    # =============================================

    # Se o resultado for 400 (erro/False) ele retorna um erro
    # ==========================================================
    if not posicao.isdigit():
        return homepage()
    # ==========================================================

    
    # CONVERTE PARA NUMERO
    # ==========================================================
    posicao = int(posicao)
    # ==========================================================

    # Carrega o gastos do arquivo JSON
    # ==========================================================
    gastos = carregar_gasto()
    # ==========================================================

    # Se a posição que ele digitou for negativa ou se a posição for maior que a quantidade de posiçoes do dicionario, ele dá erro
    # ==========================================================
    if posicao < 0 or posicao >= len(gastos):
        return homepage()
    # ==========================================================

    # Remove a posição digitada e salva
    # ==========================================================
    gastos.pop(posicao)
    salvar_gastos(gastos)
    return redirect('/')
    # ==========================================================
    




# Carrega o arquivo JSON para usar nas outras funções
# ==========================================================
def carregar_gasto():
    with open('gastos_gerais.json', "r") as f:
        return json.load(f)
# ==========================================================        






# Função para salva informações no arquivo JSON
# ==========================================================
def salvar_gastos(lista):
    with open('gastos_gerais.json',"w") as f:
        json.dump(lista, f ,indent=4)
# ==========================================================


# EXECUTAR SITE
# ===================
if __name__ == "__main__":
    app.run(debug=True)
# ===================

let transactions = []
let financeChart = null
let projectionChart = null

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  loadTransactions()
  setupEventListeners()

  // Define a data atual no campo de data
  document.getElementById("date").valueAsDate = new Date()
})

// Configurar event listeners
function setupEventListeners() {
  document.getElementById("transactionForm").addEventListener("submit", handleAddTransaction)
  document.getElementById("calendarBtn").addEventListener("click", openCalendar)
  document.getElementById("reportBtn").addEventListener("click", openReport)
  document.getElementById("filterEntradas").addEventListener("click", () => filterTransactions("entrada"))
  document.getElementById("filterSaidas").addEventListener("click", () => filterTransactions("saida"))
  document.getElementById("filterTodos").addEventListener("click", () => updateTable(transactions))
}

// Carregar transações do servidor
async function loadTransactions() {
  try {
    const response = await fetch("/api/transactions")
    transactions = await response.json()
    updateUI()
  } catch (error) {
    console.error("Erro ao carregar transações:", error)
  }
}

// Adicionar transação
async function handleAddTransaction(e) {
  e.preventDefault()

  const description = document.getElementById("description").value
  const amount = document.getElementById("amount").value
  const type = document.getElementById("type").value
  const date = document.getElementById("date").value

  if (!description || !amount || !date) return

  const transaction = {
    description,
    amount: Number.parseFloat(amount),
    type,
    date: new Date(date).toISOString(),
  }

  try {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    })

    const newTransaction = await response.json()
    transactions.push(newTransaction)
    updateUI()

    // Limpar formulário
    document.getElementById("transactionForm").reset()
    document.getElementById("date").valueAsDate = new Date()
  } catch (error) {
    console.error("Erro ao adicionar transação:", error)
  }
}

// Atualizar interface
function updateUI() {
  updateSummary()
  updateChart()
  updateTable()
}

// Atualizar resumo
function updateSummary() {
  const totalEntrada = transactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.amount, 0)

  const totalSaida = transactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.amount, 0)

  const saldoAtual = totalEntrada - totalSaida

  document.getElementById("totalEntrada").textContent = formatCurrency(totalEntrada)
  document.getElementById("totalSaida").textContent = formatCurrency(totalSaida)
  document.getElementById("saldoAtual").textContent = formatCurrency(saldoAtual)
}

// Atualizar gráfico
function updateChart() {
  const totalEntrada = transactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.amount, 0)

  const totalSaida = transactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.amount, 0)

  const saldoAtual = totalEntrada - totalSaida

  const ctx = document.getElementById("financeChart")

  if (financeChart) {
    financeChart.destroy()
  }

  financeChart = new window.Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Entradas", "Saídas", "Saldo"],
      datasets: [
        {
          data: [totalEntrada, totalSaida, saldoAtual],
          backgroundColor: ["#16a34a", "#ef4444", "#a855f7"],
          borderRadius: 8,
          barThickness: 60,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1c1c1c",
          titleColor: "#fafafa",
          bodyColor: "#a3a3a3",
          borderColor: "#2d2d2d",
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (context) => formatCurrency(context.parsed.y),
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#2d2d2d" },
          ticks: { color: "#a3a3a3" },
        },
        x: {
          grid: { display: false },
          ticks: { color: "#a3a3a3" },
        },
      },
    },
  })
}

// Atualizar tabela
function updateTable(transactionsToShow = transactions) {
  const tbody = document.getElementById("transactionsBody")

  if (transactionsToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma transação registrada</td></tr>'
    return
  }

  tbody.innerHTML = transactionsToShow
    .slice()
    .reverse()
    .map(
      (t) => `
            <tr>
                <td>${formatDate(t.date)}</td>
                <td>${t.description}</td>
                <td><span class="badge badge-${t.type}">${t.type === "entrada" ? "Entrada" : "Saída"}</span></td>
                <td class="text-right" style="color: ${t.type === "entrada" ? "#16a34a" : "#ef4444"}; font-weight: 600;">
                    ${t.type === "entrada" ? "+" : "-"} ${formatCurrency(t.amount)}
                </td>
                <td style="text-align:center;">
                    <button class="delete-btn" onclick="deleteTransaction('${t.id}')">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                          xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                        <path d="M3 6h18" stroke-width="2" stroke-linecap="round"/>
                        <path d="M8 6V4h8v2" stroke-width="2"/>
                        <path d="M10 11v6" stroke-width="2" stroke-linecap="round"/>
                        <path d="M14 11v6" stroke-width="2" stroke-linecap="round"/>
                        <path d="M5 6l1 14h12l1-14" stroke-width="2"/>
                      </svg>
                    </button>
                </td>
            </tr>
        `,
    )
    .join("")
}

// Abrir calendário
function openCalendar() {
  document.getElementById("calendarModal").classList.add("active")
  renderCalendar()
}

// Fechar calendário
function closeCalendar() {
  document.getElementById("calendarModal").classList.remove("active")
}

// Renderizar calendário
function renderCalendar() {
  const container = document.getElementById("calendarContainer")
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const transactionsByDate = {}
  transactions.forEach((t) => {
    const date = new Date(t.date).toDateString()
    if (!transactionsByDate[date]) transactionsByDate[date] = []
    transactionsByDate[date].push(t)
  })

  let html = '<div style="text-align: center; margin-bottom: 1rem;">'
  html += `<h3>${today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h3>`
  html += "</div>"

  html += '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem;">'

  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  days.forEach((day) => {
    html += `<div style="text-align: center; font-weight: 600; padding: 0.5rem; color: #a3a3a3;">${day}</div>`
  })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let i = 0; i < firstDay; i++) {
    html += "<div></div>"
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = date.toDateString()
    const hasTransactions = transactionsByDate[dateStr]

    html += `<div style="
            padding: 0.5rem;
            text-align: center;
            border-radius: 0.5rem;
            background: ${hasTransactions ? "#16a34a" : "transparent"};
            color: ${hasTransactions ? "white" : "#fafafa"};
            font-weight: ${hasTransactions ? "600" : "normal"};
        ">${day}</div>`
  }

  html += "</div>"
  container.innerHTML = html
}

// Abrir relatório
function openReport() {
  document.getElementById("reportModal").classList.add("active")
  updateReport()
}

// Fechar relatório
function closeReport() {
  document.getElementById("reportModal").classList.remove("active")
}

// Atualizar relatório
function updateReport() {
  const totalEntrada = transactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.amount, 0)

  const totalSaida = transactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.amount, 0)

  const saldoMensal = totalEntrada - totalSaida

  document.getElementById("reportEntrada").textContent = formatCurrency(totalEntrada)
  document.getElementById("reportSaida").textContent = formatCurrency(totalSaida)
  document.getElementById("reportSaldo").textContent = formatCurrency(saldoMensal)

  // Análise
  const analysisDiv = document.getElementById("analysisContent")
  if (saldoMensal > 0) {
    analysisDiv.innerHTML = `
            <p style="color: #16a34a; font-weight: 600; margin-bottom: 0.5rem;">✓ Situação Positiva</p>
            <p>Com um saldo mensal de ${formatCurrency(saldoMensal)}, você está economizando regularmente.</p>
            <p style="margin-top: 0.5rem;">Projeção de economia em 12 meses: <strong>${formatCurrency(saldoMensal * 12)}</strong></p>
        `
  } else if (saldoMensal < 0) {
    analysisDiv.innerHTML = `
            <p style="color: #ef4444; font-weight: 600; margin-bottom: 0.5rem;">⚠ Situação de Prejuízo</p>
            <p>Seus gastos excedem suas receitas em ${formatCurrency(Math.abs(saldoMensal))} por mês.</p>
            <p style="margin-top: 0.5rem;">É importante revisar seus gastos e buscar formas de aumentar sua receita.</p>
        `
  } else {
    analysisDiv.innerHTML = `
            <p style="color: #fbbf24; font-weight: 600; margin-bottom: 0.5rem;">⚡ Situação Equilibrada</p>
            <p>Suas receitas e despesas estão equilibradas.</p>
        `
  }
  let meses = ['Jan','Fev','Mar','Abr','Maio','Jun','Jul','Ago','Set','Out','Nov','Dez']
  // Gráfico de projeção
  const projectionData = Array.from({ length: 12 }, (_, i) => ({
    mes: ` ${meses[i]}`,
    saldo: saldoMensal * (i + 1),
  }))

  for (date in transactions.json){
    if (meses[0] > meses[1]){}
    

  }

  const ctx = document.getElementById("projectionChart")

  if (projectionChart) {
    projectionChart.destroy()
  }

  projectionChart = new window.Chart(ctx, {
    type: "line",
    data: {
      labels: projectionData.map((d) => d.mes),
      datasets: [
        {
          label: "Saldo Projetado",
          data: projectionData.map((d) => d.saldo),
          borderColor: saldoMensal >= 0 ? "#16a34a" : "#ef4444",
          backgroundColor: "transparent",
          borderWidth: 2,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1c1c1c",
          titleColor: "#fafafa",
          bodyColor: "#a3a3a3",
          borderColor: "#2d2d2d",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => formatCurrency(context.parsed.y),
          },
        },
      },
      scales: {
        y: {
          grid: { color: "#2d2d2d" },
          ticks: { color: "#a3a3a3" },
        },
        x: {
          grid: { display: false },
          ticks: { color: "#a3a3a3" },
        },
      },
    },
  })
}

// Utilitários
function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("pt-BR")
}

// Novas funções para atualizar a tabela com filtros
function filterTransactions(type) {
  const filteredTransactions = transactions.filter((t) => t.type === type)
  updateTable(filteredTransactions)
}


// Botão de delete
function deleteTransaction(id) {
  if (!confirm("Tem certeza que deseja excluir esta transação?")) {
      return;
  }

  fetch(`/api/transactions/${id}`, {
      method: 'DELETE'
  })
  .then(res => res.json())
  .then(data => {
      if (data.success) {
          alert("Transação removida!");
          loadTransactions();  // atualiza a tabela
          loadSummary();       // atualiza o saldo
      }
  });
}
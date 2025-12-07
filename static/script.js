let transactions = []
let financeChart = null
let projectionChart = null

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  loadTransactions()
  setupEventListeners()


  // Define a data atual no campo de data 
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  document.getElementById("date").value = `${year}-${month}-${day}`

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
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma transação registrada</td></tr>'
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

  // Agrupar transações por data
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

  // Loop dos dias do mês
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = date.toDateString()
    const hasTransactions = transactionsByDate[dateStr]

    // Calcular totais do dia
    let totalEntrada = 0
    let totalSaida = 0

    if (hasTransactions) {
      totalEntrada = hasTransactions
        .filter(t => t.type === "entrada")
        .reduce((sum, t) => sum + t.amount, 0)

      totalSaida = hasTransactions
        .filter(t => t.type === "saida")
        .reduce((sum, t) => sum + t.amount, 0)
    }

    const saldoDia = totalEntrada - totalSaida

    // Determinar cor baseado no saldo
    let backgroundColor = "transparent"
    let borderColor = "transparent"
    let textColor = "#fafafa"
    let fontWeight = "normal"
    let cursor = "default"

    if (hasTransactions) {
      cursor = "pointer"
      fontWeight = "600"

      if (saldoDia > 0) {
        // Saldo positivo = verde
        backgroundColor = "#16a34a"
        borderColor = "#22c55e"
        textColor = "white"
      } else if (saldoDia < 0) {
        // Saldo negativo = vermelho
        backgroundColor = "#dc2626"
        borderColor = "#ef4444"
        textColor = "white"
      } else {
        // Saldo zero = amarelo/neutro
        backgroundColor = "#d97706"
        borderColor = "#f59e0b"
        textColor = "white"
      }
    }

    // Criar célula clicável do calendário
    html += `<div 
      onclick="showDayTransactions('${dateStr}', '${day}/${String(month + 1).padStart(2, '0')}/${year}')"
      style="
        padding: 0.75rem;
        text-align: center;
        border-radius: 0.5rem;
        background: ${backgroundColor};
        color: ${textColor};
        font-weight: ${fontWeight};
        cursor: ${cursor};
        border: 1px solid ${borderColor};
        transition: all 0.2s ease;
        min-height: 70px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      "
      onmouseover="this.style.transform = '${hasTransactions ? "scale(1.05)" : ""}';"
      onmouseout="this.style.transform = 'scale(1)';"
    >
      <span style="font-size: 1.1rem;">${day}</span>
      ${hasTransactions ? `<span style="font-size: 0.75rem; margin-top: 0.25rem;">${saldoDia >= 0 ? "+" : ""}R$ ${Math.abs(saldoDia).toFixed(2).replace('.', ',')}</span>` : ""}
    </div>`
  }

  html += "</div>"

  // Adicionar div para mostrar detalhes do dia selecionado
  html += `<div id="dayDetailsContainer" style="margin-top: 1.5rem; padding: 1rem; background: #1c1c1c; border-radius: 0.5rem; display: none;">
    <h4 style="margin-top: 0;">Transações do dia:</h4>
    <div id="dayTransactionsContent"></div>
  </div>`

  container.innerHTML = html
}

// Função para mostrar transações do dia selecionado
function showDayTransactions(dateStr, displayDate) {
  const container = document.getElementById("calendarContainer")
  const detailsContainer = document.getElementById("dayDetailsContainer")
  const contentDiv = document.getElementById("dayTransactionsContent")

  const dayTransactions = transactions.filter(t => new Date(t.date).toDateString() === dateStr)

  if (dayTransactions.length === 0) {
    contentDiv.innerHTML = '<p style="color: #a3a3a3;">Nenhuma transação neste dia</p>'
    detailsContainer.style.display = "block"
    return
  }

  // Calcular totais
  const totalEntrada = dayTransactions
    .filter(t => t.type === "entrada")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalSaida = dayTransactions
    .filter(t => t.type === "saida")
    .reduce((sum, t) => sum + t.amount, 0)

  const saldoDia = totalEntrada - totalSaida

  let html = `<div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #2d2d2d;">
    <p style="margin: 0.5rem 0;"><strong>Data:</strong> ${displayDate}</p>
    <p style="margin: 0.5rem 0; color: #16a34a;"><strong>Entradas:</strong> +R$ ${totalEntrada.toFixed(2).replace('.', ',')}</p>
    <p style="margin: 0.5rem 0; color: #ef4444;"><strong>Saídas:</strong> -R$ ${totalSaida.toFixed(2).replace('.', ',')}</p>
    <p style="margin: 0.5rem 0; color: #a855f7;"><strong>Saldo:</strong> R$ ${saldoDia.toFixed(2).replace('.', ',')}</p>
  </div>`

  html += '<div style="max-height: 300px; overflow-y: auto;">'
  dayTransactions.forEach(t => {
    html += `
      <div style="padding: 0.75rem; margin-bottom: 0.5rem; background: #2d2d2d; border-radius: 0.25rem;">
        <p style="margin: 0.25rem 0;"><strong>${t.description}</strong></p>
        <p style="margin: 0.25rem 0; font-size: 0.9rem; color: #a3a3a3;">${new Date(t.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
        <p style="margin: 0.25rem 0; color: ${t.type === "entrada" ? "#16a34a" : "#ef4444"}; font-weight: 600;">
          ${t.type === "entrada" ? "+" : "-"} R$ ${t.amount.toFixed(2).replace('.', ',')}
        </p>
      </div>
    `
  })
  html += '</div>'

  contentDiv.innerHTML = html
  detailsContainer.style.display = "block"
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
  // Agrupa transações por ano-mês e calcula saldo de cada mês
  const monthlyBalanceMap = {}

  transactions.forEach((t) => {
    const d = new Date(t.date)
    const year = d.getFullYear()
    const month = d.getMonth() // 0-11
    const key = `${year}-${String(month + 1).padStart(2, "0")}`

    if (!monthlyBalanceMap[key]) {
      monthlyBalanceMap[key] = 0
    }

    monthlyBalanceMap[key] += t.type === "entrada" ? t.amount : -t.amount
  })

  let meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Maio', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  // usar ano/mês atual como início
  const hoje = new Date()
  let startYear = hoje.getFullYear()
  let startMonth = hoje.getMonth() // 0-11

  let cumulative = 0
  const projectionData = []

  for (let i = 0; i < 12; i++) {
    const monthIndex = (startMonth + i) % 12
    const year = startYear + Math.floor((startMonth + i) / 12)

    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`
    const monthly = monthlyBalanceMap[key] || 0
    cumulative += monthly

    projectionData.push({
      mes: `${meses[monthIndex]}/${String(year).slice(-2)}`,
      saldo: cumulative,
    })
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

// ============ DATE PICKER CUSTOM ============

let currentDatePickerMonth = new Date().getMonth()
let currentDatePickerYear = new Date().getFullYear()
let selectedDate = new Date()

function toggleDatePicker(event) {
  event.stopPropagation()
  const calendar = document.getElementById("datePickerCalendar")
  calendar.classList.toggle("active")

  if (calendar.classList.contains("active")) {
    renderDatePicker()
  }
}

function renderDatePicker() {
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const firstDay = new Date(currentDatePickerYear, currentDatePickerMonth, 1).getDay()
  const daysInMonth = new Date(currentDatePickerYear, currentDatePickerMonth + 1, 0).getDate()

  document.getElementById("datePickerMonth").textContent = `${monthNames[currentDatePickerMonth]} ${currentDatePickerYear}`

  const daysContainer = document.getElementById("datePickerDays")
  daysContainer.innerHTML = ""

  // Dias vazios do mês anterior
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement("div")
    emptyDay.className = "date-picker-day disabled"
    daysContainer.appendChild(emptyDay)
  }

  // Dias do mês
  const today = new Date()
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEl = document.createElement("div")
    dayEl.className = "date-picker-day"
    dayEl.textContent = day

    const date = new Date(currentDatePickerYear, currentDatePickerMonth, day)
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

    const isSelected =
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()

    if (isToday) dayEl.classList.add("today")
    if (isSelected) dayEl.classList.add("selected")

    dayEl.onclick = () => selectDate(date)
    daysContainer.appendChild(dayEl)
  }
}

function previousMonth() {
  currentDatePickerMonth--
  if (currentDatePickerMonth < 0) {
    currentDatePickerMonth = 11
    currentDatePickerYear--
  }
  renderDatePicker()
}

function nextMonth() {
  currentDatePickerMonth++
  if (currentDatePickerMonth > 11) {
    currentDatePickerMonth = 0
    currentDatePickerYear++
  }
  renderDatePicker()
}

function selectDate(date) {
  selectedDate = date
  const dateString = date.toLocaleDateString("pt-BR")
  document.getElementById("datePickerText").textContent = dateString
  document.getElementById("date").value = date.toISOString().split("T")[0]

  document.getElementById("datePickerCalendar").classList.remove("active")
  renderDatePicker()
}

// Fechar o date picker ao clicar fora
document.addEventListener("click", (e) => {
  const calendar = document.getElementById("datePickerCalendar")
  const input = document.getElementById("datePickerInput")

  if (!input.contains(e.target) && !calendar.contains(e.target)) {
    calendar.classList.remove("active")
  }
})

// Inicializar com data atual
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date()
  selectedDate = today
  document.getElementById("datePickerText").textContent = today.toLocaleDateString("pt-BR")
  document.getElementById("date").value = today.toISOString().split("T")[0]
})

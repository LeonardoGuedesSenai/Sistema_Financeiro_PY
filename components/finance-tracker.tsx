"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FinanceChart } from "@/components/finance-chart"
import { TransactionsTable } from "@/components/transactions-table"
import { ReportDialog } from "@/components/report-dialog"
import { CalendarDialog } from "@/components/calendar-dialog"
import { TrendingUp, TrendingDown, Wallet, Plus } from "lucide-react"

export type Transaction = {
  id: string
  description: string
  amount: number
  type: "entrada" | "saida"
  date: string
}

export function FinanceTracker() {
  const [showReport, setShowReport] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [entrada, setEntrada] = useState<number>(0)
  const [saida, setSaida] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    type: "saida" as "entrada" | "saida",
  })

  const saldo = entrada - saida

  const handleAddTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount) return

    const amount = Number.parseFloat(newTransaction.amount)
    const transaction: Transaction = {
      id: Date.now().toString(),
      description: newTransaction.description,
      amount,
      type: newTransaction.type,
      date: new Date().toLocaleDateString("pt-BR"),
    }

    setTransactions([transaction, ...transactions])

    if (newTransaction.type === "entrada") {
      setEntrada(entrada + amount)
    } else {
      setSaida(saida + amount)
    }

    setNewTransaction({ description: "", amount: "", type: "saida" })
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {entrada.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total recebido no mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {saida.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total gasto no mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo >= 0 ? "text-accent" : "text-destructive"}`}>
              {saldo.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Disponível agora</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle>Nova Transação</CardTitle>
          <CardDescription>Adicione uma entrada ou saída ao seu controle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Salário, Aluguel..."
                value={newTransaction.description}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0,00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newTransaction.type}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    type: e.target.value as "entrada" | "saida",
                  })
                }
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddTransaction} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
          <CardDescription>Distribuição das suas finanças mensais</CardDescription>
        </CardHeader>
        <CardContent>
          <FinanceChart entrada={entrada} saida={saida} saldo={saldo} />
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>Todas as suas movimentações registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={transactions} />
        </CardContent>
      </Card>

      <ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        entrada={entrada}
        saida={saida}
        transactions={transactions}
      />

      <CalendarDialog
        open={showCalendar}
        onOpenChange={setShowCalendar}
        transactions={transactions}
        onAddTransaction={(transaction) => {
          setTransactions([transaction, ...transactions])
          if (transaction.type === "entrada") {
            setEntrada(entrada + transaction.amount)
          } else {
            setSaida(saida + transaction.amount)
          }
        }}
      />
    </div>
  )
}

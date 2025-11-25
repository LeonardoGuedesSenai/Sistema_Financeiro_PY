"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Transaction } from "@/components/finance-tracker"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

interface CalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactions: Transaction[]
  onAddTransaction: (transaction: Transaction) => void
}

export function CalendarDialog({ open, onOpenChange, transactions, onAddTransaction }: CalendarDialogProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [newEvent, setNewEvent] = useState({
    description: "",
    amount: "",
    type: "saida" as "entrada" | "saida",
  })

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek }
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)

  const getTransactionsForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString("pt-BR")

    return transactions.filter((t) => t.date === dateStr)
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleAddEvent = () => {
    if (!selectedDate || !newEvent.description || !newEvent.amount) return

    const transaction: Transaction = {
      id: Date.now().toString(),
      description: newEvent.description,
      amount: Number.parseFloat(newEvent.amount),
      type: newEvent.type,
      date: selectedDate,
    }

    onAddTransaction(transaction)
    setNewEvent({ description: "", amount: "", type: "saida" })
    setSelectedDate(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calendário Financeiro</DialogTitle>
          <DialogDescription>Visualize e adicione transações em datas específicas</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString(
                "pt-BR",
              )
              const dayTransactions = getTransactionsForDate(day)
              const isSelected = selectedDate === dateStr

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    aspect-square p-2 rounded-lg border text-sm transition-colors
                    hover:bg-accent hover:text-accent-foreground
                    ${isSelected ? "bg-primary text-primary-foreground" : "bg-card"}
                  `}
                >
                  <div className="font-medium">{day}</div>
                  {dayTransactions.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayTransactions.slice(0, 2).map((t) => (
                        <div
                          key={t.id}
                          className={`
                            text-xs px-1 py-0.5 rounded truncate
                            ${t.type === "entrada" ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive"}
                          `}
                        >
                          {t.description}
                        </div>
                      ))}
                      {dayTransactions.length > 2 && (
                        <div className="text-xs text-muted-foreground">+{dayTransactions.length - 2}</div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Add Event Form */}
          {selectedDate && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <h3 className="font-semibold">Adicionar transação para {selectedDate}</h3>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="event-description">Descrição</Label>
                  <Input
                    id="event-description"
                    placeholder="Ex: Aluguel, Salário..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-amount">Valor</Label>
                  <Input
                    id="event-amount"
                    type="number"
                    placeholder="0,00"
                    value={newEvent.amount}
                    onChange={(e) => setNewEvent({ ...newEvent, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-type">Tipo</Label>
                  <select
                    id="event-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        type: e.target.value as "entrada" | "saida",
                      })
                    }
                  >
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddEvent} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Transactions for selected date */}
          {selectedDate &&
            getTransactionsForDate(new Date(selectedDate.split("/").reverse().join("-")).getDate()).length > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Transações em {selectedDate}</h3>
                <div className="space-y-2">
                  {getTransactionsForDate(new Date(selectedDate.split("/").reverse().join("-")).getDate()).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div>
                        <p className="font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{t.type === "entrada" ? "Entrada" : "Saída"}</p>
                      </div>
                      <p className={`font-semibold ${t.type === "entrada" ? "text-accent" : "text-destructive"}`}>
                        {t.type === "saida" ? "-" : "+"}
                        {t.amount.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

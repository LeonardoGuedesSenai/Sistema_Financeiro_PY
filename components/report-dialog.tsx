"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Transaction } from "@/components/finance-tracker"
import { TrendingUp, TrendingDown, Target } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts"

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entrada: number
  saida: number
  transactions: Transaction[]
}

export function ReportDialog({ open, onOpenChange, entrada, saida, transactions }: ReportDialogProps) {
  const [meta, setMeta] = useState<string>("10000")

  const saldo = entrada - saida
  const metaValue = Number.parseFloat(meta) || 0
  const mesesParaMeta = saldo > 0 ? Math.ceil((metaValue - saldo) / saldo) : 0
  const emPrejuizo = saldo < 0

  // Dados para o gráfico de projeção
  const chartData = []
  let acumulado = saldo

  for (let i = 0; i <= 12; i++) {
    chartData.push({
      mes: i === 0 ? "Atual" : `Mês ${i}`,
      saldo: Math.max(0, acumulado),
      meta: metaValue,
    })
    if (i > 0 && !emPrejuizo) {
      acumulado += saldo
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório Financeiro</DialogTitle>
          <DialogDescription>Resumo completo das suas finanças e projeção de metas</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  {entrada.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {transactions.filter((t) => t.type === "entrada").length} transações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {saida.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {transactions.filter((t) => t.type === "saida").length} transações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Mensal</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${saldo >= 0 ? "text-accent" : "text-destructive"}`}>
                  {saldo.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{emPrejuizo ? "Em prejuízo" : "Economia mensal"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Definir Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Definir Meta Financeira</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="meta">Valor da Meta</Label>
                  <Input
                    id="meta"
                    type="number"
                    placeholder="10000"
                    value={meta}
                    onChange={(e) => setMeta(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  {!emPrejuizo && metaValue > saldo ? (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Tempo para atingir a meta:</p>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {mesesParaMeta} {mesesParaMeta === 1 ? "mês" : "meses"}
                      </p>
                    </div>
                  ) : emPrejuizo ? (
                    <div className="text-sm">
                      <p className="text-destructive font-semibold">⚠️ Atenção: Você está em prejuízo!</p>
                      <p className="text-muted-foreground mt-1">Suas saídas são maiores que as entradas</p>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <p className="text-accent font-semibold">✓ Meta já atingida!</p>
                      <p className="text-muted-foreground mt-1">Parabéns pelo seu controle financeiro</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Projeção */}
          <Card>
            <CardHeader>
              <CardTitle>Projeção de Economia</CardTitle>
              <DialogDescription>Previsão de crescimento do saldo baseado na economia mensal atual</DialogDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) =>
                      value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        minimumFractionDigits: 0,
                      })
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <p className="text-sm font-semibold mb-2">{payload[0].payload.mes}</p>
                          <div className="space-y-1">
                            <p className="text-sm text-accent">
                              Saldo:{" "}
                              {Number(payload[0].value).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                            <p className="text-sm text-primary">
                              Meta:{" "}
                              {Number(payload[1].value).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="saldo" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="meta"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Análise de Gastos por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Média de Gastos Mensais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Média de Entradas</span>
                  <span className="font-semibold text-accent">
                    {entrada.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Média de Saídas</span>
                  <span className="font-semibold text-destructive">
                    {saida.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Taxa de Economia</span>
                  <span className={`font-bold ${saldo >= 0 ? "text-accent" : "text-destructive"}`}>
                    {entrada > 0 ? ((saldo / entrada) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"

type FinanceChartProps = {
  entrada: number
  saida: number
  saldo: number
}

export function FinanceChart({ entrada, saida, saldo }: FinanceChartProps) {
  const data = [
    {
      name: "Entradas",
      value: entrada,
      fill: "hsl(142, 76%, 36%)",
    },
    {
      name: "Saídas",
      value: saida,
      fill: "hsl(0, 84%, 60%)",
    },
    {
      name: "Saldo",
      value: Math.abs(saldo),
      fill: "hsl(262, 83%, 58%)",
    },
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            padding: "8px 12px",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, marginBottom: 4 }}>
            {payload[0].value.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
          <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: 4 }}>
            <p style={{ margin: 0, fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>
              {payload[0].payload.name}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} barSize={60}>
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
        />
        <Tooltip cursor={false} position={{ y: 0 }} content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

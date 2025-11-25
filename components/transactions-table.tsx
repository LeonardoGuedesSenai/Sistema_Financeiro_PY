"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { Transaction } from "./finance-tracker"

type TransactionsTableProps = {
  transactions: Transaction[]
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma transação registrada ainda.</p>
        <p className="text-sm mt-1">Adicione sua primeira transação acima.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {transaction.type === "entrada" ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-accent" />
                      <span className="text-accent font-medium">Entrada</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      <span className="text-destructive font-medium">Saída</span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{transaction.description}</TableCell>
              <TableCell className="text-muted-foreground">{transaction.date}</TableCell>
              <TableCell
                className={`text-right font-medium ${
                  transaction.type === "entrada" ? "text-accent" : "text-destructive"
                }`}
              >
                {transaction.type === "entrada" ? "+" : "-"}
                {transaction.amount.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

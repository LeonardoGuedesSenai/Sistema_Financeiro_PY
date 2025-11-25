"use client"

import { Button } from "@/components/ui/button"
import { FileText, Calendar } from "lucide-react"
import { useState } from "react"
import { ReportDialog } from "@/components/report-dialog"
import { CalendarDialog } from "@/components/calendar-dialog"

export function PageHeader() {
  const [showReport, setShowReport] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Controle de Gastos</h1>
          <p className="mt-2 text-muted-foreground">Gerencie suas finanças mensais de forma simples e visual</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCalendar(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            Calendário
          </Button>
          <Button onClick={() => setShowReport(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Relatório
          </Button>
        </div>
      </div>

      <ReportDialog open={showReport} onOpenChange={setShowReport} entrada={0} saida={0} transactions={[]} />

      <CalendarDialog
        open={showCalendar}
        onOpenChange={setShowCalendar}
        transactions={[]}
        onAddTransaction={() => {}}
      />
    </>
  )
}

import { FinanceTracker } from "@/components/finance-tracker"
import { PageHeader } from "@/components/page-header"

export default function Page() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader />
        <FinanceTracker />
      </div>
    </main>
  )
}

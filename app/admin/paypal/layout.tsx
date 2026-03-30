import { Metadata } from "next"

export const metadata: Metadata = {
  title: "PayPal Management",
  description: "Manage PayPal transactions and settings",
}

interface PayPalLayoutProps {
  children: React.ReactNode
}

export default function PayPalLayout({ children }: PayPalLayoutProps) {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">PayPal Integration</h2>
      </div>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
         {/* Could add top-level tabs here if needed, but sidebar handles nav */}
         {children}
      </div>
    </div>
  )
}

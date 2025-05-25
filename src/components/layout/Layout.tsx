import { Header } from './Header'
import { TabBar } from './TabBar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      <Header />
      <main className="pt-14 pb-16 min-h-screen">
        <div className="h-full">
          {children}
        </div>
      </main>
      <TabBar />
    </div>
  )
}
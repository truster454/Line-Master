import { useState } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { AppSidebar, type NavPage } from '@/components/app-sidebar'
import { DashboardView } from '@/components/dashboard-view'
import { LibraryView } from '@/components/library-view'
import { FavoritesView } from '@/components/favorites-view'
import { AnalyticsView } from '@/components/analytics-view'
import { SettingsView } from '@/components/settings-view'

export function Panel() {
  const [activePage, setActivePage] = useState<NavPage>('dashboard')

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen">
          <AppSidebar activePage={activePage} onNavigate={setActivePage} />
          <main className="flex-1 p-6 lg:p-8">
            {activePage === 'dashboard' && <DashboardView />}
            {activePage === 'library' && <LibraryView />}
            {activePage === 'favorites' && <FavoritesView />}
            {activePage === 'analytics' && <AnalyticsView />}
            {activePage === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  )
}

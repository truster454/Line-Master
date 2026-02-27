import { useState } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { PopupShell, type PopupPage } from '@/components/popup-shell'
import { HomeScreen } from '@/components/home-screen'
import { PopupLibrary } from '@/components/popup-library'
import { PopupFavorites } from '@/components/popup-favorites'
import { PopupSettings } from '@/components/popup-settings'
import { PopupLanguageProvider } from '@/components/popup-language'

export function Popup() {
  const [activePage, setActivePage] = useState<PopupPage>('home')

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <PopupLanguageProvider>
        <div className="w-[380px] h-[560px] overflow-hidden bg-background">
          <PopupShell activePage={activePage} onNavigate={setActivePage}>
            {activePage === 'home' && <HomeScreen />}
            {activePage === 'library' && <PopupLibrary />}
            {activePage === 'favorites' && <PopupFavorites />}
            {activePage === 'settings' && <PopupSettings />}
          </PopupShell>
        </div>
      </PopupLanguageProvider>
      <Toaster />
    </ThemeProvider>
  )
}

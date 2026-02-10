import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { SettingsView } from '@/components/settings-view'

export function Options() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen bg-background text-foreground p-6 lg:p-10">
        <SettingsView />
      </div>
      <Toaster />
    </ThemeProvider>
  )
}

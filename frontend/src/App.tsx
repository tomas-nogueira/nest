import { AppRoutes } from './routes/AppRoutes'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'

function App() {
  return (
    <TooltipProvider>
      <main className="min-h-screen">
        <AppRoutes />
        <Toaster richColors closeButton position="top-right" />
      </main>
    </TooltipProvider>
  )
}

export default App

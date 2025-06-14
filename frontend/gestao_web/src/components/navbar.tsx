"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Menu, Bell, Moon, Sun, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    toast({
      title: "Logout realizado com sucesso!",
      description: "Redirecionando para a tela de login...",
    })
    setTimeout(() => {
      router.push("/login")
    }, 1000)
  }
  
  const toggleSidebar = () => {
    // Implementar toggle do sidebar para mobile
    document.documentElement.classList.toggle("sidebar-open")
    
    // Disparar evento personalizado para o sidebar
    window.dispatchEvent(new CustomEvent('toggle-sidebar'))
  }

  return (
    <header className="border-b bg-background px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </div>
      
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
          <span className="text-sm font-medium text-muted-foreground">
            Sistema de Gestão <span className="text-primary font-semibold">EngParente</span>
          </span>
        </Link>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  )
} 
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Building,
  ShoppingCart,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  title: string
  isCollapsed: boolean
}

function SidebarItem({ href, icon, title, isCollapsed }: SidebarItemProps) {
  const pathname = usePathname()
  
  // Lógica mais específica para detectar rota ativa
  const isActive = (() => {
    // Para a rota exata, usar comparação direta
    if (pathname === href) {
      return true
    }
    
    // Para sub-rotas, verificar se começa com o href mas não para rotas conflitantes
    if (href !== '/dashboard' && pathname.startsWith(`${href}/`)) {
      return true
    }
    
    // Para dashboard, só ativar se for exatamente /dashboard
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    
    return false
  })()

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 hover:scale-105",
        "hover:shadow-lg hover:shadow-primary/10",
        isActive 
          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20" 
          : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:shadow-md hover:shadow-primary/10",
        isCollapsed ? "justify-center" : ""
      )}
      title={isCollapsed ? title : undefined}
    >
      <div className={cn(
        "flex items-center justify-center transition-all duration-300",
        isActive ? "text-primary-foreground" : "text-current"
      )}>
        {icon}
      </div>
      
      {!isCollapsed && (
        <span className="transition-all duration-300 ease-in-out">
          {title}
        </span>
      )}
      
      {/* Indicador de rota ativa */}
      {isActive && (
        <div className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-primary-foreground/30" />
      )}
      
      {/* Tooltip para modo colapsado */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          {title}
        </div>
      )}
    </Link>
  )
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Recuperar estado do localStorage
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState))
    }

    // Escutar evento de toggle do navbar
    const handleToggleFromNavbar = () => {
      setIsCollapsed(prev => !prev)
    }

    window.addEventListener('toggle-sidebar', handleToggleFromNavbar)
    
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleFromNavbar)
    }
  }, [])

  useEffect(() => {
    // Salvar estado no localStorage
    if (isMounted) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
    }
  }, [isCollapsed, isMounted])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const menuItems = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      title: "Dashboard"
    },
    {
      href: "/employees",
      icon: <Users className="h-5 w-5" />,
      title: "Funcionários"
    },
    {
      href: "/departments",
      icon: <Building className="h-5 w-5" />,
      title: "Departamentos"
    },
    {
      href: "/materials",
      icon: <ShoppingCart className="h-5 w-5" />,
      title: "Materiais"
    },
    {
      href: "/expenses",
      icon: <Receipt className="h-5 w-5" />,
      title: "Despesas"
    },
    {
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      title: "Configurações"
    }
  ]

  return (
    <aside className={cn(
      "hidden md:flex flex-col border-r bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm transition-all duration-300 ease-in-out relative",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Header com logo */}
      <div className={cn(
        "flex items-center border-b border-border/50 transition-all duration-300",
        isCollapsed ? "justify-center p-4" : "justify-between p-4"
      )}>
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <Image
              src="/logo_engparente.png"
              alt="Eng. Parente Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary leading-tight">ENG. PARENTE</span>
              <span className="text-xs text-muted-foreground font-medium">GESTÃO</span>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <Image
            src="/logo_engparente.png"
            alt="Eng. Parente Logo"
            width={32}
            height={32}
            className="object-contain"
          />
        )}
      </div>

      {/* Toggle Button */}
      <div className="absolute -right-3 top-6 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full border-2 bg-background shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          onClick={toggleSidebar}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className={cn(
        "flex flex-col gap-2 transition-all duration-300",
        isCollapsed ? "p-2 pt-6" : "p-4 pt-6"
      )}>
        {!isCollapsed && (
          <div className="pb-2">
            <h2 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
              Menu Principal
            </h2>
          </div>
        )}
        
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              title={item.title}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-border/50 p-4">
        {!isCollapsed && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              © 2024 Eng. Parente
            </p>
            <p className="text-xs text-muted-foreground/70">
              Sistema de Gestão
            </p>
          </div>
        )}
      </div>
    </aside>
  )
} 
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BuildingIcon,
  DashboardIcon,
  PersonIcon,
  ReceiptIcon,
  SettingsIcon,
  ShoppingCartIcon,
} from "@radix-ui/react-icons"

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  title: string
}

function SidebarItem({ href, icon, title }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
    >
      {icon}
      <span>{title}</span>
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex">
      <div className="flex flex-col gap-2 p-4">
        <div className="py-2">
          <h2 className="text-lg font-semibold tracking-tight">Menu</h2>
        </div>
        <nav className="flex flex-col gap-1">
          <SidebarItem
            href="/"
            icon={<DashboardIcon className="h-4 w-4" />}
            title="Dashboard"
          />
          <SidebarItem
            href="/employees"
            icon={<PersonIcon className="h-4 w-4" />}
            title="Funcionários"
          />
          <SidebarItem
            href="/departments"
            icon={<BuildingIcon className="h-4 w-4" />}
            title="Departamentos"
          />
          <SidebarItem
            href="/materials"
            icon={<ShoppingCartIcon className="h-4 w-4" />}
            title="Materiais"
          />
          <SidebarItem
            href="/expenses"
            icon={<ReceiptIcon className="h-4 w-4" />}
            title="Despesas"
          />
          <SidebarItem
            href="/settings"
            icon={<SettingsIcon className="h-4 w-4" />}
            title="Configurações"
          />
        </nav>
      </div>
    </aside>
  )
} 
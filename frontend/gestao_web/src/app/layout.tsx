import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { QueryProvider } from "@/components/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestão Empresarial",
  description: "Sistema de gestão empresarial para controle de funcionários e finanças.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-4">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

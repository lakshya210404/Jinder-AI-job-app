import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {/* Minimal header - mobile only */}
          <header className="h-14 flex items-center px-4 lg:hidden border-b border-border bg-background sticky top-0 z-40">
            <SidebarTrigger className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
          </header>
          <div className="flex-1 p-4 lg:p-8 lg:pt-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center border-b border-border/50 px-4 py-2">
            <SidebarTrigger className="text-muted-foreground hover:text-primary" />
            <div className="ml-2 h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="ml-2 font-mono text-[10px] text-muted-foreground">SYSTEM ONLINE</span>
          </div>
          <div className="p-6 cyber-grid relative">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

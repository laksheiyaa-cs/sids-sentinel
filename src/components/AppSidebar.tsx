import {
  LayoutDashboard,
  Link2,
  MessageSquare,
  UserSearch,
  Bell,
  FileText,
  Settings,
  Info,
  LogOut,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

const scannerItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "URL Scanner", url: "/scan-url", icon: Link2 },
  { title: "Message Scanner", url: "/scan-message", icon: MessageSquare },
  { title: "Profile Detector", url: "/scan-profile", icon: UserSearch },
];

const systemItems = [
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "About", url: "/about", icon: Info },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold text-primary neon-text">SIDS</h1>
            <p className="font-mono text-[10px] text-muted-foreground">v1.0.0 // ACTIVE</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            Scanners
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {scannerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="font-mono text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                      activeClassName="text-primary bg-primary/10 neon-border"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="font-mono text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                      activeClassName="text-primary bg-primary/10 neon-border"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[150px]">
            {user?.email}
          </p>
          <button
            onClick={signOut}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

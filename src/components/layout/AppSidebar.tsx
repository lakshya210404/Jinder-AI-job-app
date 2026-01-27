import { Briefcase, BookmarkCheck, FileText, Sparkles, User, Settings, LogOut, ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { JinderLogo } from "@/components/JinderLogo";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Jobs", url: "/jobs", icon: Briefcase },
  { title: "Saved", url: "/saved", icon: BookmarkCheck },
  { title: "Applications", url: "/applications", icon: FileText },
  { title: "Resume", url: "/resume", icon: Sparkles },
];

const bottomNavItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="p-5 pb-6">
        <JinderLogo size="sm" />
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className={cn(
                      "h-10 rounded-lg px-3 transition-all duration-150 font-medium",
                      isActive(item.url)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-accent"
                    )}
                  >
                    <button onClick={() => navigate(item.url)} className="flex items-center gap-3 w-full">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                      {isActive(item.url) && (
                        <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto">
        <div className="h-px bg-border mb-3" />
        <SidebarMenu className="space-y-0.5">
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                className={cn(
                  "h-9 rounded-lg px-3 transition-all duration-150",
                  isActive(item.url)
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <button onClick={() => navigate(item.url)} className="flex items-center gap-3 w-full">
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.title}</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-normal"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Sign Out</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

import { Briefcase, BookmarkCheck, FileText, Sparkles, User, Settings, LogOut } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

const mainNavItems = [
  { title: "Browse Jobs", url: "/", icon: Briefcase, color: "text-purple" },
  { title: "Saved Jobs", url: "/saved", icon: BookmarkCheck, color: "text-pink" },
  { title: "My Applications", url: "/applications", icon: FileText, color: "text-blue" },
  { title: "AI Resume Builder", url: "/resume", icon: Sparkles, color: "text-orange" },
];

const bottomNavItems = [
  { title: "Profile", url: "/profile", icon: User, color: "text-teal" },
  { title: "Settings", url: "/settings", icon: Settings, color: "text-muted-foreground" },
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
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-6">
        <JinderLogo size="sm" />
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="h-11 rounded-xl px-4 transition-all duration-200"
                  >
                    <button onClick={() => navigate(item.url)} className="flex items-center gap-3 w-full">
                      <item.icon className={`h-5 w-5 ${isActive(item.url) ? "text-primary" : item.color}`} />
                      <span className="font-medium">{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Separator className="mb-3" />
        <SidebarMenu>
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                className="h-10 rounded-xl px-4 transition-all duration-200"
              >
                <button onClick={() => navigate(item.url)} className="flex items-center gap-3 w-full">
                  <item.icon className={`h-4 w-4 ${isActive(item.url) ? "text-primary" : item.color}`} />
                  <span className="text-sm">{item.title}</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10 px-4 text-muted-foreground hover:text-destructive"
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
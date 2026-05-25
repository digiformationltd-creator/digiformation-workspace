import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b px-3 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <span className="text-xs font-medium text-muted-foreground">
                Company Portfolio
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-7 w-7" aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-7 w-7" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-3 md:p-4 overflow-auto">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}

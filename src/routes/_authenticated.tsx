import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/_authenticated")({
  component: AppLayout,
});

function AppLayout() {
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    document.documentElement.classList.toggle("dark", saved ? saved === "dark" : true);
  }, []);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-3 md:p-4 overflow-auto">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}

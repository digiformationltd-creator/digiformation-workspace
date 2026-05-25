import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Upload,
  Settings,
  FileText,
  Truck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, search: undefined },
  { title: "Import CSV", url: "/import", icon: Upload, search: undefined },
  { title: "Settings", url: "/settings", icon: Settings, search: undefined },
];

const quickFilters: Array<{
  title: string;
  icon: typeof FileText;
  search: { filter: string };
}> = [
  { title: "Active", icon: CheckCircle2, search: { filter: "active" } },
  { title: "AD01 Pending", icon: FileText, search: { filter: "ad01" } },
  { title: "Available", icon: Truck, search: { filter: "pending-sale" } },
  { title: "Default Address", icon: MapPin, search: { filter: "default-address" } },
  { title: "Strike Off Notice", icon: AlertTriangle, search: { filter: "strike-off" } },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  });
  const currentSearch = useRouterState({
    select: (router) => router.location.search as { filter?: string },
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath === item.url && !currentSearch.filter}
                  >
                    <Link to={item.url} className="flex items-center gap-2 hover:bg-muted/50">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Filters</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickFilters.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      currentPath === "/" && currentSearch.filter === item.search.filter
                    }
                  >
                    <Link
                      to="/"
                      search={item.search}
                      className="flex items-center gap-2 hover:bg-muted/50"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

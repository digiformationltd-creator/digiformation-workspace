import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Upload,
  Settings,
  FileText,
  Truck,
  Home,
  AlertTriangle,
  CheckCircle,
  Clock,
  KeyRound,
  FileCheck,
  BookOpen,
  Building2,
  TrendingUp,
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
import { useUserRole } from "@/hooks/useUserRole";

const dashboardItem = { title: "Dashboard", url: "/", icon: LayoutDashboard, search: undefined };
const adminOnlyItems = [
  { title: "Import CSV", url: "/import", icon: Upload, search: undefined },
];

// Colors must match the SummaryCards on the dashboard so the icon language
// is consistent between sidebar, dashboard, and table action buttons.
const quickFilters: Array<{
  title: string;
  icon: typeof FileText;
  color: string;
  search?: { filter: string };
}> = [
  { title: "Total Companies", icon: Building2, color: "text-indigo-500", search: undefined },
  { title: "Active", icon: CheckCircle, color: "text-emerald-500", search: { filter: "active" } },
  { title: "Available", icon: TrendingUp, color: "text-amber-500", search: { filter: "pending-sale" } },
  { title: "Sold / Transferred", icon: Truck, color: "text-sky-500", search: { filter: "sold" } },
  { title: "Strike Off Notice", icon: AlertTriangle, color: "text-rose-500", search: { filter: "strike-off" } },
  { title: "AD01 Pending", icon: Clock, color: "text-orange-500", search: { filter: "ad01" } },
  { title: "AD01 Processing", icon: Clock, color: "text-blue-500", search: { filter: "ad01-processing" } },
  { title: "AD01 Filed", icon: FileCheck, color: "text-green-600", search: { filter: "ad01-filed" } },
  { title: "Auth Missing", icon: KeyRound, color: "text-fuchsia-500", search: { filter: "auth-missing" } },
  { title: "Default Address", icon: Home, color: "text-yellow-600", search: { filter: "default-address" } },
  { title: "Confirmation Statement", icon: FileText, color: "text-purple-500", search: undefined },
  { title: "Annual Accounts", icon: BookOpen, color: "text-teal-500", search: undefined },
];


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin } = useUserRole();
  const mainItems = isAdmin ? [dashboardItem, ...adminOnlyItems] : [dashboardItem];
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
                      currentPath === "/" &&
                      (item.search
                        ? currentSearch.filter === item.search.filter
                        : !currentSearch.filter)
                    }
                  >
                    <Link
                      to="/"
                      search={item.search ?? {}}
                      className="flex items-center gap-2 hover:bg-muted/50"
                    >
                      <item.icon className={`h-4 w-4 ${item.color}`} />
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

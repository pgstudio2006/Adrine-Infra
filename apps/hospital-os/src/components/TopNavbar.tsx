import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_BASE_PATH } from "@/config/roleNavigation";
import { getHeaderBrandMark } from "@/config/tenantSettings";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { Search, Bell, LogOut, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRouteReadinessBadge } from "@/config/routeReadiness";
import { useOperationalRouteGuard } from "@/hooks/useOperationalRouteGuard";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "New lab report ready",
    message: "CBC report for patient UH-10234 is ready for review",
    time: "2 min ago",
    read: false,
  },
  {
    id: 2,
    title: "Appointment reminder",
    message: "Dr. Sanjay Mehta's appointment in 15 minutes",
    time: "5 min ago",
    read: false,
  },
  {
    id: 3,
    title: "Bed allocation request",
    message: "ICU bed requested for emergency admission",
    time: "12 min ago",
    read: false,
  },
  {
    id: 4,
    title: "Inventory alert",
    message: "Dialyzer F60S stock below reorder level",
    time: "1 hr ago",
    read: true,
  },
  {
    id: 5,
    title: "Shift change",
    message: "Evening shift starts at 2:00 PM — 3 tasks pending",
    time: "2 hr ago",
    read: true,
  },
];

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const { settings, getRoleLabel, getTabsForRole } = useTenantSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  if (!user) return null;

  const tabs = getTabsForRole(user.role, { department: user.department, name: user.name }) ?? [];
  const { guardedNavigate } = useOperationalRouteGuard();
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Dynamic initials from user name
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const parentTab = useMemo(() => {
    const path = location.pathname;
    return (
      tabs.find(
        (tab) => path !== tab.path && path.startsWith(`${tab.path}/`),
      ) ?? null
    );
  }, [location.pathname, tabs]);

  const orderedTabs = useMemo(() => {
    const dashboardTab = tabs.find((t) => t.key === "dashboard");
    if (!dashboardTab) return tabs;
    return [dashboardTab, ...tabs.filter((t) => t.key !== "dashboard")];
  }, [tabs]);

  const readinessBadge = getRouteReadinessBadge(location.pathname);

  // Search results from tab labels
  const searchResults = searchQuery.trim()
    ? tabs.filter((t) =>
        t.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const handleSearchSelect = (path: string) => {
    guardedNavigate(path);
    setShowSearch(false);
    setSearchQuery("");
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="flex items-center h-14 px-6 gap-6 max-w-[1440px] mx-auto w-full">
        {/* Branding with breadcrumb */}
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="font-bold text-lg tracking-tight cursor-pointer hover:text-muted-foreground transition-colors"
            onClick={() => navigate(ROLE_BASE_PATH[user.role])}
          >
            {getHeaderBrandMark(settings)}
          </span>
          <div className="h-4 w-[1px] bg-border" />
          <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
            {getRoleLabel(user.role)}
          </span>
          {readinessBadge && (
            <Badge
              variant="secondary"
              className="text-[9px] h-5 font-normal px-1.5"
            >
              {readinessBadge}
            </Badge>
          )}
        </div>

        {/* Tabs — left aligned, minimalist typography */}
        <nav className="flex items-center gap-6 flex-1 px-4 overflow-x-auto scrollbar-hide">
          {orderedTabs.map((tab) => {
            const isActive =
              location.pathname === tab.path || parentTab?.key === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => guardedNavigate(tab.path)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap
                  ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab.label}
                {isActive && (
                  <span
                    className="absolute -bottom-[17px] left-0 w-full h-[2px] bg-foreground rounded-t-sm animate-scale-in"
                    style={{ transformOrigin: "center" }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search */}
          <div className="relative">
            {showSearch ? (
              <div className="flex items-center gap-2 animate-fade-in">
                <Search className="w-4 h-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
                <Input
                  ref={searchRef}
                  placeholder="Search modules..."
                  className="w-56 h-8 text-sm pl-8 bg-transparent border-muted-foreground/20 focus-visible:ring-1 focus-visible:border-transparent transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setShowSearch(false);
                      setSearchQuery("");
                    }
                    if (e.key === "Enter" && searchResults.length > 0)
                      handleSearchSelect(searchResults[0].path);
                  }}
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="p-1 hover:bg-accent rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                {searchQuery && searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 right-0 w-56 bg-card border rounded-md shadow-sm py-1 z-50 animate-fade-in">
                    {searchResults.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => handleSearchSelect(r.path)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-full hover:bg-accent transition-colors relative text-muted-foreground hover:text-foreground"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.7)] outline outline-2 outline-background rounded-full animate-scale-in" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute top-full mt-2 right-0 w-80 bg-card border shadow-sm z-50 p-2 animate-fade-up">
                <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b">
                  <span className="font-medium tracking-tight text-sm">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto pr-1 space-y-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-3 py-3 rounded-sm transition-all duration-300 cursor-pointer border-l-2 ${!n.read ? "bg-info/5 border-info hover:bg-info/10" : "bg-transparent border-transparent hover:bg-accent/50"}`}
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((x) =>
                            x.id === n.id ? { ...x, read: true } : x,
                          ),
                        )
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className={`text-sm tracking-tight ${!n.read ? "font-bold text-foreground drop-shadow-sm" : "font-medium text-muted-foreground"}`}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {n.message}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap mt-0.5 tracking-wider uppercase">
                          {n.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-border mx-1" />

          <div className="flex items-center gap-2 pl-1 cursor-pointer group">
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-medium tracking-wider group-hover:scale-105 transition-transform">
              {initials}
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="p-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground ml-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

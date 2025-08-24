import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  Home,
  FolderKanban,
  Building2,
  MessageSquare,
  BarChart3,
  Users,
  Bell,
  LogOut,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Get current page from location
  const currentPage = location.pathname.split("/")[1] || "dashboard";

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
    {
      id: "projects",
      label: "Projects",
      icon: FolderKanban,
      path: "/projects",
    },
    {
      id: "institutions",
      label: "Institutions",
      icon: Building2,
      path: "/institutions",
    },
    { id: "chat", label: "Chat", icon: MessageSquare, path: "/chat" },
    { id: "reports", label: "Reports", icon: BarChart3, path: "/reports" },
    { id: "users", label: "Users", icon: Users, path: "/users" },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    if (!state.user) return false;

    switch (state.user.role) {
      case "admin":
        return true; // Admin sees everything
      case "supervisor":
        return !["users"].includes(item.id);
      case "employee":
        return !["institutions", "users"].includes(item.id);
      case "observer":
        return !["institutions", "users", "chat"].includes(item.id);
      default:
        return false;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    dispatch({ type: "SET_USER", payload: null });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Header */}
      <header className="bg-white border-b border-muted/20 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">Hesed Events</h1>
            <div className="hidden md:block text-sm text-muted">
              Event Management Platform
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-muted/10 rounded-lg transition-colors">
              <Bell size={20} />
            </button>

            {state.user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="font-medium text-sm">{state.user.name}</div>
                  <div className="text-xs text-muted capitalize">
                    {state.user.role}
                  </div>
                </div>
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-medium text-sm">
                  {state.user.name && state.user.name.charAt(0)}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-muted/10 rounded-lg transition-colors text-muted hover:text-red-600"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-muted/20 min-h-[calc(100vh-80px)]">
          <nav className="p-4">
            <ul className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-muted hover:bg-muted/10 hover:text-text"
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  LayoutDashboard, 
  Plus, 
  List, 
  Edit, 
  Video, 
  ClipboardCheck, 
  Folder, 
  BarChart3, 
  Settings,
  LogOut
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, current: location === "/" },
    { name: "New Course", href: "/course-generator", icon: Plus, current: location === "/course-generator" },
    { name: "Outline Generator", href: "/outline-generator", icon: List, current: false },
    { name: "Content Creator", href: "/", icon: Edit, current: false, badge: "Via Outlines" },
    { name: "Video Producer", href: "/video-producer", icon: Video, current: false, badge: "Soon" },
    { name: "Assessment Builder", href: "/assessment-builder", icon: ClipboardCheck, current: false, badge: "Soon" },
    { name: "Resource Manager", href: "/resource-manager", icon: Folder, current: false, badge: "Soon" },
    { name: "Analytics", href: "/analytics", icon: BarChart3, current: false, badge: "Soon" },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-card rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Course Creation Suite</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`
                  flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer
                  ${item.current 
                    ? 'text-blue-700 bg-blue-50 border-r-2 border-blue-600 dark:text-blue-400 dark:bg-blue-900/50' 
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="ml-3 font-medium">{item.name}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={user?.profileImageUrl || undefined} 
              alt={`${user?.firstName} ${user?.lastName}`} 
            />
            <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

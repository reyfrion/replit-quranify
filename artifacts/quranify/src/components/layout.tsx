import { Link, useLocation } from "wouter";
import { Home, ListTodo, Trophy, Users, User, BarChart2, LogOut } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const logout = useLogout();
  
  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/tracker", label: "Tracker", icon: ListTodo },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/halaqah", label: "Halaqah", icon: Users },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <nav className="w-full md:w-64 border-b md:border-r border-border bg-card p-4 flex md:flex-col justify-between">
        <div className="flex md:flex-col gap-2 md:gap-4 w-full overflow-x-auto md:overflow-visible hide-scrollbar pb-2 md:pb-0">
          <div className="hidden md:flex items-center gap-2 px-2 py-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold">
              Q
            </div>
            <span className="font-serif font-bold text-xl text-primary">Quranify</span>
          </div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            // Check if exact match OR if we're on a subpage (e.g. /halaqah/1 should match /halaqah)
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-2 flex-shrink-0 ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="inline md:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
        
        <div className="hidden md:block mt-auto pt-4">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-[100dvh]">
        <div className="max-w-5xl mx-auto space-y-8 pb-20 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}

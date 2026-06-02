
"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Users, Grid, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  role: 'admin' | 'student';
}

export function Navbar({ role }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const navItems = role === 'admin' 
    ? [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
        { label: 'Students', icon: Users, href: '/admin/students' },
        { label: 'Seats', icon: Grid, href: '/admin/seats' },
      ]
    : [
        { label: 'My Passport', icon: UserCircle, href: '/student/dashboard' },
      ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold font-headline text-primary">BSP</span>
          <span className="hidden sm:inline-block font-headline text-lg">BHATI STUDY POINT</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2 h-9 px-3 font-medium",
                  pathname === item.href && "bg-accent text-accent-foreground"
                )}
                onClick={() => router.push(item.href)}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Button>
            ))}
          </div>
          
          <Button variant="outline" size="sm" onClick={handleLogout} className="h-9 gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}

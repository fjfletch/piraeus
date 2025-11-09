"use client";

import { Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/my-mcps", label: "My MCPs" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/docs", label: "Documentation" },
    { href: "/developer", label: "API" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <img 
            src="https://customer-assets.emergentagent.com/job_no-code-llm/artifacts/xbsi69r0_Screenshot_2025-11-08_at_10.53.35_PM-removebg-preview.png" 
            alt="Piraeus Logo" 
            className="h-8 w-auto"
          />
          <span className="font-semibold text-lg">Piraeus</span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  size="sm"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
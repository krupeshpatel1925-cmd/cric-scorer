"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Users,
  UserCheck,
  BarChart3,
  PlusCircle,
  LogIn,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import ThemeSwitcher, { MobileThemeSelector } from "./ThemeSwitcher";
import CricketLogo from "./CricketLogo";
import { InstallAppButton } from "./PWAInstallPrompt";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {}
    }
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch {}
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/matches", label: "Matches", icon: Trophy },
    { href: "/teams", label: "Teams", icon: Users },
    { href: "/players", label: "Players", icon: UserCheck },
    { href: "/statistics", label: "Statistics", icon: BarChart3 },
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/dashboard" className="inline-block">
            <CricketLogo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "cricket-nav-link-active bg-emerald-500/15 border border-emerald-500/30 font-bold"
                      : "text-slate-300 hover:text-white hover:bg-slate-900 font-medium"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs & Auth */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeSwitcher />

            <Link
              href="/matches/create"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-neon transition-all hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              New Match
            </Link>

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-500">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Hamburger & Theme Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeSwitcher />
            <Link
              href="/matches/create"
              className="bg-emerald-500 text-white p-2 rounded-lg text-xs font-bold"
            >
              <PlusCircle className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-colors ${
                    isActive
                      ? "cricket-nav-link-active bg-emerald-500/15 font-bold"
                      : "text-slate-300 font-medium"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile Install App Button */}
            <InstallAppButton className="w-full justify-center bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white py-2.5 my-2" />

            {/* Mobile Theme Selector */}
            <MobileThemeSelector />
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              {user ? (
                <>
                  <div className="text-xs text-slate-400">
                    Signed in as <span className="font-semibold text-slate-200">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-red-400 font-semibold px-2 py-1 rounded bg-red-500/10"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-sm font-semibold bg-slate-900 text-white py-2 rounded-lg"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Floating Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800/80 px-2 py-1 flex items-center justify-around">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] transition-colors ${
                isActive
                  ? "cricket-nav-link-active font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  LayoutDashboard,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard/orders", label: "Active Orders", icon: ShoppingCart },
    { href: "/dashboard/inventory", label: "Lens Inventory", icon: Package },
    {
      href: "/dashboard/breaches",
      label: "Breach Alerts",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <LayoutDashboard className="text-white" size={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Eluno OMS
          </h1>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto text-xs text-slate-400 px-4">
          v2.0 • Realtime Sync
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ConnectivityIndicator } from "@/components/ConnectivityIndicator";

const NAV_LINKS = [
  { href: "/whatsapp", label: "WhatsApp" },
  { href: "/voice-agent", label: "Voice Agent" },
  { href: "/assistant", label: "AI Assistant" },
  { href: "/evidence-receipt", label: "Evidence Receipt" },
];

export function TopNav({
  connectivity,
  t,
  pendingCount,
  isSyncing,
}: {
  connectivity: "online" | "weak" | "offline";
  t: (key: string, vars?: Record<string, string | number>) => string;
  pendingCount: number;
  isSyncing: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="premium-nav">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" href="/" aria-label="SatyaSetu home">
          <div className="brand-orbit"><ShieldCheck size={21} /></div>
          <div>
            <div className="text-base font-black text-white">SatyaSetu</div>
            <div className="text-xs font-bold text-cyan-100/75">National trust infrastructure</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-bold text-cyan-50/78 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              className={`nav-link ${pathname === link.href ? "nav-link-active" : ""}`}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ConnectivityIndicator connectivity={connectivity} t={t} pendingCount={pendingCount} isSyncing={isSyncing} />
        </div>
      </div>
    </header>
  );
}

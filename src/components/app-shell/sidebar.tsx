"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

import { PRIMARY_NAV, SETTINGS_NAV, isActive, type NavItem } from "./nav-items";
import { brand } from "@/lib/brand";

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string | null }) {
  const active = isActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-10 items-center gap-3 rounded-sm px-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary-soft text-primary"
          : "text-text-muted hover:bg-surface-muted hover:text-text",
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          active ? "text-primary" : "text-text-muted group-hover:text-text",
        )}
        aria-hidden="true"
        strokeWidth={active ? 2.25 : 2}
      />
      {item.label}
    </Link>
  );
}

/** Persistent desktop navigation (≥ 1024 px). */
/**
 * The active link depends on the URL, which isn't known while prerendering routes
 * with dynamic segments, so the navigation streams in with a no-highlight fallback.
 */
export function Sidebar({ account }: { account: ReactNode }) {
  return (
    <Suspense fallback={<SidebarView account={account} pathname={null} />}>
      <SidebarWithPath account={account} />
    </Suspense>
  );
}

function SidebarWithPath({ account }: { account: ReactNode }) {
  return <SidebarView account={account} pathname={usePathname()} />;
}

function SidebarView({ account, pathname }: { account: ReactNode; pathname: string | null }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/app" aria-label={`${brand.name} overview`} className="rounded-sm">
          <Logo />
        </Link>
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-0.5">
          {PRIMARY_NAV.map((item) => (
            <li key={item.href}>
              <SidebarLink item={item} pathname={pathname} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-border px-3 py-3">
        <SidebarLink item={SETTINGS_NAV} pathname={pathname} />
        <div className="mt-2">{account}</div>
      </div>
    </aside>
  );
}

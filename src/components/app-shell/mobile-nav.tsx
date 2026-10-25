"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { Dialog, DialogClose, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

import { BOTTOM_NAV, PRIMARY_NAV, SETTINGS_NAV, isActive } from "./nav-items";
import { brand } from "@/lib/brand";

/** Top bar with menu (all destinations) and a bottom bar for the main four, below 1024 px. */
/**
 * The active link depends on the URL, which isn't known while prerendering routes
 * with dynamic segments, so the navigation streams in with a no-highlight fallback.
 */
export function MobileNav({ account }: { account: ReactNode }) {
  return (
    <Suspense fallback={<MobileNavView account={account} pathname={null} />}>
      <MobileNavWithPath account={account} />
    </Suspense>
  );
}

function MobileNavWithPath({ account }: { account: ReactNode }) {
  return <MobileNavView account={account} pathname={usePathname()} />;
}

function MobileNavView({ account, pathname }: { account: ReactNode; pathname: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Link href="/app" aria-label={`${brand.name} overview`} className="rounded-sm">
          <Logo />
        </Link>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-sm text-text hover:bg-surface-muted"
              aria-label="Open menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </DialogTrigger>
          <SheetContent title="Menu">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-semibold">Menu</span>
              <DialogClose asChild>
                <button
                  type="button"
                  className="grid size-11 place-items-center rounded-sm hover:bg-surface-muted"
                  aria-label="Close menu"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </DialogClose>
            </div>
            <nav aria-label="Main" className="flex-1 overflow-y-auto p-3">
              <ul className="flex flex-col gap-0.5">
                {[...PRIMARY_NAV, SETTINGS_NAV].map((item) => {
                  const active = isActive(pathname, item);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-12 items-center gap-3 rounded-sm px-3 text-[0.9375rem] font-medium",
                          active
                            ? "bg-primary-soft text-primary"
                            : "text-text hover:bg-surface-muted",
                        )}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t border-border p-3">{account}</div>
          </SheetContent>
        </Dialog>
      </header>

      <nav
        aria-label="Quick"
        data-bottom-nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
          {BOTTOM_NAV.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium",
                    active ? "text-primary" : "text-text-muted",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" strokeWidth={active ? 2.25 : 2} />
                  {item.shortLabel}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

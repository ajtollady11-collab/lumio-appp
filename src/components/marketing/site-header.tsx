"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Dialog, DialogClose, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { brand } from "@/lib/brand";

const LINKS = [
  { href: "/#product", label: "Product" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-8">
        <Link href="/" aria-label={`${brand.name} home`} className="rounded-sm">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 md:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="rounded-sm px-3 py-2 text-sm font-medium text-text-muted hover:text-text"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <ButtonLink href="/login" variant="ghost">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup">Get started</ButtonLink>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="ml-auto grid size-10 place-items-center rounded-sm hover:bg-surface-muted md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </DialogTrigger>
          <SheetContent title="Menu">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo />
              <DialogClose
                className="grid size-10 place-items-center rounded-sm hover:bg-surface-muted"
                aria-label="Close menu"
              >
                <X className="size-5" aria-hidden="true" />
              </DialogClose>
            </div>
            <nav aria-label="Main" className="flex flex-1 flex-col p-3">
              <ul className="flex flex-col gap-1">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex h-11 items-center rounded-sm px-3 text-[0.9375rem] font-medium hover:bg-surface-muted"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
                <ButtonLink href="/signup" size="lg">
                  Get started
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary" size="lg">
                  Log in
                </ButtonLink>
              </div>
            </nav>
          </SheetContent>
        </Dialog>
      </div>
    </header>
  );
}

import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { brand } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-text-muted">{brand.tagline}</p>
        </div>
        <nav aria-label="Legal">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
            <li>
              <Link href="/privacy" className="hover:text-text">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-text">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-text">
                Log in
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

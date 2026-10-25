import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { brand } from "@/lib/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <Link href="/" aria-label={`${brand.name} home`} className="rounded-sm">
          <Logo />
        </Link>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 justify-center px-4 pt-6 pb-16 focus:outline-none sm:pt-14"
      >
        <div className="w-full max-w-[25rem]">{children}</div>
      </main>
      <footer className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-4 pb-8 text-sm text-text-muted">
        <Link href="/privacy" className="hover:text-text">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-text">
          Terms
        </Link>
      </footer>
    </div>
  );
}

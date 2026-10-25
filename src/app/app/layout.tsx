import { Suspense } from "react";

import { AccountSummarySkeleton } from "@/components/app-shell/account-summary";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { Sidebar } from "@/components/app-shell/sidebar";
import { ToastProvider } from "@/components/ui/toast";

import { Account } from "./_components/account";

/**
 * Authenticated application shell. The layout itself is static; anything that
 * reads the session streams in behind a Suspense boundary. Each page verifies the
 * user again before loading data (the proxy redirect is only a convenience).
 */
export default function AppLayout({ children }: LayoutProps<"/app">) {
  const account = (
    <Suspense fallback={<AccountSummarySkeleton />}>
      <Account />
    </Suspense>
  );
  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-1 flex-col lg:pl-[var(--sidebar-width)]">
        <Sidebar account={account} />
        <MobileNav account={account} />
        <main id="main" tabIndex={-1} className="flex w-full flex-1 flex-col focus:outline-none">
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

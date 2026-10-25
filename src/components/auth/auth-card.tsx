import type { ReactNode } from "react";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-semibold tracking-[-0.015em]">{title}</h1>
        {description ? (
          <p className="mt-1.5 text-[0.9375rem] text-text-muted">{description}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
      {footer ? <p className="mt-6 text-center text-sm text-text-muted">{footer}</p> : null}
    </>
  );
}

export function NotConfiguredNotice() {
  return (
    <p role="status" className="rounded-sm bg-warning-soft px-3 py-2.5 text-sm text-text">
      Accounts aren&apos;t available yet: this deployment hasn&apos;t been connected to its
      authentication service.
    </p>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-20 sm:px-8"
    >
      <h1 className="font-display text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-4 text-lg text-text-muted">
        This address doesn&apos;t match any page. Check the link, or go back to the home page.
      </p>
      <Link href="/" className="mt-8 w-fit font-semibold text-primary underline underline-offset-4">
        Go to the home page
      </Link>
    </main>
  );
}

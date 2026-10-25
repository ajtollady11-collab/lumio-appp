import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-20 sm:px-8"
    >
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em]">Page not found</h1>
      <p className="mt-3 text-[0.9375rem] text-text-muted">
        This address doesn&apos;t match any page. Check the link, or head back home.
      </p>
      <ButtonLink href="/" className="mt-8 w-fit">
        Go to the home page
      </ButtonLink>
    </main>
  );
}

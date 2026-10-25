import { WorkedExample } from "@/components/marketing/worked-example";
import { brand } from "@/lib/brand";

/**
 * Pre-launch holding page.
 * It states plainly that the product is in development: no sign-up, no pricing,
 * no claims about features that have not been built and tested.
 */
export default function HomePage() {
  return (
    <>
      <header className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-8 sm:pt-10">
        <p className="font-display text-xl font-semibold tracking-tight">{brand.name}</p>
      </header>

      <main
        id="main"
        className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16"
      >
        <div className="max-w-xl">
          <h1
            className="font-display text-[2.5rem] leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl"
            style={{ fontVariationSettings: '"SOFT" 60' }}
          >
            A GCSE Maths tutor that finds the step where it went wrong.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-pretty text-text-muted">
            {brand.name} is an AI tutor being built for GCSE Maths students in England. It will
            explain topics, set practice, check your working and plan your revision from what you
            actually did, not from guesses.
          </p>
          <p className="mt-8 border-l-4 border-accent pl-4 text-[0.9375rem]">
            {brand.name} is in development and not open to students yet.
          </p>
        </div>

        <WorkedExample />
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-8 text-sm text-text-muted sm:px-8">
        © {brand.name}
      </footer>
    </>
  );
}

import { AddressSearch } from "@/components/AddressSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { fr } from "@/presentation/i18n/fr";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-8 font-sans md:px-6 md:py-16 dark:bg-black">
      <main className="flex w-full max-w-6xl flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm md:gap-8 md:p-8 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {fr.home.title}
          </h1>
          <ThemeToggle />
        </div>
        <AddressSearch />
      </main>
    </div>
  );
}

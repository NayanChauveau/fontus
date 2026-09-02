import { AddressSearch } from "@/components/AddressSearch";
import { fr } from "@/presentation/i18n/fr";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col gap-8 rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {fr.home.title}
        </h1>
        <AddressSearch />
      </main>
    </div>
  );
}

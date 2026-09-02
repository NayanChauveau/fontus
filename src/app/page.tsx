import { AddressSearch } from "@/components/AddressSearch";
import { HomeHeader } from "@/components/HomeHeader";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-8 font-sans md:px-6 md:py-16 dark:bg-black">
      <main className="flex w-full max-w-6xl flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm md:gap-8 md:p-8 dark:bg-zinc-950">
        <HomeHeader />
        <AddressSearch />
      </main>
    </div>
  );
}

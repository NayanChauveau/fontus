import { ensureApplication } from "@/composition/bootstrap";
import { fr } from "@/presentation/i18n/fr";
import { mapHealthDtoToStackStatus } from "@/presentation/mappers/mapHealthDtoToStackStatus";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dto = await ensureApplication().healthCheckUseCase.execute();
  const status = mapHealthDtoToStackStatus(dto);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col gap-6 rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {fr.home.title}
        </h1>
        <p
          className={`text-4xl font-semibold ${status.stackOk ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}
        >
          {status.stackOk ? fr.home.stackOk : fr.home.stackKo}
        </p>
        <dl className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <div>
            <dt className="font-medium text-zinc-800 dark:text-zinc-200">
              Postgres
            </dt>
            <dd>{status.postgresOk ? fr.home.postgresOk : fr.home.postgresKo}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-800 dark:text-zinc-200">
              {fr.home.checkedAt}
            </dt>
            <dd>{status.checkedAt}</dd>
          </div>
        </dl>
      </main>
    </div>
  );
}

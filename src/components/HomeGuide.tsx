import type { Messages } from "@/presentation/i18n/messages";

export function HomeGuide({ messages }: { messages: Messages }) {
  const guide = messages.home.guide;

  return (
    <div className="flex flex-col gap-6 border-t border-zinc-200 pt-6 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {guide.howTitle}
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>{guide.howStep1}</li>
          <li>{guide.howStep2}</li>
          <li>{guide.howStep3}</li>
        </ol>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {guide.sourcesTitle}
        </h2>
        <p className="mt-2">{guide.sourcesBody}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {guide.paramsTitle}
        </h2>
        <p className="mt-2">{guide.paramsIntro}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{guide.paramPfas}</li>
          <li>{guide.paramNitrates}</li>
          <li>{guide.paramLead}</li>
          <li>{guide.paramPesticides}</li>
          <li>{guide.paramMicrobio}</li>
          <li>{guide.paramHardness}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {guide.limitsTitle}
        </h2>
        <p className="mt-2">{guide.limitsBody}</p>
      </section>
    </div>
  );
}

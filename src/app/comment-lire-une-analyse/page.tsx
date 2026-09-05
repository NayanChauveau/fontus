import type { Metadata } from "next";
import { EditorialPage } from "@/components/EditorialPage";
import { HomeCta } from "@/components/HomeCta";
import { requestMessages } from "@/presentation/i18n/requestLocale";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await requestMessages();
  return {
    title: messages.pages.how.title,
    description: messages.pages.how.description,
    alternates: { canonical: "/comment-lire-une-analyse" },
  };
}

export default async function HowToReadPage() {
  const messages = await requestMessages();
  const copy = messages.pages.how;
  return (
    <EditorialPage
      messages={messages}
      title={copy.title}
      crumb={messages.nav.howToRead}
    >
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {copy.arsTitle}
        </h2>
        <p className="mt-2">{copy.arsBody}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {copy.limitsTitle}
        </h2>
        <p className="mt-2">{copy.limitsBody}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {copy.valueTitle}
        </h2>
        <p className="mt-2">{copy.valueBody}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {copy.pfasTitle}
        </h2>
        <p className="mt-2">{copy.pfasBody}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {copy.datesTitle}
        </h2>
        <p className="mt-2">{copy.datesBody}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {copy.compareTitle}
        </h2>
        <p className="mt-2">{copy.compareBody}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {copy.contactTitle}
        </h2>
        <p className="mt-2">{copy.contactBody}</p>
      </section>
      <HomeCta label={messages.pages.cta} />
    </EditorialPage>
  );
}

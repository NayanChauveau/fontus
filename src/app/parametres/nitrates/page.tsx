import type { Metadata } from "next";
import { EditorialPage } from "@/components/EditorialPage";
import { HomeCta } from "@/components/HomeCta";
import { LegalLimitBlock } from "@/components/LegalLimitBlock";
import { requestLocale, requestMessages } from "@/presentation/i18n/requestLocale";
import { intlLocale } from "@/presentation/i18n/messages";
import { requireFrenchLegalLimits } from "@/presentation/mappers/requireFrenchLegalLimits";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await requestMessages();
  return {
    title: messages.pages.nitrates.title,
    description: messages.pages.nitrates.description,
    alternates: { canonical: "/parametres/nitrates" },
  };
}

export default async function NitratesPage() {
  const locale = await requestLocale();
  const messages = await requestMessages();
  const copy = messages.pages.nitrates;
  const limits = requireFrenchLegalLimits("nitrates", locale);
  return (
    <EditorialPage
      messages={messages}
      title={copy.title}
      crumb={messages.nav.nitrates}
    >
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {copy.whatTitle}
        </h2>
        <p className="mt-2">{copy.whatBody}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {copy.limitTitle}
        </h2>
        <div className="mt-2 flex flex-col gap-2">
          <LegalLimitBlock
            messages={messages}
            limits={limits}
            locale={intlLocale(locale)}
          />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {copy.compareTitle}
        </h2>
        <p className="mt-2">{copy.compareBody}</p>
      </section>
      <HomeCta label={messages.pages.cta} />
    </EditorialPage>
  );
}

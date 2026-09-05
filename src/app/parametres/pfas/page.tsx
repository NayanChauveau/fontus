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
    title: messages.pages.pfas.title,
    description: messages.pages.pfas.description,
    alternates: { canonical: "/parametres/pfas" },
  };
}

export default async function PfasPage() {
  const locale = await requestLocale();
  const messages = await requestMessages();
  const copy = messages.pages.pfas;
  const limits = requireFrenchLegalLimits("pfas20", locale);
  return (
    <EditorialPage messages={messages} title={copy.title} crumb={messages.nav.pfas}>
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

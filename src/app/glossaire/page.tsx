import type { Metadata } from "next";
import { EditorialPage } from "@/components/EditorialPage";
import { HomeCta } from "@/components/HomeCta";
import { requestMessages } from "@/presentation/i18n/requestLocale";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await requestMessages();
  return {
    title: messages.pages.glossary.title,
    description: messages.pages.glossary.description,
    alternates: { canonical: "/glossaire" },
  };
}

export default async function GlossaryPage() {
  const messages = await requestMessages();
  const copy = messages.pages.glossary;
  const terms = [
    { term: copy.udiTerm, definition: copy.udiDef },
    { term: copy.inseeTerm, definition: copy.inseeDef },
    { term: copy.lqTerm, definition: copy.lqDef },
    { term: copy.pfas20Term, definition: copy.pfas20Def },
    { term: copy.thTerm, definition: copy.thDef },
    { term: copy.siseTerm, definition: copy.siseDef },
    { term: copy.hubeauTerm, definition: copy.hubeauDef },
    { term: copy.legalTerm, definition: copy.legalDef },
    { term: copy.qualityTerm, definition: copy.qualityDef },
  ];
  return (
    <EditorialPage
      messages={messages}
      title={copy.title}
      crumb={messages.nav.glossary}
    >
      <dl className="flex flex-col gap-4">
        {terms.map((entry) => (
          <div key={entry.term}>
            <dt className="font-semibold text-zinc-950 dark:text-zinc-50">
              {entry.term}
            </dt>
            <dd className="mt-1">{entry.definition}</dd>
          </div>
        ))}
      </dl>
      <HomeCta label={messages.pages.cta} />
    </EditorialPage>
  );
}

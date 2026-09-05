import type { Metadata } from "next";
import { EditorialPage } from "@/components/EditorialPage";
import { HomeCta } from "@/components/HomeCta";
import { faqPageJsonLd } from "@/presentation/editorial/faqPageJsonLd";
import { requestMessages } from "@/presentation/i18n/requestLocale";

function faqItems(messages: Awaited<ReturnType<typeof requestMessages>>) {
  const faq = messages.pages.faq;
  return [
    { question: faq.potableQ, answer: faq.potableA },
    { question: faq.udiQ, answer: faq.udiA },
    { question: faq.whereQ, answer: faq.whereA },
    { question: faq.paramsQ, answer: faq.paramsA },
    { question: faq.officialQ, answer: faq.officialA },
    { question: faq.freshQ, answer: faq.freshA },
    { question: faq.drinkQ, answer: faq.drinkA },
  ];
}

export async function generateMetadata(): Promise<Metadata> {
  const messages = await requestMessages();
  return {
    title: messages.pages.faq.title,
    description: messages.pages.faq.description,
    alternates: { canonical: "/faq" },
  };
}

export default async function FaqPage() {
  const messages = await requestMessages();
  const items = faqItems(messages);
  return (
    <EditorialPage
      messages={messages}
      title={messages.pages.faq.title}
      crumb={messages.nav.faq}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageJsonLd(items)),
        }}
      />
      {items.map((item) => (
        <section key={item.question}>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            {item.question}
          </h2>
          <p className="mt-2">{item.answer}</p>
        </section>
      ))}
      <HomeCta label={messages.pages.cta} />
    </EditorialPage>
  );
}

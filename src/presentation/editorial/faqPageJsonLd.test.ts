import { describe, expect, it } from "vitest";
import { faqPageJsonLd } from "./faqPageJsonLd";

describe("faqPageJsonLd", () => {
  it("builds a FAQPage graph from questions", () => {
    expect(
      faqPageJsonLd([
        { question: "Où voir mon UDI ?", answer: "Sur la facture d’eau." },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Où voir mon UDI ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sur la facture d’eau.",
          },
        },
      ],
    });
  });
});

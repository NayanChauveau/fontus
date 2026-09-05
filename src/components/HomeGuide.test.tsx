/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getMessages } from "@/presentation/i18n/messages";
import { HomeGuide } from "./HomeGuide";

describe("HomeGuide", () => {
  it("explains the tool without a second h1 or invented limits", () => {
    render(<HomeGuide messages={getMessages("fr")} />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Comment consulter la qualité de l’eau du robinet",
      }),
    ).toBeTruthy();
    const text = document.body.textContent ?? "";
    for (const word of [
      "qualité de l’eau",
      "eau potable",
      "commune",
      "UDI",
      "PFAS",
      "nitrates",
      "plomb",
      "pesticides",
      "ARS",
      "SISE-Eaux",
      "Hub’Eau",
      "norme",
      "conformité",
    ]) {
      expect(text).toContain(word);
    }
    expect(text).not.toMatch(/\d+\s*(µg|mg)\s*\/\s*L/i);
    expect(
      screen.getByRole("link", { name: "Voir les grandes villes" }).getAttribute(
        "href",
      ),
    ).toBe("/eau-robinet");
  });
});

/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

describe("legal pages", () => {
  it("renders mentions and privacy copy", async () => {
    const mentions = await import("./page");
    render(await mentions.default());
    expect(
      screen.getByRole("heading", { name: "Mentions légales" }),
    ).toBeTruthy();
    expect(document.getElementById("contenu")?.tagName).toBe("MAIN");
    await expect(mentions.generateMetadata()).resolves.toMatchObject({
      title: "Mentions légales",
      description:
        "Éditeur, sources Hub’Eau / SISE-Eaux et hébergement de Fontus, comparateur d’analyses de l’eau du robinet.",
      alternates: { canonical: "/mentions-legales" },
    });

    const privacy = await import("../confidentialite/page");
    render(await privacy.default());
    expect(
      screen.getByRole("heading", { name: "Politique de confidentialité" }),
    ).toBeTruthy();
    await expect(privacy.generateMetadata()).resolves.toMatchObject({
      title: "Politique de confidentialité",
      description:
        "Données traitées par Fontus : adresse BAN, quota IP, cookie de langue. Pas de compte utilisateur.",
      alternates: { canonical: "/confidentialite" },
    });
  });
});

import { describe, expect, it } from "vitest";
import { getMessages } from "@/presentation/i18n/messages";
import { cityPageCopy } from "./cityPageCopy";

describe("cityPageCopy", () => {
  it("fills the city title and a unique description", () => {
    const copy = cityPageCopy(getMessages("fr"), {
      slug: "toulouse",
      insee: "31555",
      name: "Toulouse",
      department: "Haute-Garonne",
    });
    expect(copy).toEqual({
      title: "Qualité de l’eau du robinet à Toulouse",
      description:
        "Réseaux de distribution (UDI) et analyses officielles de l’eau du robinet à Toulouse (Haute-Garonne, 31555).",
      path: "/eau-robinet/toulouse",
    });
  });
});

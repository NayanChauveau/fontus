/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getMessages } from "@/presentation/i18n/messages";
import { presentFrenchLegalLimits } from "@/presentation/mappers/presentLegalLimit";
import { LegalLimitBlock } from "./LegalLimitBlock";

const AT = new Date("2026-09-05T00:00:00.000Z");

describe("LegalLimitBlock", () => {
  it("shows the current limit and hides an upcoming one when none exists", () => {
    const limits = presentFrenchLegalLimits("nitrates", AT, "fr-FR");
    if (!limits) {
      throw new Error("expected nitrates limit");
    }
    render(
      <LegalLimitBlock
        messages={getMessages("fr")}
        limits={limits}
        locale="fr-FR"
      />,
    );
    expect(screen.getByText(/50 mg\/L/)).toBeTruthy();
    expect(screen.queryByText(/À partir du/)).toBeNull();
  });
});

import type { Messages } from "@/presentation/i18n/messages";
import { fillTemplate } from "@/presentation/i18n/fillTemplate";
import {
  formatLimitDate,
  type PresentedLegalLimits,
} from "@/presentation/mappers/presentLegalLimit";

export function LegalLimitBlock({
  messages,
  limits,
  locale,
}: {
  messages: Messages;
  limits: PresentedLegalLimits;
  locale: string;
}) {
  return (
    <>
      <p>
        {fillTemplate(messages.pages.limitCurrent, {
          value: limits.current.valueLabel,
        })}
      </p>
      <p>
        {fillTemplate(messages.pages.limitSource, {
          citation: limits.current.citation,
        })}{" "}
        <a
          href={limits.current.sourceUrl}
          className="underline-offset-2 hover:underline"
          rel="noreferrer"
          target="_blank"
        >
          {limits.current.sourceUrl}
        </a>
      </p>
      {limits.upcoming ? (
        <p>
          {fillTemplate(messages.pages.limitUpcoming, {
            date: formatLimitDate(limits.upcoming.validFrom, locale),
            value: limits.upcoming.valueLabel,
          })}
        </p>
      ) : null}
    </>
  );
}

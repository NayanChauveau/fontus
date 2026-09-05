import { useMessages } from "@/presentation/i18n/useLocale";
import { SUPPORT_URL } from "@/presentation/site";

export function SupportLink({ className }: { className: string }) {
  const messages = useMessages();

  return (
    <a
      href={SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {messages.nav.support}
    </a>
  );
}

import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LOCALE_BOOTSTRAP_SCRIPT } from "@/presentation/i18n/locale";
import { getMessages, intlLocale } from "@/presentation/i18n/messages";
import { requestLocale } from "@/presentation/i18n/requestLocale";
import { siteJsonLd } from "@/presentation/seo/siteJsonLd";
import { SITE_NAME, SITE_ORIGIN } from "@/presentation/site";
import { THEME_BOOTSTRAP_SCRIPT } from "@/presentation/theme/theme";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { QueryProvider } from "@/presentation/query/QueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0369a1",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  const messages = getMessages(locale);
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: {
      default: messages.home.metaTitle,
      template: `%s | ${SITE_NAME}`,
    },
    description: messages.home.metaDescription,
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_GB" : "fr_FR",
      url: SITE_ORIGIN,
      siteName: SITE_NAME,
      title: messages.home.metaTitle,
      description: messages.home.metaDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: messages.home.metaTitle,
      description: messages.home.metaDescription,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await requestLocale();
  const messages = getMessages(locale);
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full min-h-dvh antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `${THEME_BOOTSTRAP_SCRIPT}${LOCALE_BOOTSTRAP_SCRIPT}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              siteJsonLd({
                description: messages.home.metaDescription,
                inLanguage: intlLocale(locale),
              }),
            ),
          }}
        />
      </head>
      <body suppressHydrationWarning className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-zinc-950 focus:shadow dark:focus:bg-zinc-900 dark:focus:text-zinc-50"
        >
          {messages.a11y.skipToContent}
        </a>
        <QueryProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </QueryProvider>
      </body>
    </html>
  );
}

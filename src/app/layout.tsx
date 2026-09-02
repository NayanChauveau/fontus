import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LOCALE_BOOTSTRAP_SCRIPT } from "@/presentation/i18n/locale";
import { THEME_BOOTSTRAP_SCRIPT } from "@/presentation/theme/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Qualité de l’eau du robinet",
  description:
    "Comparaison des analyses officielles de l’eau du robinet en France.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `${THEME_BOOTSTRAP_SCRIPT}${LOCALE_BOOTSTRAP_SCRIPT}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

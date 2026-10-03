import type { Metadata, Viewport } from "next";
import { Bangers, Inter } from "next/font/google";
import { Shell } from "@/components/Shell";
import { RegisterSW } from "@/components/RegisterSW";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const bangers = Bangers({ variable: "--font-bangers", weight: "400", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kakeibo",
  description: "Personal finance tracker: quick logging, weekly budget, savings power level.",
  appleWebApp: { capable: true, title: "Kakeibo", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e6" },
    { media: "(prefers-color-scheme: dark)", color: "#100f16" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bangers.variable} ${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <Shell>{children}</Shell>
        <RegisterSW />
      </body>
    </html>
  );
}

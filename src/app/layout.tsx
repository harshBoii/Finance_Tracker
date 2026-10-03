import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c, Nunito } from "next/font/google";
import { Shell } from "@/components/Shell";
import { RegisterSW } from "@/components/RegisterSW";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const rounded = M_PLUS_Rounded_1c({ variable: "--font-rounded", weight: ["700", "800"], subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

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
  themeColor: "#fbeef4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${rounded.variable} ${nunito.variable} antialiased`} suppressHydrationWarning>
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

import type { Metadata } from "next";
import { DM_Sans, Host_Grotesk, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  variable: "--font-host-grotesk",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jordan Create Admin & Registry",
  description:
    "Admin panel for the Jordan Create mobile app and data registry for the WhatsApp concierge bot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark h-full ${dmSans.variable} ${hostGrotesk.variable} ${playfair.variable}`}
    >
      <body className={`${dmSans.className} flex min-h-full flex-col`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

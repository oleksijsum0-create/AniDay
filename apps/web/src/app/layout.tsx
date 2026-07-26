import type { Metadata } from "next";
import { Golos_Text, Itim, Geist } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const itim = Itim({
  variable: "--font-itim",
  subsets: ["latin"],
  weight: ["400"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AniDay",
  description: "Anime catalog & streaming",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="uk"
      className={`${golos.variable} ${itim.variable} ${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#161513] text-[#eeecdd]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

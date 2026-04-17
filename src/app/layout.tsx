import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProdAPS",
  description: "Governanca de produtividade em tempo real para UBS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body
        suppressHydrationWarning
        className="min-h-full bg-background font-sans text-foreground"
      >
        {children}
        <Toaster
          closeButton
          expand
          position="top-right"
          richColors
          toastOptions={{
            className: "border border-border bg-card text-card-foreground",
          }}
        />
      </body>
    </html>
  );
}

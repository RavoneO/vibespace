
import type { Metadata } from "next";
import { Poppins } from 'next/font/google'
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body'
})

export const metadata: Metadata = {
  title: "Vibespace",
  description: "A modern social content sharing app.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} dark`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#020817" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider>
          <AuthProvider>
              {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}

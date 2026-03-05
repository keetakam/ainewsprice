import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "AI Pricing & News",
  description: "Compare AI model pricing from OpenRouter and stay up to date with AI news",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <Navbar />
          <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

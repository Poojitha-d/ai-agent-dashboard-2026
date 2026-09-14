import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Agent Dashboard 2026 - LLM Token & Cost Analytics",
  description:
    "Real-time analytics dashboard tracking LLM API usage, tokens, and costs across OpenAI, Anthropic, Google Gemini, and Azure.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

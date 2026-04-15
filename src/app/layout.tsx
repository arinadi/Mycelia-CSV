import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/features/Sidebar/Sidebar";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { RawDataModal } from "@/components/features/DataSourcePanel/RawDataModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mycelia CSV - LOCAL-FIRST ANALYTICS",
  description: "Natural language to SQL for large CSVs locally.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <ErrorBoundary>
            <aside className="flex-shrink-0 hidden lg:block">
              <Sidebar />
            </aside>
            <main className="flex-1 flex flex-col overflow-hidden p-6">
              {children}
            </main>
          </ErrorBoundary>
        </div>
        <Footer />
        <RawDataModal />
      </body>
    </html>
  );
}

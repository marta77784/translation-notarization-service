import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export const metadata: Metadata = {
    title: "Translation & Notarization Service",
    description: "Professional document translation and notarization",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
        >
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">
                    Translation & Notarization
                </h1>
                <nav className="flex gap-4">
                    <a href="/" className="text-gray-600 hover:text-gray-900 text-sm">
                        Home
                    </a>
                    <a href="/login" className="text-gray-600 hover:text-gray-900 text-sm">
                        Login
                    </a>
                    <a href="/register" className="text-gray-600 hover:text-gray-900 text-sm">
                        Register
                    </a>
                    <a href="/upload" className="text-gray-600 hover:text-gray-900 text-sm">
                        Upload
                    </a>
                    <a href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">
                        My Documents
                    </a>
                    <a href="/notary" className="text-gray-600 hover:text-gray-900 text-sm">
                        Notary
                    </a>
                </nav>
            </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
        </main>
        </body>
        </html>
    );
}
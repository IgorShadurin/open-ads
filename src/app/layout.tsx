import type { Metadata } from "next";
import { Fira_Code, Space_Grotesk } from "next/font/google";
import { Gauge, LayoutDashboard, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { getSessionUser } from "@/server/auth/guards";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Ads Portal",
  description: "Rewarded ad management platform for iOS apps",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionUser = await getSessionUser();

  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${firaCode.variable}`}>
        <div className="site-bg" aria-hidden />
        <header className="topbar">
          <Link href="/" className="brand">
            <Gauge size={18} />
            <span>OpenAds</span>
          </Link>

          <nav className="topnav">
            {sessionUser ? (
              <>
                <Link href="/dashboard" className="nav-link">
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                {sessionUser.role === "SUPER_ADMIN" ? (
                  <Link href="/admin" className="nav-link">
                    <ShieldCheck size={16} />
                    Admin
                  </Link>
                ) : null}
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link">
                  <LogIn size={16} />
                  Login
                </Link>
                <Link href="/register" className="btn btn-primary">
                  <UserPlus size={16} />
                  Register
                </Link>
              </>
            )}
          </nav>
        </header>

        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}

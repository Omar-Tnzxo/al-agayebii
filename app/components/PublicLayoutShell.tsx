"use client";
import { usePathname } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import ClientRoot from "@/components/ClientRoot";
import { Analytics } from "../components/Analytics";
import { Hotjar } from "../components/Hotjar";
import React from "react";

export function PublicLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <>
      {!isDashboard && <Header />}
      <ClientRoot>
        <div className="flex-grow flex flex-col">{children}</div>
      </ClientRoot>
      {!isDashboard && <Footer />}
      <Analytics />
      <Hotjar />
    </>
  );
} 
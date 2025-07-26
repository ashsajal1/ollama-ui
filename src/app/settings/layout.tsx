import Navbar from "@/components/navbar";
import React from "react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex flex-col min-h-screen mt-[80px]"> {children}</main>
    </>
  );
}
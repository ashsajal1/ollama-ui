import React from "react";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import Link from "next/link";
import { Bell } from "lucide-react";

export default async function Navbar() {
  return (
    <nav className="p-4 z-10 fixed backdrop-blur-2xl top-0 w-full h-[80px] border-b flex items-center justify-between">
      <Link className="font-bold cursor-pointer" href="/">
        Logo
      </Link>

      <div className="flex items-center gap-2">
        <ModeToggle />

        <Link href="/notification">
          <Button size={"icon"} variant={"outline"}>
            <Bell className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </nav>
  );
}

import { storage } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const chats = await storage.getAllChats();
    return NextResponse.json(chats);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

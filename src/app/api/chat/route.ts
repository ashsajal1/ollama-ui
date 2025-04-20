import { storage } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, message } = body;

  try {
    const chat = await storage.createChat(name);
    return NextResponse.json(chat);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}

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

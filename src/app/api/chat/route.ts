import { storage } from "@/lib/storage";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const chat = await prisma.chat.create({
      data: {
        name: name || "New chat",
      },
    });
    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
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

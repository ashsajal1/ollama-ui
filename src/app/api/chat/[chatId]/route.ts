import { storage } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  const { name } = await req.json();

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json(
      { error: "Valid name is required in the request body" },
      { status: 400 }
    );
  }

  try {
    const updatedChat = await storage.updateChat(chatId, name.trim());
    
    if (!updatedChat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error("Failed to update chat:", error);
    return NextResponse.json(
      { error: "Failed to update chat" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;

  try {
    await storage.deleteChat(chatId);
    return NextResponse.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Failed to delete chat:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}
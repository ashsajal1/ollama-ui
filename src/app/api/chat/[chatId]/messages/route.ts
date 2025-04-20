import { storage } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  const { messages } = await req.json();

  try {
    const updatedChat = await storage.addMessages(chatId, messages);
    
    if (!updatedChat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json(updatedChat);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update chat messages" },
      { status: 500 }
    );
  }
}

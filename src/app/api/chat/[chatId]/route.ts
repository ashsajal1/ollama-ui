import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
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
    const updatedChat = await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        name: name.trim(),
        updatedAt: new Date(),
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json(updatedChat);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
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
    // Delete associated messages first
    await prisma.message.deleteMany({
      where: {
        chatId: chatId,
      },
    });

    // Delete the chat
    await prisma.chat.delete({
      where: {
        id: chatId,
      },
    });

    return NextResponse.json({ message: "Chat deleted successfully" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    console.error("Failed to delete chat:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}
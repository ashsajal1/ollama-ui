import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  const { messages } = await req.json();

  try {
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        messages: {
          create: messages.map((msg: any) => ({
            content: msg.content,
            role: msg.role,
          })),
        },
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json(updatedChat);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update chat messages" },
      { status: 500 }
    );
  }
}

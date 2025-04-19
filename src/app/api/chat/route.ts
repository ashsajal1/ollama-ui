import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, message } = body;

  try {
    const chat = await prisma.chat.create({
      data: {
        name,
      },
    });

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
    const chats = await prisma.chat.findMany({
      include: {
        messages: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(chats);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

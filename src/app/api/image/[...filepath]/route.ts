import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: { filepath: string[] } }
) {
  try {
    const filepath = path.join(...params.filepath);
    
    if (!fs.existsSync(filepath)) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const imageBuffer = fs.readFileSync(filepath);
    const contentType = path.extname(filepath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

    // Clean up the temporary file after serving it
    fs.unlinkSync(filepath);

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse("Error serving image", { status: 500 });
  }
}
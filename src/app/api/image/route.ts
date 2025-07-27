
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const extension = image.name.split(".").pop();
    const filename = `image-${uniqueSuffix}.${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(uploadDir, filename);

    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filepath, buffer);

    const imageUrl = `/api/image?file=${filename}`;

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');

  if (!file) {
    return NextResponse.json({ error: 'File parameter is missing' }, { status: 400 });
  }

  // Sanitize the file name to prevent directory traversal
  const sanitizedFile = path.basename(file);
  const fullPath = path.join(process.cwd(), 'public', 'uploads', sanitizedFile);

  try {
    if (fs.existsSync(fullPath)) {
      const fileBuffer = fs.readFileSync(fullPath);
      const extension = path.extname(fullPath).toLowerCase();
      let contentType = 'application/octet-stream';
      if (extension === '.png') {
        contentType = 'image/png';
      } else if (extension === '.jpg' || extension === '.jpeg') {
        contentType = 'image/jpeg';
      } else if (extension === '.gif') {
        contentType = 'image/gif';
      } else if (extension === '.webp') {
        contentType = 'image/webp';
      }
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: { 'Content-Type': contentType },
      });
    } else {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}

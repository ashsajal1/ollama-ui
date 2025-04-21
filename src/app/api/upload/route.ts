import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Create a unique temporary filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const extension = image.name.split(".").pop();
    const filename = `image-${uniqueSuffix}.${extension}`;
    const tmpDir = os.tmpdir();
    const filepath = path.join(tmpDir, filename);

    // Convert file to buffer and save to temp directory
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filepath, buffer);

    // Return the filepath (not URL) for temporary access
    return NextResponse.json({ filepath });

  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
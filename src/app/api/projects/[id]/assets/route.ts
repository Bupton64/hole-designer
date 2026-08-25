import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "projects");

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const assetsDir = path.join(DATA_DIR, id, "assets");
  await fs.mkdir(assetsDir, { recursive: true });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Sanitise filename: keep extension, prefix with timestamp to avoid collisions
  const ext = path.extname(file.name) || ".png";
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(assetsDir, safeName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // Return the URL that can be used to load this image
  const url = `/api/projects/${id}/assets/${safeName}`;

  return NextResponse.json({ url, filename: safeName }, { status: 201 });
}

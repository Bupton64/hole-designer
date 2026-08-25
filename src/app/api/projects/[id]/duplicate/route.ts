import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Project } from "@/types/project";

const PROJECTS_DIR = path.join(process.cwd(), "data", "projects");

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const filePath = path.join(PROJECTS_DIR, `${id}.json`);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const source: Project = JSON.parse(content);

    const body = await request.json();
    const newName = body.name || `${source.name} (copy)`;

    const newId = `project-${Date.now()}`;
    const now = new Date().toISOString();

    // Deep clone the project with new IDs
    const duplicate: Project = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: newName,
      date: "", // Reset event date
      createdAt: now,
      updatedAt: now,
    };

    const newFilePath = path.join(PROJECTS_DIR, `${newId}.json`);
    await fs.writeFile(newFilePath, JSON.stringify(duplicate, null, 2), "utf-8");

    return NextResponse.json({ id: newId, name: newName }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Project } from "@/types/project";

const PROJECTS_DIR = path.join(process.cwd(), "data", "projects");

interface RouteParams {
  params: Promise<{ id: string; holeId: string; designId: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id, holeId, designId } = await params;
  const filePath = path.join(PROJECTS_DIR, `${id}.json`);

  try {
    const existing = await fs.readFile(filePath, "utf-8");
    const project: Project = JSON.parse(existing);

    const hole = project.holes.find((h) => h.id === holeId);
    if (!hole) {
      return NextResponse.json({ error: "Hole not found" }, { status: 404 });
    }

    const design = hole.designs.find((d) => d.id === designId);
    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const body = await request.json();

    // Update design fields
    if (body.canvas !== undefined) design.canvas = body.canvas;
    if (body.par !== undefined) design.par = body.par;
    if (body.distance !== undefined) design.distance = body.distance;
    if (body.obRules !== undefined) design.obRules = body.obRules;
    if (body.mandoNotes !== undefined) design.mandoNotes = body.mandoNotes;
    if (body.notes !== undefined) design.notes = body.notes;

    project.updatedAt = new Date().toISOString();

    await fs.writeFile(filePath, JSON.stringify(project, null, 2), "utf-8");

    return NextResponse.json(design);
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}

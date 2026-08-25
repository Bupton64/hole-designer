import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  Project,
  isLegacyProject,
  createDefaultSponsorTemplate,
  createDefaultLayout,
  createEmptyCanvas,
} from "@/types/project";

const PROJECTS_DIR = path.join(process.cwd(), "data", "projects");

interface RouteParams {
  params: Promise<{ id: string }>;
}

function migrateIfLegacy(data: unknown, id: string): Project {
  if (isLegacyProject(data)) {
    const defaultLayout = createDefaultLayout();
    return {
      id,
      name: (data as { name: string }).name,
      courseName: "",
      eventName: "",
      date: "",
      layouts: [defaultLayout],
      holes: [
        {
          id: `hole-${Date.now()}`,
          number: 1,
          name: "",
          designs: [
            {
              id: `design-${Date.now()}`,
              layoutId: defaultLayout.id,
              canvas: { shapes: data.shapes, backgroundColor: "#ffffff" },
              par: 3,
              distance: 0,
              obRules: "",
              mandoNotes: "",
              notes: "",
            },
          ],
        },
      ],
      sponsorTemplate: createDefaultSponsorTemplate(),
      courseMap: { backgroundImage: null, canvas: createEmptyCanvas() },
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
  return data as Project;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const filePath = path.join(PROJECTS_DIR, `${id}.json`);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const raw = JSON.parse(content);
    const project = migrateIfLegacy(raw, id);

    // Write back migrated format if it was legacy
    if (isLegacyProject(raw)) {
      await fs.writeFile(filePath, JSON.stringify(project, null, 2), "utf-8");
    }

    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const filePath = path.join(PROJECTS_DIR, `${id}.json`);

  try {
    const existing = await fs.readFile(filePath, "utf-8");
    const raw = JSON.parse(existing);
    const project = migrateIfLegacy(raw, id);

    const body = await request.json();

    const updated: Project = {
      ...project,
      name: body.name ?? project.name,
      courseName: body.courseName ?? project.courseName,
      eventName: body.eventName ?? project.eventName,
      date: body.date ?? project.date,
      layouts: body.layouts ?? project.layouts,
      holes: body.holes ?? project.holes,
      sponsorTemplate: body.sponsorTemplate ?? project.sponsorTemplate,
      courseMap: body.courseMap ?? project.courseMap,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), "utf-8");

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}

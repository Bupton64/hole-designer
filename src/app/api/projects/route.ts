import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  Project,
  ProjectSummary,
  createDefaultSponsorTemplate,
  createDefaultLayout,
  createEmptyCanvas,
  isLegacyProject,
} from "@/types/project";

const PROJECTS_DIR = path.join(process.cwd(), "data", "projects");

async function ensureProjectsDir() {
  await fs.mkdir(PROJECTS_DIR, { recursive: true });
}

function migrateIfLegacy(data: unknown, id: string): Project {
  if (isLegacyProject(data)) {
    const defaultLayout = createDefaultLayout();
    return {
      id,
      name: data.name,
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

export async function GET() {
  await ensureProjectsDir();

  const files = await fs.readdir(PROJECTS_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  const summaries: ProjectSummary[] = [];

  for (const file of jsonFiles) {
    const filePath = path.join(PROJECTS_DIR, file);
    const content = await fs.readFile(filePath, "utf-8");
    const raw = JSON.parse(content);
    const project = migrateIfLegacy(raw, raw.id);

    summaries.push({
      id: project.id,
      name: project.name,
      courseName: project.courseName,
      eventName: project.eventName,
      date: project.date,
      holeCount: project.holes.length,
      layoutCount: project.layouts.length,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  }

  summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return NextResponse.json(summaries);
}

export async function POST(request: Request) {
  await ensureProjectsDir();

  const body = await request.json();
  const { name, courseName, eventName, date, holeCount } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const id = `project-${Date.now()}`;
  const now = new Date().toISOString();
  const defaultLayout = createDefaultLayout();

  // Create holes based on requested count (default 18)
  const numHoles = typeof holeCount === "number" && holeCount > 0 ? holeCount : 18;
  const holes = Array.from({ length: numHoles }, (_, i) => ({
    id: `hole-${Date.now()}-${i + 1}`,
    number: i + 1,
    name: "",
    designs: [
      {
        id: `design-${Date.now()}-${i + 1}`,
        layoutId: defaultLayout.id,
        canvas: createEmptyCanvas(),
        par: 3,
        distance: 0,
        obRules: "",
        mandoNotes: "",
        notes: "",
      },
    ],
  }));

  const project: Project = {
    id,
    name,
    courseName: courseName ?? "",
    eventName: eventName ?? "",
    date: date ?? "",
    layouts: [defaultLayout],
    holes,
    sponsorTemplate: createDefaultSponsorTemplate(),
    courseMap: { backgroundImage: null, canvas: createEmptyCanvas() },
    createdAt: now,
    updatedAt: now,
  };

  const filePath = path.join(PROJECTS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(project, null, 2), "utf-8");

  return NextResponse.json(project, { status: 201 });
}

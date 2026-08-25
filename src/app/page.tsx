"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectSummary } from "@/types/project";

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [eventName, setEventName] = useState("");
  const [holeCount, setHoleCount] = useState(18);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data: ProjectSummary[] = await res.json();
        setProjects(data);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, courseName, eventName, holeCount }),
      });
      if (res.ok) {
        const project = await res.json();
        router.push(`/projects/${project.id}`);
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDuplicate(projectId: string, projectName: string) {
    const newName = window.prompt("Name for the copy:", `${projectName} (copy)`);
    if (!newName) return;
    const res = await fetch(`/api/projects/${projectId}/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      loadProjects();
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Hole Designer</h1>
          <p className="text-muted-foreground">
            Disc golf caddy book hole graphics
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Create project form */}
      {showCreate && (
        <div className="mb-8 rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">New Project</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Project Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Auckland Champs 2025"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Course Name</label>
              <Input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Woodhill"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Event Name</label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Auckland Disc Golf Championships"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Number of Holes</label>
              <Input
                type="number"
                min={1}
                max={36}
                value={holeCount}
                onChange={(e) => setHoleCount(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Projects list */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading projects...</p>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16">
          <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No projects yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first caddy book project to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <button
                onClick={() => router.push(`/projects/${project.id}`)}
                className="flex-1 text-left"
              >
                <p className="font-semibold">{project.name}</p>
                <p className="text-sm text-muted-foreground">
                  {[project.courseName, project.eventName]
                    .filter(Boolean)
                    .join(" — ") || "No details"}
                </p>
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right text-sm text-muted-foreground">
                  <p>
                    {project.holeCount} holes — {project.layoutCount} layout
                    {project.layoutCount !== 1 ? "s" : ""}
                  </p>
                  <p>
                    Updated{" "}
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate(project.id, project.name);
                  }}
                  title="Duplicate project"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

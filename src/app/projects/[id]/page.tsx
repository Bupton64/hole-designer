"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings, Map, Plus, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Project, Layout } from "@/types/project";
import { batchExportPdf, downloadPdf } from "@/lib/export/batchPdfExport";
import { HoleThumbnail } from "@/components/HoleThumbnail";

export default function ProjectHomePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLayout, setActiveLayout] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [dragHoleId, setDragHoleId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Failed to load project");
        const data: Project = await res.json();
        setProject(data);
        if (data.layouts.length > 0 && !activeLayout) {
          setActiveLayout(data.layouts[0].id);
        }
      } catch {
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    }
    loadProject();
  }, [projectId, router, activeLayout]);

  // Ctrl+Shift+E = batch export PDF (must be before early return to maintain hook order)
  useEffect(() => {
    function handleExportKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "E") {
        e.preventDefault();
        if (!isExporting && project) {
          const layout = project.layouts.find((l) => l.id === activeLayout) ?? project.layouts[0];
          if (layout) {
            setIsExporting(true);
            setExportProgress("Starting export...");
            batchExportPdf(project, layout.id, (progress) => {
              setExportProgress(`Rendering ${progress.holeName} (${progress.current}/${progress.total})`);
            })
              .then((pdfBytes) => {
                const layoutName = layout.name.toLowerCase().replace(/\s+/g, "-");
                downloadPdf(pdfBytes, `${project.name}-${layoutName}.pdf`);
                setExportProgress("");
              })
              .catch((err) => {
                setExportProgress(`Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
              })
              .finally(() => setIsExporting(false));
          }
        }
      }
    }
    window.addEventListener("keydown", handleExportKey);
    return () => window.removeEventListener("keydown", handleExportKey);
  }, [isExporting, project, activeLayout]);

  if (isLoading || !project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  const currentLayout = project.layouts.find((l) => l.id === activeLayout) ?? project.layouts[0];

  async function handleBatchExport() {
    if (!project || !currentLayout) return;
    setIsExporting(true);
    setExportProgress("Starting export...");
    try {
      const pdfBytes = await batchExportPdf(project, currentLayout.id, (progress) => {
        setExportProgress(`Rendering ${progress.holeName} (${progress.current}/${progress.total})`);
      });
      const layoutName = currentLayout.name.toLowerCase().replace(/\s+/g, "-");
      downloadPdf(pdfBytes, `${project.name}-${layoutName}.pdf`);
      setExportProgress("");
    } catch (err) {
      setExportProgress(`Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  }

  function handleDrop(targetHoleId: string) {
    if (!dragHoleId || !project || dragHoleId === targetHoleId) return;

    const sorted = [...project.holes].sort((a, b) => a.number - b.number);
    const dragIndex = sorted.findIndex((h) => h.id === dragHoleId);
    const targetIndex = sorted.findIndex((h) => h.id === targetHoleId);
    if (dragIndex < 0 || targetIndex < 0) return;

    // Remove dragged hole and insert at target position
    const [moved] = sorted.splice(dragIndex, 1);
    sorted.splice(targetIndex, 0, moved);

    // Renumber
    const renumbered = sorted.map((h, i) => ({ ...h, number: i + 1 }));

    // Save immediately
    const updatedProject = { ...project, holes: renumbered };
    setProject(updatedProject);
    setDragHoleId(null);

    fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holes: renumbered }),
    });
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[project.courseName, project.eventName, project.date]
                .filter(Boolean)
                .join(" — ") || "No details set"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleBatchExport}
            disabled={isExporting}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {isExporting ? exportProgress : "Export PDF"}
          </Button>
          <Link href={`/projects/${projectId}/course-map`}>
            <Button variant="outline" size="sm">
              <Map className="mr-2 h-4 w-4" />
              Course Map
            </Button>
          </Link>
          <Link href={`/projects/${projectId}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </header>

      {/* Layout tabs */}
      <div className="flex items-center gap-2 border-b px-6 py-3">
        <span className="text-sm font-medium text-muted-foreground mr-2">Layout:</span>
        {project.layouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => setActiveLayout(layout.id)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              layout.id === activeLayout
                ? "text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            style={
              layout.id === activeLayout
                ? { backgroundColor: layout.colour }
                : undefined
            }
          >
            {layout.name}
          </button>
        ))}
      </div>

      {/* Holes grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {project.holes
            .sort((a, b) => a.number - b.number)
            .map((hole) => {
              const design = hole.designs.find(
                (d) => d.layoutId === currentLayout?.id
              );
              const hasContent =
                design && design.canvas.shapes.length > 0;

              return (
                <div
                  key={hole.id}
                  draggable
                  onDragStart={() => setDragHoleId(hole.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(hole.id)}
                  onClick={() => router.push(`/projects/${projectId}/holes/${hole.id}/${currentLayout?.id}`)}
                  className={`group flex cursor-pointer flex-col items-center rounded-lg border p-4 transition-colors hover:border-primary hover:bg-muted/50 ${
                    dragHoleId === hole.id ? "opacity-50" : ""
                  }`}
                >
                    <div
                      className={`flex h-24 w-full items-center justify-center rounded-md overflow-hidden ${
                        hasContent
                          ? "border border-green-200"
                          : "bg-muted"
                      }`}
                    >
                      {hasContent ? (
                        <HoleThumbnail
                          shapes={design.canvas.shapes}
                          backgroundColor={design.canvas.backgroundColor}
                          width={120}
                          height={96}
                        />
                      ) : (
                        <Plus className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold">Hole {hole.number}</p>
                      {hole.name && (
                        <p className="text-xs text-muted-foreground">
                          {hole.name}
                        </p>
                      )}
                      {design && design.par > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Par {design.par}
                          {design.distance > 0 && ` — ${design.distance}m`}
                        </p>
                      )}
                    </div>
                  </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

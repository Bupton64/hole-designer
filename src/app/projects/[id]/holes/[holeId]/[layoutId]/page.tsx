"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Eye, ImageIcon, FileDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Project, Hole, HoleDesign } from "@/types/project";
import { useCanvasStore, Shape } from "@/store/canvasStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Canvas } from "@/components/canvas/Canvas";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { ActionToolbar } from "@/components/toolbar/ActionToolbar";
import { ExportToolbar } from "@/components/toolbar/ExportToolbar";
import { ColourPanel } from "@/components/toolbar/ColourPanel";
import { AssetPanel } from "@/components/panels/AssetPanel";
import { ComposedPagePreview } from "@/components/banner/ComposedPagePreview";
import { composedPageToSvg } from "@/lib/export/composedPageExport";
import { composedPageToPng } from "@/lib/export/composedPagePng";
import { generateId } from "@/lib/generateId";
import { AssetDefinition, DISC_GOLF_ASSETS } from "@/lib/assets/discGolfAssets";
import Konva from "konva";

export default function HoleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const holeId = params.holeId as string;
  const layoutId = params.layoutId as string;

  const stageRef = useRef<Konva.Stage | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const savedShapesRef = useRef<string>("");

  const shapes = useCanvasStore((state) => state.shapes);
  const setShapes = useCanvasStore((state) => state.setShapes);
  const backgroundColor = useCanvasStore((state) => state.backgroundColor);
  const setBackgroundColor = useCanvasStore((state) => state.setBackgroundColor);
  const addShape = useCanvasStore((state) => state.addShape);
  const setSelectedIds = useCanvasStore((state) => state.setSelectedIds);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);

  // Metadata state
  const [par, setPar] = useState(3);
  const [distance, setDistance] = useState(0);
  const [obRules, setObRules] = useState("");
  const [mandoNotes, setMandoNotes] = useState("");
  const [notes, setNotes] = useState("");

  // Load project and populate canvas
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Not found");
        const data: Project = await res.json();
        setProject(data);

        const hole = data.holes.find((h) => h.id === holeId);
        if (!hole) throw new Error("Hole not found");

        const design = hole.designs.find((d) => d.layoutId === layoutId);
        if (!design) throw new Error("Design not found");

        setShapes(design.canvas.shapes);
        savedShapesRef.current = JSON.stringify(design.canvas.shapes);
        setBackgroundColor(design.canvas.backgroundColor);
        setPar(design.par);
        setDistance(design.distance);
        setObRules(design.obRules);
        setMandoNotes(design.mandoNotes);
        setNotes(design.notes);
      } catch {
        router.push(`/projects/${projectId}`);
      } finally {
        setIsLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, holeId, layoutId]);

  // Track dirty state
  useEffect(() => {
    if (savedShapesRef.current && shapes.length >= 0) {
      const current = JSON.stringify(shapes);
      setIsDirty(current !== savedShapesRef.current);
    }
  }, [shapes]);

  const hole = project?.holes.find((h) => h.id === holeId);
  const design = hole?.designs.find((d) => d.layoutId === layoutId);
  const layout = project?.layouts.find((l) => l.id === layoutId);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!design) return;
    setIsSaving(true);
    try {
      await fetch(
        `/api/projects/${projectId}/holes/${holeId}/designs/${design.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            canvas: { shapes, backgroundColor },
            par,
            distance,
            obRules,
            mandoNotes,
            notes,
          }),
        }
      );
      setLastSaved(new Date().toLocaleTimeString());
      savedShapesRef.current = JSON.stringify(shapes);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [design, projectId, holeId, shapes, backgroundColor, par, distance, obRules, mandoNotes, notes]);

  useKeyboardShortcuts(handleSave);

  // Image upload handler
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/projects/${projectId}/assets`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) return;
    const { url, filename } = await res.json();

    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      // Scale to reasonable canvas size (max 300px wide)
      const scale = Math.min(1, 300 / img.naturalWidth);
      const newShape: Shape = {
        id: generateId(),
        type: "image",
        x: 250,
        y: 400,
        rotation: 0,
        src: url,
        width: img.naturalWidth * scale,
        height: img.naturalHeight * scale,
        filename,
        visible: true,
        locked: false,
      };
      addShape(newShape);
      setSelectedIds([newShape.id]);
      setActiveTool("select");
    };

    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  // Composed page export handlers
  async function handleExportComposedPng() {
    if (!project || !design || !hole) return;
    const dataUrl = await composedPageToPng(
      project.sponsorTemplate,
      design,
      shapes,
      backgroundColor,
      hole.number,
      hole.name
    );
    const link = document.createElement("a");
    link.download = `hole-${hole.number}-composed.png`;
    link.href = dataUrl;
    link.click();
  }

  function handleExportComposedSvg() {
    if (!project || !design || !hole) return;
    const svg = composedPageToSvg(
      project.sponsorTemplate,
      design,
      shapes,
      backgroundColor,
      hole.number,
      hole.name
    );
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `hole-${hole.number}-composed.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Ctrl+E = export composed page PNG
  useEffect(() => {
    function handleExportKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "e" && !e.shiftKey) {
        e.preventDefault();
        handleExportComposedPng();
      }
    }
    window.addEventListener("keydown", handleExportKey);
    return () => window.removeEventListener("keydown", handleExportKey);
  }, [project, design, hole, shapes, backgroundColor]);

  // Duplicate design to another layout
  async function handleDuplicateToLayout(targetLayoutId: string) {
    if (!project || !hole || !design) return;
    const targetLayout = project.layouts.find((l) => l.id === targetLayoutId);
    if (!targetLayout) return;

    // Check if target already has a design
    const existingDesign = hole.designs.find((d) => d.layoutId === targetLayoutId);
    if (existingDesign && existingDesign.canvas.shapes.length > 0) {
      const confirmed = window.confirm(
        `${targetLayout.name} already has a design for Hole ${hole.number} with ${existingDesign.canvas.shapes.length} shapes. Overwrite?`
      );
      if (!confirmed) return;
    }

    // Clone current design with new layout ID
    const newDesignId = existingDesign?.id ?? `design-${Date.now()}-${hole.number}-${targetLayoutId}`;
    const clonedDesign = {
      id: newDesignId,
      layoutId: targetLayoutId,
      canvas: { shapes: JSON.parse(JSON.stringify(shapes)), backgroundColor },
      par,
      distance,
      obRules,
      mandoNotes,
      notes,
    };

    // Update the hole's designs
    const updatedDesigns = existingDesign
      ? hole.designs.map((d) => d.id === existingDesign.id ? clonedDesign : d)
      : [...hole.designs, clonedDesign];

    const updatedHoles = project.holes.map((h) =>
      h.id === hole.id ? { ...h, designs: updatedDesigns } : h
    );

    await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holes: updatedHoles }),
    });

    alert(`Design copied to ${targetLayout.name}`);
  }

  // Asset placement handler
  function handleAssetSelect(asset: AssetDefinition) {
    const isCompound = Array.isArray(asset.paths) && asset.paths.length > 0;
    const newShape = {
      id: generateId(),
      type: "asset" as const,
      x: 400,
      y: 600,
      rotation: 0,
      assetId: asset.id,
      width: asset.width * 2,
      height: asset.height * 2,
      fill: asset.defaultFill ?? "#000000",
      stroke: asset.defaultStroke ?? "#000000",
      strokeWidth: asset.defaultStrokeWidth ?? 1,
      svgPath: asset.svgPath ?? "",
      paths: isCompound ? asset.paths : undefined,
      viewboxWidth: asset.width,
      viewboxHeight: asset.height,
      visible: true,
      locked: false,
    };
    addShape(newShape);
    setSelectedIds([newShape.id]);
    setActiveTool("select");
  }

  // Prev/Next hole navigation
  const sortedHoles = project?.holes.sort((a, b) => a.number - b.number) ?? [];
  const currentIndex = sortedHoles.findIndex((h) => h.id === holeId);
  const prevHole = currentIndex > 0 ? sortedHoles[currentIndex - 1] : null;
  const nextHole =
    currentIndex < sortedHoles.length - 1
      ? sortedHoles[currentIndex + 1]
      : null;

  // Keyboard navigation: PageUp/PageDown or Ctrl+Left/Right to switch holes
  useEffect(() => {
    function handleNavKey(e: KeyboardEvent) {
      const goPrev = e.key === "PageUp" || (e.ctrlKey && e.key === "ArrowLeft");
      const goNext = e.key === "PageDown" || (e.ctrlKey && e.key === "ArrowRight");

      if (goPrev && prevHole) {
        e.preventDefault();
        if (isDirty) handleSave();
        router.push(`/projects/${projectId}/holes/${prevHole.id}/${layoutId}`);
      }
      if (goNext && nextHole) {
        e.preventDefault();
        if (isDirty) handleSave();
        router.push(`/projects/${projectId}/holes/${nextHole.id}/${layoutId}`);
      }
    }
    window.addEventListener("keydown", handleNavKey);
    return () => window.removeEventListener("keydown", handleNavKey);
  }, [prevHole, nextHole, isDirty, handleSave, router, projectId, layoutId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading hole editor...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon" title="Back to project">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          {prevHole && (
            <Link
              href={`/projects/${projectId}/holes/${prevHole.id}/${layoutId}`}
            >
              <Button variant="ghost" size="icon" title="Previous hole">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <div className="text-center">
            <span className="text-sm font-semibold">
              Hole {hole?.number}
              {hole?.name ? ` — ${hole.name}` : ""}
            </span>
            {layout && (
              <span
                className="ml-2 rounded-full px-2 py-0.5 text-xs text-white"
                style={{ backgroundColor: layout.colour }}
              >
                {layout.name}
              </span>
            )}
          </div>
          {nextHole && (
            <Link
              href={`/projects/${projectId}/holes/${nextHole.id}/${layoutId}`}
            >
              <Button variant="ghost" size="icon" title="Next hole">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved}
            </span>
          )}
          <Button
            size="sm"
            variant={showPreview ? "default" : "outline"}
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          {project && project.layouts.length > 1 && (
            <div className="flex items-center gap-1 rounded-md border bg-background px-2 py-1">
              <Copy className="h-4 w-4 text-muted-foreground" />
              {project.layouts
                .filter((l) => l.id !== layoutId)
                .map((l) => (
                  <Button
                    key={l.id}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleDuplicateToLayout(l.id)}
                    title={`Copy design to ${l.name}`}
                  >
                    <span
                      className="mr-1 inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: l.colour }}
                    />
                    {l.name}
                  </Button>
                ))}
            </div>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
            {isDirty && <span className="ml-1.5 h-2 w-2 rounded-full bg-orange-400" />}
          </Button>
          <ExportToolbar stageRef={stageRef} />
          <div className="flex items-center gap-1 rounded-md border bg-background p-1.5 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleExportComposedPng}
              title="Export composed page as PNG"
            >
              <FileDown className="mr-1 h-4 w-4" />
              Page PNG
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleExportComposedSvg}
              title="Export composed page as SVG"
            >
              <FileDown className="mr-1 h-4 w-4" />
              Page SVG
            </Button>
          </div>
        </div>
      </header>

      {/* Toolbar row */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Toolbar />
        <ActionToolbar />
        <ColourPanel />
        <div className="ml-2 flex items-center rounded-md border bg-background p-1.5 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => imageInputRef.current?.click()}
            title="Upload image"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Asset panel */}
        {!showPreview && <AssetPanel onAssetSelect={handleAssetSelect} />}

        {/* Canvas or Preview */}
        {showPreview ? (
          <div className="flex-1 flex items-center justify-center bg-muted/30 overflow-auto p-8">
            {project && design && (
              <ComposedPagePreview
                sponsorTemplate={project.sponsorTemplate}
                design={design}
                holeNumber={hole?.number ?? 1}
                holeName={hole?.name ?? ""}
                canvasShapes={shapes}
                canvasBackground={backgroundColor}
              />
            )}
          </div>
        ) : (
          <Canvas stageRef={stageRef} />
        )}

        {/* Metadata sidebar */}
        <div className="w-64 shrink-0 overflow-auto border-l p-4">
          <h3 className="mb-4 text-sm font-semibold">Hole Info</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Par
              </label>
              <Input
                type="number"
                min={1}
                max={7}
                value={par}
                onChange={(e) => setPar(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Distance (m)
              </label>
              <Input
                type="number"
                min={0}
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                OB Rules
              </label>
              <textarea
                value={obRules}
                onChange={(e) => setObRules(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="OB left of path..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Mando Notes
              </label>
              <textarea
                value={mandoNotes}
                onChange={(e) => setMandoNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Mando right of..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Uphill, water carry..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

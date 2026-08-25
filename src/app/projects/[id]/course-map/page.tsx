"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Camera, Save, FileImage, FileCode, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stage, Layer, Rect, Line, Text, Ellipse, Image as KonvaImage, Group } from "react-konva";
import Konva from "konva";
import { Project, Layout } from "@/types/project";
import { Shape, TextShape } from "@/store/canvasStore";
import { generateId } from "@/lib/generateId";

// Leaflet uses window - load dynamically
const MapCapture = dynamic(
  () => import("@/components/map/MapCapture").then((mod) => mod.MapCapture),
  { ssr: false }
);

const MAP_WIDTH = 1200;
const MAP_HEIGHT = 900;

export default function CourseMapPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const stageRef = useRef<Konva.Stage>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCapture, setShowCapture] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Canvas state (local, not global Zustand - avoids conflicts with hole editor)
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [backgroundSrc, setBackgroundSrc] = useState<string | null>(null);

  // Layout visibility toggles
  const [visibleLayouts, setVisibleLayouts] = useState<Set<string>>(new Set());

  // Drawing state
  const [activeTool, setActiveTool] = useState<"select" | "arrow" | "marker" | "label">("select");
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Arrow drawing state
  const [arrowPoints, setArrowPoints] = useState<number[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Not found");
        const data: Project = await res.json();
        setProject(data);
        setShapes(data.courseMap.canvas.shapes);

        // Load background image if exists
        if (data.courseMap.backgroundImage?.imageData) {
          setBackgroundSrc(data.courseMap.backgroundImage.imageData);
          const img = new window.Image();
          img.src = data.courseMap.backgroundImage.imageData;
          img.onload = () => setBackgroundImage(img);
        }

        // Initialize layout visibility and active layout
        const layoutIds = new Set(data.layouts.map((l) => l.id));
        setVisibleLayouts(layoutIds);
        if (data.layouts.length > 0) {
          setActiveLayoutId(data.layouts[0].id);
        }
      } catch {
        router.push(`/projects/${projectId}`);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [projectId, router]);

  // Handle map capture result
  function handleCapture(dataUrl: string) {
    setBackgroundSrc(dataUrl);
    const img = new window.Image();
    img.src = dataUrl;
    img.onload = () => setBackgroundImage(img);
    setShowCapture(false);
  }

  // Save course map
  async function handleSave() {
    if (!project) return;
    setIsSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseMap: {
            backgroundImage: backgroundSrc
              ? { tileSource: "satellite", bounds: { north: 0, south: 0, east: 0, west: 0 }, zoom: 16, imageData: backgroundSrc }
              : null,
            canvas: { shapes, backgroundColor: "#374151" },
          },
        }),
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Stage click handler
  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (activeTool === "marker" && activeLayoutId) {
      const layout = project?.layouts.find((l) => l.id === activeLayoutId);
      if (!layout) return;
      const newText = window.prompt("Hole number or label:", "1");
      if (!newText) return;
      const marker: Shape = {
        id: generateId(),
        type: "text",
        x: pos.x - 8,
        y: pos.y - 10,
        text: newText,
        fontSize: 16,
        fontFamily: "Arial",
        fontStyle: "bold",
        fill: layout.colour,
        rotation: 0,
        visible: true,
        locked: false,
      } as TextShape;
      setShapes((prev) => [...prev, marker]);
      return;
    }

    if (activeTool === "label") {
      const labelText = window.prompt("Label text:", "HQ");
      if (!labelText) return;
      const label: Shape = {
        id: generateId(),
        type: "text",
        x: pos.x,
        y: pos.y,
        text: labelText,
        fontSize: 14,
        fontFamily: "Arial",
        fontStyle: "bold",
        fill: "#ffffff",
        rotation: 0,
        visible: true,
        locked: false,
      } as TextShape;
      setShapes((prev) => [...prev, label]);
      return;
    }

    if (activeTool === "arrow" && activeLayoutId) {
      setArrowPoints((prev) => [...prev, pos.x, pos.y]);
      return;
    }

    // Select tool: deselect on empty click
    if (activeTool === "select") {
      const clickedOnEmpty = e.target === stage || e.target.name() === "map-bg";
      if (clickedOnEmpty) setSelectedId(null);
    }
  }

  // Finish arrow (Enter key)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (activeTool === "arrow" && e.key === "Enter" && arrowPoints.length >= 4 && activeLayoutId) {
        const layout = project?.layouts.find((l) => l.id === activeLayoutId);
        if (!layout) return;
        const arrow: Shape = {
          id: generateId(),
          type: "line",
          x: 0,
          y: 0,
          points: arrowPoints,
          stroke: layout.colour,
          strokeWidth: 4,
          closed: false,
          fill: "none",
          rotation: 0,
          visible: true,
          locked: false,
        };
        setShapes((prev) => [...prev, arrow]);
        setArrowPoints([]);
      }
      if (activeTool === "arrow" && e.key === "Escape") {
        setArrowPoints([]);
        setActiveTool("select");
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          setShapes((prev) => prev.filter((s) => s.id !== selectedId));
          setSelectedId(null);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool, arrowPoints, activeLayoutId, project, selectedId]);

  // Export handlers
  function handleExportPng() {
    const stage = stageRef.current;
    if (!stage) return;
    const dataUrl = stage.toDataURL({ pixelRatio: 3 });
    const link = document.createElement("a");
    link.download = "course-map.png";
    link.href = dataUrl;
    link.click();
  }

  function toggleLayoutVisibility(layoutId: string) {
    setVisibleLayouts((prev) => {
      const next = new Set(prev);
      if (next.has(layoutId)) next.delete(layoutId);
      else next.add(layoutId);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading course map...</p>
      </div>
    );
  }

  if (showCapture) {
    return <MapCapture onCapture={handleCapture} onCancel={() => setShowCapture(false)} />;
  }

  // Generate legend entries
  const legendEntries = project?.layouts.map((l) => ({ name: l.name, colour: l.colour })) ?? [];

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-sm font-semibold">Course Map</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCapture(true)}>
            <Camera className="mr-2 h-4 w-4" />
            {backgroundImage ? "Recapture" : "Capture Map"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPng}>
            <FileImage className="mr-2 h-4 w-4" />
            Export PNG
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div className="flex items-center gap-1 rounded-md border bg-background p-1 shadow-sm">
          {(["select", "arrow", "marker", "label"] as const).map((t) => (
            <Button
              key={t}
              variant={activeTool === t ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs capitalize"
              onClick={() => setActiveTool(t)}
            >
              {t}
            </Button>
          ))}
        </div>

        {(activeTool === "arrow" || activeTool === "marker") && project && (
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-muted-foreground mr-1">Layout:</span>
            {project.layouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => setActiveLayoutId(layout.id)}
                className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                  layout.id === activeLayoutId ? "text-white" : "bg-muted text-muted-foreground"
                }`}
                style={layout.id === activeLayoutId ? { backgroundColor: layout.colour } : undefined}
              >
                {layout.name}
              </button>
            ))}
          </div>
        )}

        {activeTool === "arrow" && arrowPoints.length >= 2 && (
          <span className="text-xs text-muted-foreground ml-2">
            {arrowPoints.length / 2} points placed. Press ENTER to finish.
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Show:</span>
          {project?.layouts.map((layout) => (
            <button
              key={layout.id}
              onClick={() => toggleLayoutVisibility(layout.id)}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                visibleLayouts.has(layout.id) ? "text-white" : "bg-muted/50 text-muted-foreground line-through"
              }`}
              style={visibleLayouts.has(layout.id) ? { backgroundColor: layout.colour } : undefined}
            >
              {visibleLayouts.has(layout.id) ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
              {layout.name}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center bg-gray-800 overflow-auto">
        <Stage
          ref={stageRef}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          onClick={handleStageClick}
        >
          <Layer>
            {/* Background */}
            <Rect name="map-bg" x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="#374151" />
            {backgroundImage && (
              <KonvaImage
                image={backgroundImage}
                x={0}
                y={0}
                width={MAP_WIDTH}
                height={MAP_HEIGHT}
                listening={false}
              />
            )}

            {/* Shapes (arrows, markers, labels) */}
            {shapes.map((shape) => {
              if (shape.type === "line") {
                return (
                  <Line
                    key={shape.id}
                    id={shape.id}
                    x={shape.x}
                    y={shape.y}
                    points={shape.points}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    lineCap="round"
                    lineJoin="round"
                    draggable={activeTool === "select"}
                    onClick={() => { if (activeTool === "select") setSelectedId(shape.id); }}
                    onDragEnd={(e) => {
                      setShapes((prev) =>
                        prev.map((s) => s.id === shape.id ? { ...s, x: e.target.x(), y: e.target.y() } : s)
                      );
                    }}
                    opacity={selectedId === shape.id ? 0.6 : 1}
                    hitStrokeWidth={12}
                  />
                );
              }
              if (shape.type === "text") {
                return (
                  <Text
                    key={shape.id}
                    id={shape.id}
                    x={shape.x}
                    y={shape.y}
                    text={shape.text}
                    fontSize={shape.fontSize}
                    fontFamily={shape.fontFamily}
                    fontStyle={shape.fontStyle}
                    fill={shape.fill}
                    draggable={activeTool === "select"}
                    onClick={() => { if (activeTool === "select") setSelectedId(shape.id); }}
                    onDragEnd={(e) => {
                      setShapes((prev) =>
                        prev.map((s) => s.id === shape.id ? { ...s, x: e.target.x(), y: e.target.y() } : s)
                      );
                    }}
                    opacity={selectedId === shape.id ? 0.6 : 1}
                  />
                );
              }
              return null;
            })}

            {/* Arrow in-progress preview */}
            {activeTool === "arrow" && arrowPoints.length >= 2 && (
              <Line
                points={arrowPoints}
                stroke={project?.layouts.find((l) => l.id === activeLayoutId)?.colour ?? "#fff"}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
                opacity={0.6}
                listening={false}
              />
            )}

            {/* Legend */}
            {legendEntries.length > 0 && (
              <Group x={MAP_WIDTH - 160} y={MAP_HEIGHT - 30 - legendEntries.length * 22}>
                <Rect
                  x={0}
                  y={0}
                  width={150}
                  height={legendEntries.length * 22 + 10}
                  fill="rgba(0,0,0,0.7)"
                  cornerRadius={6}
                />
                {legendEntries.map((entry, i) => (
                  <Group key={entry.name} y={8 + i * 22}>
                    <Rect x={10} y={2} width={14} height={14} fill={entry.colour} cornerRadius={3} />
                    <Text x={30} y={2} text={entry.name} fontSize={13} fill="#ffffff" fontFamily="Arial" />
                  </Group>
                ))}
              </Group>
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

"use client";

import { FileImage, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasStore } from "@/store/canvasStore";
import { shapesToSvg } from "@/lib/export/svgSerializer";
import { ARTBOARD_WIDTH, ARTBOARD_HEIGHT } from "@/components/canvas/Canvas";
import Konva from "konva";

interface ExportToolbarProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function ExportToolbar({ stageRef }: ExportToolbarProps) {
  const shapes = useCanvasStore((state) => state.shapes);
  const backgroundColor = useCanvasStore((state) => state.backgroundColor);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const setSelectedIds = useCanvasStore((state) => state.setSelectedIds);

  function handleExportPng() {
    const stage = stageRef.current;
    if (!stage) return;

    const previousSelection = [...selectedIds];
    clearSelection();

    requestAnimationFrame(() => {
      // Save current transform
      const oldScale = { x: stage.scaleX(), y: stage.scaleY() };
      const oldPosition = { x: stage.x(), y: stage.y() };

      // Reset to capture artboard at 1:1
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });

      const dataUrl = stage.toDataURL({
        x: 0,
        y: 0,
        width: ARTBOARD_WIDTH,
        height: ARTBOARD_HEIGHT,
        pixelRatio: 4,
      });

      // Restore transform
      stage.scale(oldScale);
      stage.position(oldPosition);

      const link = document.createElement("a");
      link.download = "hole-design.png";
      link.href = dataUrl;
      link.click();

      if (previousSelection.length > 0) {
        setSelectedIds(previousSelection);
      }
    });
  }

  function handleExportSvg() {
    const svg = shapesToSvg(shapes, ARTBOARD_WIDTH, ARTBOARD_HEIGHT, backgroundColor);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "hole-design.svg";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-1 rounded-md border bg-background p-1.5 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={handleExportPng}
        disabled={shapes.length === 0}
        title="Export PNG"
        aria-label="Export as PNG"
      >
        <FileImage className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={handleExportSvg}
        disabled={shapes.length === 0}
        title="Export SVG"
        aria-label="Export as SVG"
      >
        <FileCode className="h-5 w-5" />
      </Button>
    </div>
  );
}

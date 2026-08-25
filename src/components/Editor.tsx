"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Konva from "konva";
import { Canvas, ARTBOARD_WIDTH, ARTBOARD_HEIGHT } from "@/components/canvas/Canvas";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { ActionToolbar } from "@/components/toolbar/ActionToolbar";
import { ProjectToolbar } from "@/components/toolbar/ProjectToolbar";
import { ExportToolbar } from "@/components/toolbar/ExportToolbar";
import { ColourPanel } from "@/components/toolbar/ColourPanel";
import { AssetPanel } from "@/components/panels/AssetPanel";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useProject } from "@/hooks/useProject";
import { useCanvasStore, AssetShape } from "@/store/canvasStore";
import { AssetDefinition } from "@/lib/assets/discGolfAssets";
import { generateId } from "@/lib/generateId";
import { convertOverpassToShapes } from "@/lib/osm/convertOverpass";
import { BoundingBox } from "@/components/map/MapImport";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";

// Leaflet uses window, so we must load MapImport client-only with no SSR
const MapImport = dynamic(
  () => import("@/components/map/MapImport").then((mod) => mod.MapImport),
  { ssr: false }
);

export function Editor() {
  const project = useProject();
  const [saveDialogRequested, setSaveDialogRequested] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);
  const addShape = useCanvasStore((state) => state.addShape);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);

  const handleSave = useCallback(() => {
    // Legacy editor - save not supported in new model
    // Use the hole editor page (/projects/[id]/holes/[holeId]/[layoutId]) instead
    setSaveDialogRequested(true);
  }, []);

  useKeyboardShortcuts(handleSave);

  function handleAssetSelect(asset: AssetDefinition) {
    const isCompound = Array.isArray(asset.paths) && asset.paths.length > 0;
    const primaryPath = isCompound ? asset.paths![0].d : (asset.svgPath ?? "");
    const primaryFill = isCompound ? asset.paths![0].fill : (asset.defaultFill ?? "none");
    const primaryStroke = isCompound ? asset.paths![0].stroke : (asset.defaultStroke ?? "#000");
    const primaryStrokeWidth = isCompound ? asset.paths![0].strokeWidth : (asset.defaultStrokeWidth ?? 1);

    // Place assets at 2x their viewbox size for comfortable working scale
    const placedWidth = asset.width * 2;
    const placedHeight = asset.height * 2;

    const newAsset: AssetShape = {
      id: generateId(),
      type: "asset",
      assetId: asset.id,
      x: ARTBOARD_WIDTH / 2 - placedWidth / 2,
      y: ARTBOARD_HEIGHT / 2 - placedHeight / 2,
      width: placedWidth,
      height: placedHeight,
      rotation: 0,
      fill: primaryFill,
      stroke: primaryStroke,
      strokeWidth: primaryStrokeWidth,
      svgPath: primaryPath,
      paths: isCompound ? asset.paths!.map((p) => ({
        d: p.d,
        fill: p.fill,
        stroke: p.stroke,
        strokeWidth: p.strokeWidth,
        dash: p.dash,
        opacity: p.opacity,
      })) : undefined,
      viewboxWidth: asset.width,
      viewboxHeight: asset.height,
      visible: true,
      locked: false,
    };

    addShape(newAsset);
    setActiveTool("select");
  }

  async function handleMapImport(bbox: BoundingBox) {
    setIsImporting(true);
    try {
      const response = await fetch("/api/osm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bbox),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Import failed");
      }

      const data = await response.json();
      const shapes = convertOverpassToShapes(data.elements, bbox);

      for (const shape of shapes) {
        addShape(shape);
      }

      setShowMap(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      console.error("Map import failed:", error);
      window.alert(`Import failed: ${message}`);
    } finally {
      setIsImporting(false);
    }
  }

  if (showMap) {
    return (
      <div className="flex h-screen flex-col">
        <MapImport
          onImport={handleMapImport}
          onCancel={() => setShowMap(false)}
          isLoading={isImporting}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-3 border-b px-3 py-2.5">
        <ProjectToolbar
          project={project}
          saveDialogRequested={saveDialogRequested}
          onSaveDialogHandled={() => setSaveDialogRequested(false)}
        />
        <Toolbar />
        <ActionToolbar />
        <ColourPanel />
        <ExportToolbar stageRef={stageRef} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMap(true)}
          className="ml-auto"
        >
          <Map className="mr-1.5 h-5 w-5" />
          Import Map
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <AssetPanel onAssetSelect={handleAssetSelect} />
        <Canvas stageRef={stageRef} />
      </div>
    </div>
  );
}

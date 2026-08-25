"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from "react-konva";
import Konva from "konva";
import { Shape, TextShape, ImageShape } from "@/store/canvasStore";
import { CanvasData } from "@/types/project";
import { generateId } from "@/lib/generateId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Type, Trash2, MousePointer2, ImageIcon } from "lucide-react";

const BANNER_WIDTH = 800;

interface Token {
  label: string;
  value: string;
}

const TOKENS: Token[] = [
  { label: "Hole #", value: "{{hole}}" },
  { label: "Par", value: "{{par}}" },
  { label: "Distance", value: "{{distance}}" },
  { label: "OB Rules", value: "{{ob}}" },
  { label: "Mando", value: "{{mando}}" },
  { label: "Hole Name", value: "{{name}}" },
];

interface BannerEditorProps {
  canvas: CanvasData;
  height: number;
  onCanvasChange: (canvas: CanvasData) => void;
  onHeightChange: (height: number) => void;
  showTokens?: boolean;
  label: string;
  projectId: string;
}

export function BannerEditor({
  canvas,
  height,
  onCanvasChange,
  onHeightChange,
  showTokens = false,
  label,
  projectId,
}: BannerEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shapes, setShapes] = useState<Shape[]>(canvas.shapes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "text">("select");
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

  // Sync shapes back to parent
  useEffect(() => {
    onCanvasChange({ ...canvas, shapes });
  }, [shapes]);

  // Sync incoming canvas changes (e.g. on load)
  useEffect(() => {
    setShapes(canvas.shapes);
  }, [canvas.shapes]);

  // Load images for ImageShapes
  useEffect(() => {
    const imageShapes = shapes.filter((s): s is ImageShape => s.type === "image");
    for (const shape of imageShapes) {
      if (!loadedImages[shape.id]) {
        const img = new window.Image();
        img.src = shape.src;
        img.onload = () => {
          setLoadedImages((prev) => ({ ...prev, [shape.id]: img }));
        };
      }
    }
  }, [shapes, loadedImages]);

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

    // Load image to get dimensions
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      // Scale to fit within banner height
      const scale = Math.min(1, (height - 10) / img.naturalHeight);
      const newShape: ImageShape = {
        id: generateId(),
        type: "image",
        x: 20,
        y: 5,
        rotation: 0,
        src: url,
        width: img.naturalWidth * scale,
        height: img.naturalHeight * scale,
        filename,
        visible: true,
        locked: false,
      };
      setShapes((prev) => [...prev, newShape]);
      setLoadedImages((prev) => ({ ...prev, [newShape.id]: img }));
      setSelectedId(newShape.id);
    };

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addTextShape(text: string) {
    const newShape: TextShape = {
      id: generateId(),
      type: "text",
      x: 20,
      y: height / 2 - 12,
      text,
      fontSize: 18,
      fontFamily: "Arial",
      fontStyle: "bold",
      fill: "#1f2937",
      rotation: 0,
      visible: true,
      locked: false,
    };
    setShapes((prev) => [...prev, newShape]);
    setSelectedId(newShape.id);
    setTool("select");
  }

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    const clickedOnEmpty =
      e.target === stageRef.current ||
      e.target.name() === "banner-bg";

    if (tool === "text" && clickedOnEmpty) {
      const pos = stageRef.current?.getPointerPosition();
      if (!pos) return;
      const newShape: TextShape = {
        id: generateId(),
        type: "text",
        x: pos.x,
        y: pos.y,
        text: "Text",
        fontSize: 16,
        fontFamily: "Arial",
        fontStyle: "normal",
        fill: "#1f2937",
        rotation: 0,
        visible: true,
        locked: false,
      };
      setShapes((prev) => [...prev, newShape]);
      setSelectedId(newShape.id);
      setTool("select");
      return;
    }

    if (tool === "select" && clickedOnEmpty) {
      setSelectedId(null);
    }
  }

  function handleDragEnd(id: string, x: number, y: number) {
    setShapes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, x, y } : s))
    );
  }

  function handleDoubleClick(id: string) {
    const shape = shapes.find((s) => s.id === id);
    if (!shape || shape.type !== "text") return;
    const newText = window.prompt("Edit text:", shape.text);
    if (newText !== null) {
      setShapes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, text: newText } : s))
      );
    }
  }

  function deleteSelected() {
    if (!selectedId) return;
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  }

  const selectedShape = shapes.find((s) => s.id === selectedId);

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Height:</label>
          <Input
            type="number"
            min={30}
            max={200}
            value={height}
            onChange={(e) => onHeightChange(Number(e.target.value))}
            className="w-16 h-7 text-xs"
          />
        </div>
      </div>

      {/* Mini toolbar */}
      <div className="flex items-center gap-1 border-b px-3 py-1.5">
        <Button
          variant={tool === "select" ? "default" : "ghost"}
          size="icon"
          className="h-7 w-7"
          onClick={() => setTool("select")}
          title="Select"
        >
          <MousePointer2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={tool === "text" ? "default" : "ghost"}
          size="icon"
          className="h-7 w-7"
          onClick={() => setTool("text")}
          title="Add text"
        >
          <Type className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => fileInputRef.current?.click()}
          title="Upload image"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        {selectedId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={deleteSelected}
            title="Delete selected"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        )}
        <div className="mx-2 h-4 w-px bg-border" />
        {showTokens &&
          TOKENS.map((token) => (
            <Button
              key={token.value}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => addTextShape(token.value)}
              title={`Insert ${token.label} token`}
            >
              {token.label}
            </Button>
          ))}
      </div>

      {/* Canvas */}
      <div className="bg-gray-100">
        <Stage
          ref={stageRef}
          width={BANNER_WIDTH}
          height={height}
          onClick={handleStageClick}
          style={{ display: "block", margin: "0 auto" }}
        >
          <Layer>
            <Rect
              name="banner-bg"
              x={0}
              y={0}
              width={BANNER_WIDTH}
              height={height}
              fill={canvas.backgroundColor}
            />
            {shapes.map((shape) => {
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
                    draggable
                    onClick={() => setSelectedId(shape.id)}
                    onDblClick={() => handleDoubleClick(shape.id)}
                    onDragEnd={(e) =>
                      handleDragEnd(shape.id, e.target.x(), e.target.y())
                    }
                    opacity={selectedId === shape.id ? 0.7 : 1}
                  />
                );
              }
              if (shape.type === "image" && loadedImages[shape.id]) {
                return (
                  <KonvaImage
                    key={shape.id}
                    id={shape.id}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    image={loadedImages[shape.id]}
                    draggable
                    onClick={() => setSelectedId(shape.id)}
                    onDragEnd={(e) =>
                      handleDragEnd(shape.id, e.target.x(), e.target.y())
                    }
                    opacity={selectedId === shape.id ? 0.7 : 1}
                  />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      </div>

      {/* Selected shape properties */}
      {selectedShape && selectedShape.type === "text" && (
        <div className="flex items-center gap-2 border-t px-3 py-2">
          <label className="text-xs text-muted-foreground">Size:</label>
          <Input
            type="number"
            min={8}
            max={72}
            value={selectedShape.fontSize}
            onChange={(e) =>
              setShapes((prev) =>
                prev.map((s) =>
                  s.id === selectedId
                    ? { ...s, fontSize: Number(e.target.value) }
                    : s
                )
              )
            }
            className="w-14 h-7 text-xs"
          />
          <label className="text-xs text-muted-foreground">Colour:</label>
          <input
            type="color"
            value={selectedShape.fill}
            onChange={(e) =>
              setShapes((prev) =>
                prev.map((s) =>
                  s.id === selectedId ? { ...s, fill: e.target.value } : s
                )
              )
            }
            className="h-7 w-7 cursor-pointer rounded border"
          />
          <select
            value={selectedShape.fontStyle}
            onChange={(e) =>
              setShapes((prev) =>
                prev.map((s) =>
                  s.id === selectedId
                    ? { ...s, fontStyle: e.target.value as "normal" | "bold" | "italic" }
                    : s
                )
              )
            }
            className="h-7 rounded border px-1 text-xs"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="italic">Italic</option>
          </select>
        </div>
      )}
    </div>
  );
}

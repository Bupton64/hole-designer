"use client";

import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Minus,
  Pencil,
  Type,
  Route,
  Slash,
  Waves,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCanvasStore, Tool } from "@/store/canvasStore";

const toolValues: Tool[] = ["select", "pan", "rectangle", "ellipse", "line", "freehand", "text", "fairway", "obline", "stream"];

function isTool(value: string): value is Tool {
  return (toolValues as string[]).includes(value);
}

const tools: { value: Tool; label: string; icon: React.ReactNode }[] = [
  { value: "select", label: "Select", icon: <MousePointer2 className="h-5 w-5" /> },
  { value: "pan", label: "Pan", icon: <Hand className="h-5 w-5" /> },
  { value: "rectangle", label: "Rectangle", icon: <Square className="h-5 w-5" /> },
  { value: "ellipse", label: "Ellipse", icon: <Circle className="h-5 w-5" /> },
  { value: "line", label: "Line", icon: <Minus className="h-5 w-5" /> },
  { value: "freehand", label: "Freehand", icon: <Pencil className="h-5 w-5" /> },
  { value: "text", label: "Text", icon: <Type className="h-5 w-5" /> },
  { value: "fairway", label: "Fairway", icon: <Route className="h-5 w-5" /> },
  { value: "obline", label: "OB Line", icon: <Slash className="h-5 w-5 text-red-600" /> },
  { value: "stream", label: "Stream", icon: <Waves className="h-5 w-5 text-blue-400" /> },
];

export function Toolbar() {
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const clearSelection = useCanvasStore((state) => state.clearSelection);

  function handleValueChange(value: string[]) {
    // When toggling off (empty array), keep current tool
    if (value.length === 0) return;
    const selected = value[0];
    if (selected && isTool(selected)) {
      setActiveTool(selected);
      if (selected !== "select") {
        clearSelection();
      }
    }
  }

  return (
    <div className="flex items-center rounded-md border bg-background p-1.5 shadow-sm">
      <ToggleGroup
        value={[activeTool]}
        onValueChange={handleValueChange}
      >
        {tools.map((tool) => (
          <ToggleGroupItem
            key={tool.value}
            value={tool.value}
            aria-label={tool.label}
            title={tool.label}
            className="h-10 w-10 p-0"
          >
            {tool.icon}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

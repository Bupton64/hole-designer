"use client";

import { useCanvasStore } from "@/store/canvasStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

const PRESET_COLOURS = [
  "#000000", "#374151", "#6b7280", "#9ca3af", "#ffffff",
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f9baba", "#a7f3d0", "#bfdbfe", "#ddd6fe", "#fbcfe8",
];

function ColourSwatch({
  colour,
  isActive,
  onClick,
}: {
  colour: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`h-7 w-7 rounded border-2 bg-white ${isActive ? "border-blue-500" : "border-gray-300"}`}
      onClick={onClick}
      aria-label={`Select colour ${colour}`}
    >
      <div className="h-full w-full rounded-sm" style={{ backgroundColor: colour }} />
    </button>
  );
}

function ColourPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (colour: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger>
        <div className="flex items-center gap-2 rounded border bg-background px-2.5 py-1.5">
          <div className="h-6 w-6 rounded border border-gray-300 bg-white">
            <div
              className="h-full w-full rounded-sm"
              style={{ backgroundColor: value }}
            />
          </div>
          <span className="text-sm">{label}</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-52">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium">{label}</span>
          <div className="grid grid-cols-5 gap-1">
            {PRESET_COLOURS.map((colour) => (
              <ColourSwatch
                key={colour}
                colour={colour}
                isActive={colour === value}
                onClick={() => onChange(colour)}
              />
            ))}
          </div>
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#hex or rgba(...)"
            className="h-7 text-xs"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ColourPanel() {
  const defaultFill = useCanvasStore((state) => state.defaultFill);
  const defaultStroke = useCanvasStore((state) => state.defaultStroke);
  const setDefaultFill = useCanvasStore((state) => state.setDefaultFill);
  const setDefaultStroke = useCanvasStore((state) => state.setDefaultStroke);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const shapes = useCanvasStore((state) => state.shapes);
  const updateShape = useCanvasStore((state) => state.updateShape);
  const backgroundColor = useCanvasStore((state) => state.backgroundColor);
  const setBackgroundColor = useCanvasStore((state) => state.setBackgroundColor);

  const selectedShape = selectedIds.length === 1
    ? shapes.find((s) => s.id === selectedIds[0])
    : null;

  const currentFill = selectedShape && "fill" in selectedShape
    ? selectedShape.fill
    : defaultFill;

  const currentStroke = selectedShape && "stroke" in selectedShape
    ? selectedShape.stroke
    : defaultStroke;

  function handleFillChange(colour: string) {
    if (selectedShape) {
      updateShape(selectedShape.id, (shape) => ({ ...shape, fill: colour }));
    }
    setDefaultFill(colour);
  }

  function handleStrokeChange(colour: string) {
    if (selectedShape) {
      updateShape(selectedShape.id, (shape) => ({ ...shape, stroke: colour }));
    }
    setDefaultStroke(colour);
  }

  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-background p-1.5 shadow-sm">
      <ColourPicker label="Fill" value={currentFill} onChange={handleFillChange} />
      <ColourPicker label="Stroke" value={currentStroke} onChange={handleStrokeChange} />
      <ColourPicker label="BG" value={backgroundColor} onChange={setBackgroundColor} />
    </div>
  );
}

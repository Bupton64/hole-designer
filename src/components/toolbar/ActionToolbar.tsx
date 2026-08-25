"use client";

import { Undo2, Redo2, Trash2, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasStore } from "@/store/canvasStore";

export function ActionToolbar() {
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const past = useCanvasStore((state) => state.past);
  const future = useCanvasStore((state) => state.future);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const removeShape = useCanvasStore((state) => state.removeShape);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const bringForward = useCanvasStore((state) => state.bringForward);
  const sendBackward = useCanvasStore((state) => state.sendBackward);
  const bringToFront = useCanvasStore((state) => state.bringToFront);
  const sendToBack = useCanvasStore((state) => state.sendToBack);
  const snapEnabled = useCanvasStore((state) => state.snapEnabled);
  const setSnapEnabled = useCanvasStore((state) => state.setSnapEnabled);

  const hasSelection = selectedIds.length > 0;
  const singleSelected = selectedIds.length === 1 ? selectedIds[0] : null;

  function handleDelete() {
    for (const id of selectedIds) {
      removeShape(id);
    }
    clearSelection();
  }

  return (
    <div className="flex items-center gap-1 rounded-md border bg-background p-1.5 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={undo}
        disabled={past.length === 0}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        <Undo2 className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={redo}
        disabled={future.length === 0}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
      >
        <Redo2 className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={handleDelete}
        disabled={!hasSelection}
        title="Delete (Del)"
        aria-label="Delete selected"
      >
        <Trash2 className="h-5 w-5" />
      </Button>

      <div className="mx-1.5 h-6 w-px bg-border" />

      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => singleSelected && bringToFront(singleSelected)}
        disabled={!singleSelected}
        title="Bring to Front"
        aria-label="Bring to front"
      >
        <ChevronsUp className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => singleSelected && bringForward(singleSelected)}
        disabled={!singleSelected}
        title="Bring Forward"
        aria-label="Bring forward"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => singleSelected && sendBackward(singleSelected)}
        disabled={!singleSelected}
        title="Send Backward"
        aria-label="Send backward"
      >
        <ArrowDown className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => singleSelected && sendToBack(singleSelected)}
        disabled={!singleSelected}
        title="Send to Back"
        aria-label="Send to back"
      >
        <ChevronsDown className="h-5 w-5" />
      </Button>

      <div className="mx-1.5 h-6 w-px bg-border" />

      <Button
        variant={snapEnabled ? "default" : "ghost"}
        size="icon"
        className="h-10 w-10"
        onClick={() => setSnapEnabled(!snapEnabled)}
        title={`Snap to Grid (${snapEnabled ? "On" : "Off"})`}
        aria-label="Toggle snap to grid"
      >
        <Grid3X3 className="h-5 w-5" />
      </Button>
    </div>
  );
}

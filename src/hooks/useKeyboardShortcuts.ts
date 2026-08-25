"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/store/canvasStore";

export function useKeyboardShortcuts(onSave?: () => void) {
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const removeShape = useCanvasStore((state) => state.removeShape);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const copySelection = useCanvasStore((state) => state.copySelection);
  const paste = useCanvasStore((state) => state.paste);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && e.key === "s") {
        e.preventDefault();
        onSave?.();
      }

      if (isCtrlOrMeta && e.key === "c" && selectedIds.length > 0) {
        e.preventDefault();
        copySelection();
      }

      if (isCtrlOrMeta && e.key === "v") {
        e.preventDefault();
        paste();
      }

      if (isCtrlOrMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if (isCtrlOrMeta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }

      if (isCtrlOrMeta && e.key === "y") {
        e.preventDefault();
        redo();
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        for (const id of selectedIds) {
          removeShape(id);
        }
        clearSelection();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, selectedIds, removeShape, clearSelection, copySelection, paste, onSave]);
}

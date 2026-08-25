"use client";

import { useState, useEffect } from "react";
import { Save, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UseProjectReturn } from "@/hooks/useProject";
import { useRouter } from "next/navigation";

interface ProjectToolbarProps {
  project: UseProjectReturn;
  saveDialogRequested: boolean;
  onSaveDialogHandled: () => void;
}

export function ProjectToolbar({
  project,
  saveDialogRequested,
  onSaveDialogHandled,
}: ProjectToolbarProps) {
  const router = useRouter();
  const { currentProject, projects, isLoading, listProjects, loadProject } = project;

  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  useEffect(() => {
    if (saveDialogRequested) {
      // In the new model, save is handled per-hole, not per-project
      onSaveDialogHandled();
    }
  }, [saveDialogRequested, onSaveDialogHandled]);

  useEffect(() => {
    if (loadDialogOpen) {
      listProjects();
    }
  }, [loadDialogOpen, listProjects]);

  async function handleLoad(id: string) {
    await loadProject(id);
    setLoadDialogOpen(false);
    router.push(`/projects/${id}`);
  }

  return (
    <>
      <div className="flex items-center gap-1 rounded-md border bg-background p-1.5 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => setLoadDialogOpen(true)}
          disabled={isLoading}
          title="Open project"
          aria-label="Open project"
        >
          <FolderOpen className="h-5 w-5" />
        </Button>
        {currentProject && (
          <span className="px-2 text-sm text-muted-foreground">
            {currentProject.name}
          </span>
        )}
      </div>

      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Project</DialogTitle>
          </DialogHeader>
          {projects.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">No saved projects.</p>
          )}
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {projects.map((p) => (
              <Button
                key={p.id}
                variant="ghost"
                className="justify-start"
                onClick={() => handleLoad(p.id)}
              >
                <span className="truncate">{p.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

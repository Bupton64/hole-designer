"use client";

import { useState, useCallback } from "react";
import { Project, ProjectSummary } from "@/types/project";

export interface UseProjectReturn {
  currentProject: Project | null;
  projects: ProjectSummary[];
  isLoading: boolean;
  error: string | null;
  listProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<Project | null>;
}

export function useProject(): UseProjectReturn {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to load projects");
      const data: ProjectSummary[] = await response.json();
      setProjects(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProject = useCallback(async (id: string): Promise<Project | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error("Failed to load project");
      const project: Project = await response.json();
      setCurrentProject(project);
      return project;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    currentProject,
    projects,
    isLoading,
    error,
    listProjects,
    loadProject,
  };
}

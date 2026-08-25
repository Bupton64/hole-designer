"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Project, Layout, SponsorTemplate, CanvasData, Hole, createEmptyCanvas } from "@/types/project";
import { BannerEditor } from "@/components/banner/BannerEditor";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [sponsorTemplate, setSponsorTemplate] = useState<SponsorTemplate | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Not found");
        const data: Project = await res.json();
        setProject(data);
        setName(data.name);
        setCourseName(data.courseName);
        setEventName(data.eventName);
        setDate(data.date);
        setLayouts(data.layouts);
        setHoles(data.holes);
        setSponsorTemplate(data.sponsorTemplate);
      } catch {
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [projectId, router]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, courseName, eventName, date, layouts, holes, sponsorTemplate }),
      });
    } finally {
      setIsSaving(false);
    }
  }

  function addLayout() {
    const newLayout: Layout = {
      id: `layout-${Date.now()}`,
      name: "New Layout",
      colour: "#6366f1",
      order: layouts.length,
    };
    setLayouts([...layouts, newLayout]);
  }

  function removeLayout(id: string) {
    setLayouts(layouts.filter((l) => l.id !== id));
  }

  function updateLayout(id: string, field: keyof Layout, value: string | number) {
    setLayouts(
      layouts.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  }

  // Bulk hole management
  function addHoles(count: number) {
    const maxNumber = holes.length > 0 ? Math.max(...holes.map((h) => h.number)) : 0;
    const newHoles: Hole[] = Array.from({ length: count }, (_, i) => ({
      id: `hole-${Date.now()}-${maxNumber + i + 1}`,
      number: maxNumber + i + 1,
      name: "",
      designs: layouts.map((layout) => ({
        id: `design-${Date.now()}-${maxNumber + i + 1}-${layout.id}`,
        layoutId: layout.id,
        canvas: createEmptyCanvas(),
        par: 3,
        distance: 0,
        obRules: "",
        mandoNotes: "",
        notes: "",
      })),
    }));
    setHoles([...holes, ...newHoles]);
  }

  function createDesignsForLayout(layoutId: string) {
    setHoles(
      holes.map((hole) => {
        const hasDesign = hole.designs.some((d) => d.layoutId === layoutId);
        if (hasDesign) return hole;
        return {
          ...hole,
          designs: [
            ...hole.designs,
            {
              id: `design-${Date.now()}-${hole.number}-${layoutId}`,
              layoutId,
              canvas: createEmptyCanvas(),
              par: 3,
              distance: 0,
              obRules: "",
              mandoNotes: "",
              notes: "",
            },
          ],
        };
      })
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Project Settings</h1>
      </div>

      {/* Project details */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Project Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Course Name</label>
            <Input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Event Name</label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </section>

      {/* Layouts */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Layouts</h2>
          <Button size="sm" variant="outline" onClick={addLayout}>
            <Plus className="mr-2 h-4 w-4" />
            Add Layout
          </Button>
        </div>
        <div className="space-y-3">
          {layouts.map((layout) => (
            <div
              key={layout.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <input
                type="color"
                value={layout.colour}
                onChange={(e) =>
                  updateLayout(layout.id, "colour", e.target.value)
                }
                className="h-8 w-8 cursor-pointer rounded border"
              />
              <Input
                value={layout.name}
                onChange={(e) =>
                  updateLayout(layout.id, "name", e.target.value)
                }
                className="flex-1"
                placeholder="Layout name"
              />
              <Input
                type="number"
                value={layout.order}
                onChange={(e) =>
                  updateLayout(layout.id, "order", Number(e.target.value))
                }
                className="w-20"
                title="Sort order"
              />
              {layouts.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLayout(layout.id)}
                  title="Remove layout"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Holes Management */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Holes ({holes.length})</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => addHoles(1)}>
              <Plus className="mr-2 h-4 w-4" />
              Add 1 Hole
            </Button>
            <Button size="sm" variant="outline" onClick={() => addHoles(9)}>
              Add 9 Holes
            </Button>
            <Button size="sm" variant="outline" onClick={() => addHoles(18)}>
              Add 18 Holes
            </Button>
          </div>
        </div>
        {layouts.length > 1 && (
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Create blank designs for all holes:</span>
            {layouts.map((layout) => (
              <Button
                key={layout.id}
                size="sm"
                variant="outline"
                onClick={() => createDesignsForLayout(layout.id)}
              >
                <span
                  className="mr-2 inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: layout.colour }}
                />
                {layout.name}
              </Button>
            ))}
          </div>
        )}
      </section>

      {/* Sponsor Template */}
      {sponsorTemplate && (
        <section className="mb-8">
          <h2 className="text-lg font-medium mb-4">Sponsor Template</h2>
          <div className="space-y-6">
            <BannerEditor
              label="Top Bar"
              canvas={sponsorTemplate.topBar}
              height={sponsorTemplate.topBarHeight}
              onCanvasChange={(c) =>
                setSponsorTemplate({ ...sponsorTemplate, topBar: c })
              }
              onHeightChange={(h) =>
                setSponsorTemplate({ ...sponsorTemplate, topBarHeight: h })
              }
              projectId={projectId}
            />
            <BannerEditor
              label="Info Banner (with tokens)"
              canvas={sponsorTemplate.infoBanner.canvas}
              height={sponsorTemplate.infoBanner.height}
              onCanvasChange={(c) =>
                setSponsorTemplate({
                  ...sponsorTemplate,
                  infoBanner: { ...sponsorTemplate.infoBanner, canvas: c },
                })
              }
              onHeightChange={(h) =>
                setSponsorTemplate({
                  ...sponsorTemplate,
                  infoBanner: { ...sponsorTemplate.infoBanner, height: h },
                })
              }
              showTokens
              projectId={projectId}
            />
            <BannerEditor
              label="Bottom Bar"
              canvas={sponsorTemplate.bottomBar}
              height={sponsorTemplate.bottomBarHeight}
              onCanvasChange={(c) =>
                setSponsorTemplate({ ...sponsorTemplate, bottomBar: c })
              }
              onHeightChange={(h) =>
                setSponsorTemplate({ ...sponsorTemplate, bottomBarHeight: h })
              }
              projectId={projectId}
            />
          </div>
        </section>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

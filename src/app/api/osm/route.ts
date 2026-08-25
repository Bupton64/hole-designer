import { NextResponse } from "next/server";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  nodes?: number[];
  geometry?: { lat: number; lon: number }[];
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export async function POST(request: Request) {
  const body = await request.json();
  const { south, west, north, east } = body;

  if (
    typeof south !== "number" ||
    typeof west !== "number" ||
    typeof north !== "number" ||
    typeof east !== "number"
  ) {
    return NextResponse.json({ error: "Invalid bounding box" }, { status: 400 });
  }

  // Query for features we can convert to hole map elements
  const bbox = `${south},${west},${north},${east}`;
  const query = `
    [out:json][timeout:25];
    (
      // Water features
      way["natural"="water"](${bbox});
      way["waterway"](${bbox});
      // Forest and trees
      way["landuse"="forest"](${bbox});
      way["natural"="wood"](${bbox});
      node["natural"="tree"](${bbox});
      // Scrub and grassland
      way["natural"="scrub"](${bbox});
      way["landuse"="grass"](${bbox});
      way["landuse"="meadow"](${bbox});
      way["leisure"="park"](${bbox});
      // Paths and tracks
      way["highway"="path"](${bbox});
      way["highway"="footway"](${bbox});
      way["highway"="track"](${bbox});
      way["highway"="cycleway"](${bbox});
      // Roads
      way["highway"="residential"](${bbox});
      way["highway"="service"](${bbox});
      way["highway"="tertiary"](${bbox});
      way["highway"="secondary"](${bbox});
      // Buildings
      way["building"](${bbox});
      // Fences and barriers
      way["barrier"="fence"](${bbox});
      way["barrier"="wall"](${bbox});
      // Sand/beach
      way["natural"="sand"](${bbox});
      way["natural"="beach"](${bbox});
    );
    out geom;
  `;

  try {
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query.trim())}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "HoleDesigner/1.0",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Overpass API error ${response.status}:`, text);
      return NextResponse.json(
        { error: `Overpass API returned ${response.status}: ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data: OverpassResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Overpass API fetch failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

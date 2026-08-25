"use client";

import { useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface MapCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

export function MapCapture({ onCapture, onCancel }: MapCaptureProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Default to a central NZ location
  const defaultCenter: L.LatLngExpression = [-36.86, 174.76];
  const defaultZoom = 16;

  async function handleCapture() {
    const map = mapRef.current;
    if (!map) return;

    setIsCapturing(true);

    try {
      // Get the map container dimensions
      const container = map.getContainer();
      const width = container.offsetWidth;
      const height = container.offsetHeight;

      // Create an offscreen canvas
      const canvas = document.createElement("canvas");
      canvas.width = width * 2; // 2x for quality
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      ctx.scale(2, 2);

      // Find all tile images in the map container and draw them
      const tilePane = container.querySelector(".leaflet-tile-pane");
      if (!tilePane) throw new Error("No tile pane found");

      // Get the map's pixel origin offset
      const mapPane = container.querySelector(".leaflet-map-pane") as HTMLElement;
      const transform = mapPane?.style.transform || "";
      const translateMatch = transform.match(/translate3d\((-?\d+)px,\s*(-?\d+)px/);
      const offsetX = translateMatch ? parseInt(translateMatch[1]) : 0;
      const offsetY = translateMatch ? parseInt(translateMatch[2]) : 0;

      // Draw a background
      ctx.fillStyle = "#374151";
      ctx.fillRect(0, 0, width, height);

      // Get all tile layers and their images
      const tileContainers = tilePane.querySelectorAll(".leaflet-tile-container");

      for (const tileContainer of tileContainers) {
        const containerTransform = (tileContainer as HTMLElement).style.transform;
        const containerMatch = containerTransform.match(/translate3d\((-?\d+)px,\s*(-?\d+)px/);
        const containerOffsetX = containerMatch ? parseInt(containerMatch[1]) : 0;
        const containerOffsetY = containerMatch ? parseInt(containerMatch[2]) : 0;

        const tiles = tileContainer.querySelectorAll("img");
        for (const tile of tiles) {
          if (!tile.complete || tile.naturalWidth === 0) continue;

          const tileTransform = tile.style.transform;
          const tileMatch = tileTransform.match(/translate3d\((-?\d+)px,\s*(-?\d+)px/);
          const tileX = tileMatch ? parseInt(tileMatch[1]) : 0;
          const tileY = tileMatch ? parseInt(tileMatch[2]) : 0;

          const drawX = offsetX + containerOffsetX + tileX;
          const drawY = offsetY + containerOffsetY + tileY;
          const tileSize = tile.offsetWidth || 256;

          try {
            ctx.drawImage(tile, drawX, drawY, tileSize, tileSize);
          } catch {
            // CORS errors on some tiles - skip
          }
        }
      }

      const dataUrl = canvas.toDataURL("image/png");
      onCapture(dataUrl);
    } catch (error) {
      console.error("Map capture failed:", error);
      alert("Map capture failed. Try zooming in/out and waiting for tiles to load.");
    } finally {
      setIsCapturing(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold">Capture Course Map Background</h2>
          <p className="text-xs text-muted-foreground">
            Navigate to your course and zoom to fit. Click Capture when ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCapture} disabled={isCapturing}>
            <Camera className="mr-2 h-4 w-4" />
            {isCapturing ? "Capturing..." : "Capture"}
          </Button>
        </div>
      </div>
      <div className="relative flex-1">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          maxZoom={22}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={22}
            maxNativeZoom={19}
            crossOrigin="anonymous"
          />
        </MapContainer>
      </div>
    </div>
  );
}

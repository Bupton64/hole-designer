"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents, Rectangle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";

export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface MapImportProps {
  onImport: (bbox: BoundingBox) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function RectangleDrawer({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: BoundingBox | null) => void;
}) {
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<L.LatLng | null>(null);
  const [endPoint, setEndPoint] = useState<L.LatLng | null>(null);

  useMapEvents({
    mousedown(e) {
      if (e.originalEvent.shiftKey) {
        setDrawing(true);
        setStartPoint(e.latlng);
        setEndPoint(e.latlng);
      }
    },
    mousemove(e) {
      if (drawing) {
        setEndPoint(e.latlng);
      }
    },
    mouseup() {
      if (drawing && startPoint && endPoint) {
        setDrawing(false);
        const bounds: BoundingBox = {
          south: Math.min(startPoint.lat, endPoint.lat),
          west: Math.min(startPoint.lng, endPoint.lng),
          north: Math.max(startPoint.lat, endPoint.lat),
          east: Math.max(startPoint.lng, endPoint.lng),
        };
        onBoundsChange(bounds);
      }
    },
  });

  if (!startPoint || !endPoint) return null;

  const bounds: L.LatLngBoundsExpression = [
    [startPoint.lat, startPoint.lng],
    [endPoint.lat, endPoint.lng],
  ];

  return (
    <Rectangle
      bounds={bounds}
      pathOptions={{
        color: "#3b82f6",
        weight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
      }}
    />
  );
}

export function MapImport({ onImport, onCancel, isLoading }: MapImportProps) {
  const [selectedBounds, setSelectedBounds] = useState<BoundingBox | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Default to a central NZ location
  const defaultCenter: L.LatLngExpression = [-41.29, 174.78];
  const defaultZoom = 16;

  function handleImport() {
    if (selectedBounds) {
      onImport(selectedBounds);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold">Import from Map</h2>
          <p className="text-xs text-muted-foreground">
            Navigate to your course. Shift+drag to select an area.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={!selectedBounds || isLoading}
          >
            {isLoading ? "Importing..." : "Import Area"}
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
            attribution='&copy; <a href="https://www.esri.com">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={22}
            maxNativeZoom={19}
          />
          <RectangleDrawer onBoundsChange={setSelectedBounds} />
        </MapContainer>
        {selectedBounds && (
          <div className="absolute bottom-4 left-4 rounded bg-background/90 px-3 py-2 text-xs shadow">
            Selected: {(selectedBounds.north - selectedBounds.south).toFixed(5)}° x {(selectedBounds.east - selectedBounds.west).toFixed(5)}°
          </div>
        )}
      </div>
    </div>
  );
}

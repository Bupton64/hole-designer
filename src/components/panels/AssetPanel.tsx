"use client";

import { useState } from "react";
import {
  ASSET_CATEGORIES,
  getAssetsByCategory,
  AssetDefinition,
  AssetCategory,
} from "@/lib/assets/discGolfAssets";

interface AssetPanelProps {
  onAssetSelect: (asset: AssetDefinition) => void;
}

function AssetPreview({ asset }: { asset: AssetDefinition }) {
  const viewBox = `0 0 ${asset.width} ${asset.height}`;
  const isCompound = Array.isArray(asset.paths) && asset.paths.length > 0;

  return (
    <svg
      viewBox={viewBox}
      className="h-14 w-14"
      aria-hidden="true"
    >
      {isCompound ? (
        asset.paths!.map((subPath, i) => (
          <path
            key={i}
            d={subPath.d}
            fill={subPath.fill}
            stroke={subPath.stroke}
            strokeWidth={subPath.strokeWidth}
            strokeDasharray={subPath.dash ? subPath.dash.join(" ") : undefined}
            opacity={subPath.opacity ?? 1}
          />
        ))
      ) : (
        <path
          d={asset.svgPath}
          fill={asset.defaultFill === "none" ? "none" : asset.defaultFill}
          stroke={asset.defaultStroke}
          strokeWidth={asset.defaultStrokeWidth}
        />
      )}
    </svg>
  );
}

export function AssetPanel({ onAssetSelect }: AssetPanelProps) {
  const [activeCategory, setActiveCategory] = useState<AssetCategory>("targets");
  const assets = getAssetsByCategory(activeCategory);

  return (
    <div className="flex h-full w-72 flex-col border-r bg-background">
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-semibold">Assets</h2>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 border-b px-3 py-2.5">
        {ASSET_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded px-2.5 py-1 text-sm ${
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Asset grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-3 gap-2">
          {assets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => onAssetSelect(asset)}
              className="flex flex-col items-center gap-1.5 rounded border bg-white p-2 hover:border-primary hover:bg-accent"
              title={asset.name}
            >
              <AssetPreview asset={asset} />
              <span className="text-xs leading-tight text-muted-foreground text-center">
                {asset.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

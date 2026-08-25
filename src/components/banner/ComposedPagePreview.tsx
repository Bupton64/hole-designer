"use client";

import { useRef } from "react";
import { Stage, Layer, Rect, Text, Group } from "react-konva";
import Konva from "konva";
import { Shape, TextShape } from "@/store/canvasStore";
import { SponsorTemplate, HoleDesign, CanvasData } from "@/types/project";
import { ARTBOARD_WIDTH, ARTBOARD_HEIGHT } from "@/components/canvas/Canvas";

interface ComposedPagePreviewProps {
  sponsorTemplate: SponsorTemplate;
  design: HoleDesign;
  holeNumber: number;
  holeName: string;
  canvasShapes: Shape[];
  canvasBackground: string;
}

function substituteTokens(text: string, data: {
  hole: number;
  par: number;
  distance: number;
  ob: string;
  mando: string;
  name: string;
}): string {
  return text
    .replace(/\{\{hole\}\}/g, String(data.hole))
    .replace(/\{\{par\}\}/g, String(data.par))
    .replace(/\{\{distance\}\}/g, data.distance > 0 ? `${data.distance}m` : "")
    .replace(/\{\{ob\}\}/g, data.ob)
    .replace(/\{\{mando\}\}/g, data.mando)
    .replace(/\{\{name\}\}/g, data.name);
}

function BannerLayer({
  canvas,
  offsetY,
  height,
  tokenData,
}: {
  canvas: CanvasData;
  offsetY: number;
  height: number;
  tokenData?: {
    hole: number;
    par: number;
    distance: number;
    ob: string;
    mando: string;
    name: string;
  };
}) {
  return (
    <Group y={offsetY}>
      <Rect x={0} y={0} width={ARTBOARD_WIDTH} height={height} fill={canvas.backgroundColor} />
      {canvas.shapes.map((shape) => {
        if (shape.type === "text") {
          const displayText = tokenData
            ? substituteTokens(shape.text, tokenData)
            : shape.text;
          return (
            <Text
              key={shape.id}
              x={shape.x}
              y={shape.y}
              text={displayText}
              fontSize={shape.fontSize}
              fontFamily={shape.fontFamily}
              fontStyle={shape.fontStyle}
              fill={shape.fill}
              rotation={shape.rotation}
              listening={false}
            />
          );
        }
        return null;
      })}
    </Group>
  );
}

export function ComposedPagePreview({
  sponsorTemplate,
  design,
  holeNumber,
  holeName,
  canvasShapes,
  canvasBackground,
}: ComposedPagePreviewProps) {
  const { topBar, topBarHeight, bottomBar, bottomBarHeight, infoBanner } = sponsorTemplate;

  const totalHeight =
    topBarHeight + ARTBOARD_HEIGHT + infoBanner.height + bottomBarHeight;

  const tokenData = {
    hole: holeNumber,
    par: design.par,
    distance: design.distance,
    ob: design.obRules,
    mando: design.mandoNotes,
    name: holeName,
  };

  // Scale to fit in a reasonable preview container
  const maxPreviewHeight = 700;
  const scale = Math.min(1, maxPreviewHeight / totalHeight);
  const previewWidth = ARTBOARD_WIDTH * scale;
  const previewHeight = totalHeight * scale;

  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-xs text-muted-foreground">
        Composed page ({ARTBOARD_WIDTH} x {totalHeight}px)
      </p>
      <div
        className="border shadow-md"
        style={{ width: previewWidth, height: previewHeight, overflow: "hidden" }}
      >
        <Stage
          width={previewWidth}
          height={previewHeight}
          scaleX={scale}
          scaleY={scale}
          listening={false}
        >
          <Layer>
            {/* Top bar */}
            <BannerLayer
              canvas={topBar}
              offsetY={0}
              height={topBarHeight}
            />

            {/* Main canvas area */}
            <Group y={topBarHeight}>
              <Rect
                x={0}
                y={0}
                width={ARTBOARD_WIDTH}
                height={ARTBOARD_HEIGHT}
                fill={canvasBackground}
              />
              {/* Simplified: just show shape count indicator for now */}
              {canvasShapes.length > 0 && (
                <Text
                  x={ARTBOARD_WIDTH / 2 - 60}
                  y={ARTBOARD_HEIGHT / 2 - 10}
                  text={`[${canvasShapes.length} shapes]`}
                  fontSize={14}
                  fill="#9ca3af"
                  listening={false}
                />
              )}
            </Group>

            {/* Info banner (with token substitution) */}
            <BannerLayer
              canvas={infoBanner.canvas}
              offsetY={topBarHeight + ARTBOARD_HEIGHT}
              height={infoBanner.height}
              tokenData={tokenData}
            />

            {/* Bottom bar */}
            <BannerLayer
              canvas={bottomBar}
              offsetY={topBarHeight + ARTBOARD_HEIGHT + infoBanner.height}
              height={bottomBarHeight}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

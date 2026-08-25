"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Rect, Ellipse, Line, Path, Text, Transformer, Group, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { useCanvasStore, Shape, RectShape, EllipseShape, LineShape, AssetShape, TextShape, FairwayShape, OBLineShape, StreamShape, ImageShape } from "@/store/canvasStore";
import { generateId } from "@/lib/generateId";
import { generateFairwayGeometry, smoothSpine } from "@/lib/fairwayGeometry";

export const ARTBOARD_WIDTH = 800;
export const ARTBOARD_HEIGHT = 1200;

type DrawingShape = RectShape | EllipseShape | LineShape;

interface DrawState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentShape: DrawingShape | null;
}

function SelectableRect({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: {
  shape: RectShape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, node: Konva.Node) => void;
}) {
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Rect
        ref={shapeRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        rotation={shape.rotation}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        visible={shape.visible}
        opacity={isSelected ? 0.5 : 1}
        draggable={!shape.locked}
        onClick={() => onSelect(shape.id)}
        onTap={() => onSelect(shape.id)}
        onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (node) onTransformEnd(shape.id, node);
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}

function SelectableEllipse({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: {
  shape: EllipseShape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, node: Konva.Node) => void;
}) {
  const shapeRef = useRef<Konva.Ellipse>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Ellipse
        ref={shapeRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        radiusX={shape.radiusX}
        radiusY={shape.radiusY}
        rotation={shape.rotation}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        visible={shape.visible}
        opacity={isSelected ? 0.5 : 1}
        draggable={!shape.locked}
        onClick={() => onSelect(shape.id)}
        onTap={() => onSelect(shape.id)}
        onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (node) onTransformEnd(shape.id, node);
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}

function SelectableLine({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: {
  shape: Shape & { type: "line" };
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, node: Konva.Node) => void;
}) {
  const shapeRef = useRef<Konva.Line>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Line
        ref={shapeRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        points={shape.points}
        rotation={shape.rotation}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        closed={shape.closed}
        fill={shape.closed ? shape.fill : undefined}
        visible={shape.visible}
        opacity={isSelected ? 0.5 : 1}
        draggable={!shape.locked}
        onClick={() => onSelect(shape.id)}
        onTap={() => onSelect(shape.id)}
        onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (node) onTransformEnd(shape.id, node);
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}

function SelectableAsset({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: {
  shape: AssetShape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, node: Konva.Node) => void;
}) {
  const shapeRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const isCompound = Array.isArray(shape.paths) && shape.paths.length > 0;
  const viewboxW = shape.viewboxWidth ?? 40;
  const viewboxH = shape.viewboxHeight ?? 40;
  const scaleX = shape.width / viewboxW;
  const scaleY = shape.height / viewboxH;

  return (
    <>
      <Group
        ref={shapeRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        rotation={shape.rotation}
        scaleX={scaleX}
        scaleY={scaleY}
        visible={shape.visible}
        opacity={isSelected ? 0.5 : 1}
        draggable={!shape.locked}
        onClick={() => onSelect(shape.id)}
        onTap={() => onSelect(shape.id)}
        onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (node) onTransformEnd(shape.id, node);
        }}
      >
        {isCompound ? (
          shape.paths!.map((subPath, i) => (
            <Path
              key={i}
              data={subPath.d}
              fill={subPath.fill === "none" ? undefined : subPath.fill}
              stroke={subPath.stroke === "none" ? undefined : subPath.stroke}
              strokeWidth={subPath.strokeWidth}
              dash={subPath.dash}
              opacity={subPath.opacity ?? 1}
            />
          ))
        ) : (
          <Path
            data={shape.svgPath}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
          />
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}

function SelectableText({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onDoubleClick,
}: {
  shape: TextShape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, node: Konva.Node) => void;
  onDoubleClick: (id: string) => void;
}) {
  const shapeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Text
        ref={shapeRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        text={shape.text}
        fontSize={shape.fontSize}
        fontFamily={shape.fontFamily}
        fontStyle={shape.fontStyle}
        fill={shape.fill}
        rotation={shape.rotation}
        visible={shape.visible}
        opacity={isSelected ? 0.5 : 1}
        draggable={!shape.locked}
        onClick={() => onSelect(shape.id)}
        onTap={() => onSelect(shape.id)}
        onDblClick={() => onDoubleClick(shape.id)}
        onDblTap={() => onDoubleClick(shape.id)}
        onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (node) onTransformEnd(shape.id, node);
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          enabledAnchors={["middle-left", "middle-right"]}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 20) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}

function FairwayRenderer({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
}: {
  shape: FairwayShape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}) {
  const updateShape = useCanvasStore((state) => state.updateShape);
  const smoothed = smoothSpine(shape.spinePoints, 8);
  const geometry = generateFairwayGeometry(smoothed, shape.maxWidth);

  if (geometry.mid.length === 0) return null;

  const numPoints = shape.spinePoints.length / 2;

  return (
    <Group
      id={shape.id}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation}
      visible={shape.visible}
      opacity={isSelected ? 0.85 : 1}
      draggable={!shape.locked && !isSelected}
      onClick={() => onSelect(shape.id)}
      onTap={() => onSelect(shape.id)}
      onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
    >
      <Line points={geometry.mid} closed fill={shape.midFill} />
      <Line points={geometry.inner} closed fill={shape.innerFill} listening={false} />
      {isSelected && (
        <>
          {/* Spine line connecting handles */}
          <Line
            points={shape.spinePoints}
            stroke="#ffffff"
            strokeWidth={1.5}
            dash={[4, 4]}
            listening={false}
          />
          {/* Draggable handles for each spine point */}
          {Array.from({ length: numPoints }, (_, i) => (
            <Ellipse
              key={i}
              x={shape.spinePoints[i * 2]}
              y={shape.spinePoints[i * 2 + 1]}
              radiusX={6}
              radiusY={6}
              fill="#ffffff"
              stroke="#333333"
              strokeWidth={1.5}
              draggable
              onDragStart={(e) => {
                e.cancelBubble = true;
              }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                const node = e.target;
                updateShape(shape.id, (s) => {
                  if (s.type !== "fairway") return s;
                  const newPoints = [...s.spinePoints];
                  newPoints[i * 2] = node.x();
                  newPoints[i * 2 + 1] = node.y();
                  return { ...s, spinePoints: newPoints };
                });
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
              }}
            />
          ))}
        </>
      )}
    </Group>
  );
}

function OBLineRenderer({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
}: {
  shape: OBLineShape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}) {
  const updateShape = useCanvasStore((state) => state.updateShape);
  const numPoints = shape.points.length / 2;

  return (
    <Group
      id={shape.id}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation}
      visible={shape.visible}
      opacity={isSelected ? 0.85 : 1}
      draggable={!shape.locked && !isSelected}
      onClick={() => onSelect(shape.id)}
      onTap={() => onSelect(shape.id)}
      onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
    >
      <Line
        points={shape.points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        dash={shape.dash}
        lineCap="round"
        lineJoin="round"
        listening={true}
        hitStrokeWidth={12}
      />
      {isSelected && (
        <>
          {/* Draggable handles for each point */}
          {Array.from({ length: numPoints }, (_, i) => (
            <Ellipse
              key={i}
              x={shape.points[i * 2]}
              y={shape.points[i * 2 + 1]}
              radiusX={6}
              radiusY={6}
              fill="#ffffff"
              stroke="#dc2626"
              strokeWidth={1.5}
              draggable
              onDragStart={(e) => {
                e.cancelBubble = true;
              }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                const node = e.target;
                updateShape(shape.id, (s) => {
                  if (s.type !== "obline") return s;
                  const newPoints = [...s.points];
                  newPoints[i * 2] = node.x();
                  newPoints[i * 2 + 1] = node.y();
                  return { ...s, points: newPoints };
                });
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
              }}
            />
          ))}
        </>
      )}
    </Group>
  );
}

function StreamRenderer({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
}: {
  shape: StreamShape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}) {
  const updateShape = useCanvasStore((state) => state.updateShape);
  const numPoints = shape.points.length / 2;
  const smoothed = smoothSpine(shape.points, 8);

  return (
    <Group
      id={shape.id}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation}
      visible={shape.visible}
      opacity={isSelected ? 0.85 : 1}
      draggable={!shape.locked && !isSelected}
      onClick={() => onSelect(shape.id)}
      onTap={() => onSelect(shape.id)}
      onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
    >
      {/* Thin dark blue edge lines (rendered as wider stroke underneath) */}
      <Line
        points={smoothed}
        stroke={shape.edgeStroke}
        strokeWidth={shape.fillWidth + shape.edgeWidth * 2}
        lineCap="round"
        lineJoin="round"
        listening={true}
        hitStrokeWidth={14}
      />
      {/* Thick light blue centre fill on top */}
      <Line
        points={smoothed}
        stroke={shape.fillStroke}
        strokeWidth={shape.fillWidth}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
      {isSelected && (
        <>
          {Array.from({ length: numPoints }, (_, i) => (
            <Ellipse
              key={i}
              x={shape.points[i * 2]}
              y={shape.points[i * 2 + 1]}
              radiusX={6}
              radiusY={6}
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth={1.5}
              draggable
              onDragStart={(e) => {
                e.cancelBubble = true;
              }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                const node = e.target;
                updateShape(shape.id, (s) => {
                  if (s.type !== "stream") return s;
                  const newPoints = [...s.points];
                  newPoints[i * 2] = node.x();
                  newPoints[i * 2 + 1] = node.y();
                  return { ...s, points: newPoints };
                });
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
              }}
            />
          ))}
        </>
      )}
    </Group>
  );
}

function ImageRenderer({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: {
  shape: ImageShape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, node: Konva.Node) => void;
}) {
  const shapeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = shape.src;
    img.onload = () => setImage(img);
  }, [shape.src]);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  if (!image) return null;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        rotation={shape.rotation}
        image={image}
        visible={shape.visible}
        opacity={isSelected ? 0.7 : 1}
        draggable={!shape.locked}
        onClick={() => onSelect(shape.id)}
        onTap={() => onSelect(shape.id)}
        onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (node) onTransformEnd(shape.id, node);
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}

function ShapeRenderer({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onDoubleClick,
}: {
  shape: Shape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, node: Konva.Node) => void;
  onDoubleClick: (id: string) => void;
}) {
  switch (shape.type) {
    case "rectangle":
      return (
        <SelectableRect
          shape={shape}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
        />
      );
    case "ellipse":
      return (
        <SelectableEllipse
          shape={shape}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
        />
      );
    case "line":
      return (
        <SelectableLine
          shape={shape}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
        />
      );
    case "asset":
      return (
        <SelectableAsset
          shape={shape}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
        />
      );
    case "text":
      return (
        <SelectableText
          shape={shape}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
          onDoubleClick={onDoubleClick}
        />
      );
    case "fairway":
      return (
        <FairwayRenderer
          shape={shape}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      );
    case "obline":
      return (
        <OBLineRenderer
          shape={shape}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      );
    case "stream":
      return (
        <StreamRenderer
          shape={shape}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      );
    case "image":
      return (
        <ImageRenderer
          shape={shape}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
        />
      );
  }
}

function DrawingPreview({ shape }: { shape: DrawingShape }) {
  switch (shape.type) {
    case "rectangle":
      return (
        <Rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          listening={false}
        />
      );
    case "ellipse":
      return (
        <Ellipse
          x={shape.x}
          y={shape.y}
          radiusX={shape.radiusX}
          radiusY={shape.radiusY}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          listening={false}
        />
      );
    case "line":
      return (
        <Line
          x={shape.x}
          y={shape.y}
          points={shape.points}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          closed={false}
          listening={false}
        />
      );
  }
}

interface CanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function Canvas({ stageRef }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const hasCentered = useRef(false);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        setDimensions({ width, height });

        // Center artboard on first meaningful size
        if (!hasCentered.current && width > 0 && height > 0 && stageRef.current) {
          const scale = Math.min(
            (width * 0.9) / ARTBOARD_WIDTH,
            (height * 0.9) / ARTBOARD_HEIGHT
          );
          const x = (width - ARTBOARD_WIDTH * scale) / 2;
          const y = (height - ARTBOARD_HEIGHT * scale) / 2;
          stageRef.current.scale({ x: scale, y: scale });
          stageRef.current.position({ x, y });
          hasCentered.current = true;
        }
      }
    }

    updateSize();

    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [stageRef]);
  const shapes = useCanvasStore((state) => state.shapes);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const addShape = useCanvasStore((state) => state.addShape);
  const addShapeToBack = useCanvasStore((state) => state.addShapeToBack);
  const updateShape = useCanvasStore((state) => state.updateShape);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const setSelectedIds = useCanvasStore((state) => state.setSelectedIds);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const defaultFill = useCanvasStore((state) => state.defaultFill);
  const defaultStroke = useCanvasStore((state) => state.defaultStroke);
  const defaultStrokeWidth = useCanvasStore((state) => state.defaultStrokeWidth);
  const snapToGrid = useCanvasStore((state) => state.snapToGrid);
  const backgroundColor = useCanvasStore((state) => state.backgroundColor);

  const [drawState, setDrawState] = useState<DrawState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentShape: null,
  });

  const [isPanning, setIsPanning] = useState(false);

  // Marquee (area) selection state
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const marqueeJustFinished = useRef(false);

  // Multi-drag state: track the drag start position to compute delta for all selected shapes
  const [multiDragStart, setMultiDragStart] = useState<{ x: number; y: number } | null>(null);

  // Fairway tool state: accumulate spine points until double-click finishes
  const [fairwayPoints, setFairwayPoints] = useState<number[]>([]);

  // OB Line tool state: accumulate points until Enter finishes
  const [oblinePoints, setOblinePoints] = useState<number[]>([]);

  // Stream tool state: accumulate points until Enter finishes
  const [streamPoints, setStreamPoints] = useState<number[]>([]);

  // Clear fairway points when switching away from fairway tool
  useEffect(() => {
    if (activeTool !== "fairway") {
      setFairwayPoints([]);
    }
  }, [activeTool]);

  // Clear obline points when switching away from obline tool
  useEffect(() => {
    if (activeTool !== "obline") {
      setOblinePoints([]);
    }
  }, [activeTool]);

  // Clear stream points when switching away from stream tool
  useEffect(() => {
    if (activeTool !== "stream") {
      setStreamPoints([]);
    }
  }, [activeTool]);

  const getPointerPosition = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    // Transform screen coordinates to canvas coordinates accounting for zoom/pan
    const transform = stage.getAbsoluteTransform().copy().invert();
    const point = transform.point(pos);
    return { x: point.x, y: point.y };
  }, [stageRef]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Clamp zoom between 0.1x and 10x
    const clampedScale = Math.max(0.1, Math.min(10, newScale));

    stage.scale({ x: clampedScale, y: clampedScale });
    stage.position({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }, [stageRef]);


  function handleSelect(id: string) {
    // Don't allow selection while drawing a fairway or OB line
    if (activeTool === "fairway" || activeTool === "obline" || activeTool === "stream") return;

    if (activeTool !== "select") {
      setActiveTool("select");
    }
    setSelectedIds([id]);
  }

  function handleDragEnd(id: string, x: number, y: number) {
    if (activeTool === "select") {
      const snappedX = snapToGrid(x);
      const snappedY = snapToGrid(y);

      // Get the original shape position to compute delta
      const originalShape = shapes.find((s) => s.id === id);
      if (!originalShape) return;

      const deltaX = snappedX - originalShape.x;
      const deltaY = snappedY - originalShape.y;

      // If this shape is part of a multi-selection, move all selected shapes by the same delta
      if (selectedIds.length > 1 && selectedIds.includes(id)) {
        for (const selectedId of selectedIds) {
          updateShape(selectedId, (shape) => ({
            ...shape,
            x: selectedId === id ? snappedX : snapToGrid(shape.x + deltaX),
            y: selectedId === id ? snappedY : snapToGrid(shape.y + deltaY),
          }));
        }
      } else {
        updateShape(id, (shape) => ({
          ...shape,
          x: snappedX,
          y: snappedY,
        }));
      }
    }
  }

  function handleDoubleClick(id: string) {
    const shape = shapes.find((s) => s.id === id);
    if (!shape || shape.type !== "text") return;
    const newText = window.prompt("Edit text:", shape.text);
    if (newText !== null && newText !== shape.text) {
      updateShape(id, (s) => ({ ...s, text: newText }));
    }
  }

  function handleTransformEnd(id: string, node: Konva.Node) {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale on the node - we bake it into dimensions
    node.scaleX(1);
    node.scaleY(1);

    updateShape(id, (shape) => {
      const base = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      switch (shape.type) {
        case "rectangle":
          return {
            ...shape,
            ...base,
            width: Math.max(shape.width * scaleX, 1),
            height: Math.max(shape.height * scaleY, 1),
          };
        case "ellipse":
          return {
            ...shape,
            ...base,
            radiusX: Math.max(shape.radiusX * scaleX, 1),
            radiusY: Math.max(shape.radiusY * scaleY, 1),
          };
        case "line":
          return {
            ...shape,
            ...base,
            points: shape.points.map((p, i) =>
              i % 2 === 0 ? p * scaleX : p * scaleY
            ),
          };
        case "asset": {
          // The Group renders with scaleX = width / viewboxWidth (fallback 40).
          // Konva's scaleX/Y includes that base scale plus user transform.
          // We need to extract only the user's transform delta.
          const vw = shape.viewboxWidth ?? 40;
          const vh = shape.viewboxHeight ?? 40;
          const baseScaleX = shape.width / vw;
          const baseScaleY = shape.height / vh;
          const userScaleX = scaleX / baseScaleX;
          const userScaleY = scaleY / baseScaleY;
          return {
            ...shape,
            ...base,
            width: Math.max(shape.width * userScaleX, 1),
            height: Math.max(shape.height * userScaleY, 1),
          };
        }
        case "text":
          return {
            ...shape,
            ...base,
            fontSize: Math.max(shape.fontSize * scaleY, 8),
          };
        case "fairway":
          return {
            ...shape,
            ...base,
          };
        case "obline":
          return {
            ...shape,
            ...base,
          };
        case "stream":
          return {
            ...shape,
            ...base,
          };
        case "image":
          return {
            ...shape,
            ...base,
            width: Math.max(shape.width * scaleX, 1),
            height: Math.max(shape.height * scaleY, 1),
          };
      }
    });
  }

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    const targetName = e.target.name();
    const clickedOnEmpty =
      e.target === stageRef.current || targetName === "background" || targetName === "artboard";
    // Fairway tool: single click adds a spine point (regardless of what's under cursor)
    if (activeTool === "fairway") {
      const pos = getPointerPosition();
      if (!pos) return;
      setFairwayPoints((prev) => [...prev, snapToGrid(pos.x), snapToGrid(pos.y)]);
      return;
    }

    // OB Line tool: single click adds a point
    if (activeTool === "obline") {
      const pos = getPointerPosition();
      if (!pos) return;
      setOblinePoints((prev) => [...prev, snapToGrid(pos.x), snapToGrid(pos.y)]);
      return;
    }

    // Stream tool: single click adds a point
    if (activeTool === "stream") {
      const pos = getPointerPosition();
      if (!pos) return;
      setStreamPoints((prev) => [...prev, snapToGrid(pos.x), snapToGrid(pos.y)]);
      return;
    }

    if (activeTool === "select" && clickedOnEmpty) {
      // Don't clear selection if a marquee drag just completed (click fires after mouseup)
      if (marqueeJustFinished.current) {
        marqueeJustFinished.current = false;
        return;
      }
      clearSelection();
    }
  }

  function handleStageDblClick(e: Konva.KonvaEventObject<MouseEvent>) {
    // Double-click no longer finishes fairway - Enter key does instead
  }

  // Fairway and OB Line tools: Enter key finishes drawing
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (activeTool === "fairway" && e.key === "Enter" && fairwayPoints.length >= 4) {
        e.preventDefault();
        const fairwayShape: FairwayShape = {
          id: generateId(),
          type: "fairway",
          x: 0,
          y: 0,
          rotation: 0,
          spinePoints: fairwayPoints,
          maxWidth: 60,
          outerFill: "#5a7a2e",
          midFill: "#7a9a3e",
          innerFill: "#a4c46a",
          visible: true,
          locked: false,
        };
        addShapeToBack(fairwayShape);
        setFairwayPoints([]);
        setActiveTool("select");
      }
      // Escape cancels fairway drawing
      if (activeTool === "fairway" && e.key === "Escape") {
        setFairwayPoints([]);
        setActiveTool("select");
      }
      // OB Line: Enter finishes drawing (need at least 2 points = 4 values)
      if (activeTool === "obline" && e.key === "Enter" && oblinePoints.length >= 4) {
        e.preventDefault();
        const oblineShape: OBLineShape = {
          id: generateId(),
          type: "obline",
          x: 0,
          y: 0,
          rotation: 0,
          points: oblinePoints,
          stroke: "#dc2626",
          strokeWidth: 2.5,
          dash: [8, 6],
          visible: true,
          locked: false,
        };
        addShape(oblineShape);
        setOblinePoints([]);
        setActiveTool("select");
      }
      // Escape cancels OB line drawing
      if (activeTool === "obline" && e.key === "Escape") {
        setOblinePoints([]);
        setActiveTool("select");
      }
      // Stream: Enter finishes drawing (need at least 2 points = 4 values)
      if (activeTool === "stream" && e.key === "Enter" && streamPoints.length >= 4) {
        e.preventDefault();
        const streamShape: StreamShape = {
          id: generateId(),
          type: "stream",
          x: 0,
          y: 0,
          rotation: 0,
          points: streamPoints,
          fillStroke: "#7dd3fc",
          fillWidth: 16,
          edgeStroke: "#1e40af",
          edgeWidth: 1.5,
          visible: true,
          locked: false,
        };
        addShape(streamShape);
        setStreamPoints([]);
        setActiveTool("select");
      }
      // Escape cancels stream drawing
      if (activeTool === "stream" && e.key === "Escape") {
        setStreamPoints([]);
        setActiveTool("select");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool, fairwayPoints, oblinePoints, streamPoints, addShape, addShapeToBack, setActiveTool]);

  const isDrawingTool = activeTool === "rectangle" || activeTool === "ellipse" || activeTool === "line" || activeTool === "freehand";

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle pan start (middle click or pan tool)
    if (e.evt.button === 1 || activeTool === "pan") {
      setIsPanning(true);
      const stage = stageRef.current;
      if (stage) {
        stage.container().style.cursor = "grabbing";
      }
      return;
    }

    if (!isDrawingTool && activeTool !== "text" && activeTool !== "select") return;

    const clickedOnEmpty =
      e.target === stageRef.current || e.target.name() === "background" || e.target.name() === "artboard";
    if (!clickedOnEmpty) return;

    const pos = getPointerPosition();
    if (!pos) return;

    // Select tool: start marquee selection
    if (activeTool === "select") {
      setMarquee({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
      return;
    }

    // Text tool: place text immediately
    if (activeTool === "text") {
      const textShape: TextShape = {
        id: generateId(),
        type: "text",
        x: snapToGrid(pos.x),
        y: snapToGrid(pos.y),
        text: "Text",
        fontSize: 24,
        fontFamily: "Arial",
        fontStyle: "normal",
        fill: defaultStroke,
        rotation: 0,
        visible: true,
        locked: false,
      };
      addShape(textShape);
      setSelectedIds([textShape.id]);
      setActiveTool("select");
      return;
    }

    let newShape: DrawingShape;

    if (activeTool === "rectangle") {
      newShape = {
        id: generateId(),
        type: "rectangle",
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        rotation: 0,
        fill: defaultFill,
        stroke: defaultStroke,
        strokeWidth: defaultStrokeWidth,
        visible: true,
        locked: false,
      };
    } else if (activeTool === "ellipse") {
      newShape = {
        id: generateId(),
        type: "ellipse",
        x: pos.x,
        y: pos.y,
        radiusX: 0,
        radiusY: 0,
        rotation: 0,
        fill: defaultFill,
        stroke: defaultStroke,
        strokeWidth: defaultStrokeWidth,
        visible: true,
        locked: false,
      };
    } else {
      // line and freehand both create LineShape
      newShape = {
        id: generateId(),
        type: "line",
        x: 0,
        y: 0,
        points: [pos.x, pos.y],
        rotation: 0,
        stroke: defaultStroke,
        strokeWidth: defaultStrokeWidth,
        closed: false,
        fill: defaultFill,
        visible: true,
        locked: false,
      };
    }

    setDrawState({
      isDrawing: true,
      startX: pos.x,
      startY: pos.y,
      currentShape: newShape,
    });
  }, [isDrawingTool, activeTool, getPointerPosition, stageRef, snapToGrid, defaultFill, defaultStroke, defaultStrokeWidth, addShape, setSelectedIds, setActiveTool]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning) {
      const stage = stageRef.current;
      if (!stage) return;
      stage.position({
        x: stage.x() + e.evt.movementX,
        y: stage.y() + e.evt.movementY,
      });
      return;
    }

    // Update marquee selection rectangle
    if (marquee) {
      const pos = getPointerPosition();
      if (pos) {
        setMarquee((prev) => prev ? { ...prev, endX: pos.x, endY: pos.y } : null);
      }
      return;
    }

    if (!drawState.isDrawing || !drawState.currentShape) return;

    const pos = getPointerPosition();
    if (!pos) return;

    const width = Math.abs(pos.x - drawState.startX);
    const height = Math.abs(pos.y - drawState.startY);

    setDrawState((prev) => {
      if (!prev.currentShape) return prev;

      if (prev.currentShape.type === "rectangle") {
        const x = Math.min(pos.x, prev.startX);
        const y = Math.min(pos.y, prev.startY);
        return {
          ...prev,
          currentShape: { ...prev.currentShape, x, y, width, height },
        };
      }

      if (prev.currentShape.type === "ellipse") {
        return {
          ...prev,
          currentShape: {
            ...prev.currentShape,
            x: (drawState.startX + pos.x) / 2,
            y: (drawState.startY + pos.y) / 2,
            radiusX: width / 2,
            radiusY: height / 2,
          },
        };
      }

      // Line type: straight line tool uses start + current (2 points)
      // Freehand appends every point
      if (prev.currentShape.type === "line") {
        if (activeTool === "freehand") {
          return {
            ...prev,
            currentShape: {
              ...prev.currentShape,
              points: [...prev.currentShape.points, pos.x, pos.y],
            },
          };
        }
        // Straight line: always just start point + current point
        return {
          ...prev,
          currentShape: {
            ...prev.currentShape,
            points: [prev.startX, prev.startY, pos.x, pos.y],
          },
        };
      }

      return prev;
    });
  }, [isPanning, marquee, stageRef, activeTool, drawState.isDrawing, drawState.currentShape, drawState.startX, drawState.startY, getPointerPosition]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      const stage = stageRef.current;
      if (stage) {
        stage.container().style.cursor = activeTool === "pan" ? "grab" : "default";
      }
      return;
    }

    // Finalize marquee selection
    if (marquee) {
      const x1 = Math.min(marquee.startX, marquee.endX);
      const y1 = Math.min(marquee.startY, marquee.endY);
      const x2 = Math.max(marquee.startX, marquee.endX);
      const y2 = Math.max(marquee.startY, marquee.endY);
      const width = x2 - x1;
      const height = y2 - y1;

      // Only select if dragged a meaningful distance (avoid single clicks triggering empty selection)
      if (width > 5 || height > 5) {
        const hitIds = shapes.filter((shape) => {
          if (!shape.visible || shape.locked) return false;
          const sx = shape.x;
          const sy = shape.y;
          // Simple bounding check: shape origin is within the marquee rect
          // For more complex shapes we check their approximate bounds
          switch (shape.type) {
            case "rectangle":
              return sx < x2 && sx + shape.width > x1 && sy < y2 && sy + shape.height > y1;
            case "ellipse":
              return sx - shape.radiusX < x2 && sx + shape.radiusX > x1 && sy - shape.radiusY < y2 && sy + shape.radiusY > y1;
            case "asset":
              return sx < x2 && sx + shape.width > x1 && sy < y2 && sy + shape.height > y1;
            case "text":
              return sx >= x1 && sx <= x2 && sy >= y1 && sy <= y2;
            case "fairway":
            case "obline":
            case "stream": {
              const pts = shape.type === "fairway" ? shape.spinePoints : shape.points;
              // Check if any control point falls within the marquee
              for (let i = 0; i < pts.length; i += 2) {
                const px = pts[i] + sx;
                const py = pts[i + 1] + sy;
                if (px >= x1 && px <= x2 && py >= y1 && py <= y2) return true;
              }
              return false;
            }
            case "line": {
              for (let i = 0; i < shape.points.length; i += 2) {
                const px = shape.points[i] + sx;
                const py = shape.points[i + 1] + sy;
                if (px >= x1 && px <= x2 && py >= y1 && py <= y2) return true;
              }
              return false;
            }
            default:
              return sx >= x1 && sx <= x2 && sy >= y1 && sy <= y2;
          }
        }).map((s) => s.id);

        if (hitIds.length > 0) {
          setSelectedIds(hitIds);
        } else {
          clearSelection();
        }
      }

      setMarquee(null);
      marqueeJustFinished.current = true;
      return;
    }

    if (!drawState.isDrawing || !drawState.currentShape) return;

    let hasSize = false;
    if (drawState.currentShape.type === "rectangle") {
      hasSize = drawState.currentShape.width > 2 && drawState.currentShape.height > 2;
    } else if (drawState.currentShape.type === "ellipse") {
      hasSize = drawState.currentShape.radiusX > 1 && drawState.currentShape.radiusY > 1;
    } else if (drawState.currentShape.type === "line") {
      hasSize = drawState.currentShape.points.length >= 4;
    }

    if (hasSize) {
      addShape(drawState.currentShape);
    }

    setDrawState({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentShape: null,
    });
  }, [isPanning, marquee, shapes, stageRef, activeTool, drawState.isDrawing, drawState.currentShape, addShape, setSelectedIds, clearSelection]);

  return (
    <div ref={containerRef} className="flex-1 w-full bg-white relative">
      {activeTool === "fairway" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-lg bg-gray-900/90 px-5 py-3 text-sm text-white shadow-lg">
          Click to place fairway guide markers. Press <strong>ENTER</strong> to finish drawing.
        </div>
      )}
      {activeTool === "obline" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-lg bg-red-900/90 px-5 py-3 text-sm text-white shadow-lg">
          Click to place OB line points. Press <strong>ENTER</strong> to finish, <strong>ESC</strong> to cancel.
        </div>
      )}
      {activeTool === "stream" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-lg bg-blue-900/90 px-5 py-3 text-sm text-white shadow-lg">
          Click to place stream points. Press <strong>ENTER</strong> to finish, <strong>ESC</strong> to cancel.
        </div>
      )}
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleStageClick}
        onDblClick={handleStageDblClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <Layer>
          {/* Viewport background (pasteboard) */}
          <Rect
            name="background"
            x={-10000}
            y={-10000}
            width={20000}
            height={20000}
            fill="#374151"
            listening={true}
          />
          {/* Artboard shadow (separate rect so it doesn't affect compositing) */}
          <Rect
            x={0}
            y={0}
            width={ARTBOARD_WIDTH}
            height={ARTBOARD_HEIGHT}
            fill="transparent"
            shadowColor="#ffffff"
            shadowBlur={10}
            shadowOpacity={0.2}
            shadowOffsetX={2}
            shadowOffsetY={2}
            listening={false}
          />
          {/* Artboard background - opaque, no shadow, acts as compositing base */}
          <Rect
            x={0}
            y={0}
            width={ARTBOARD_WIDTH}
            height={ARTBOARD_HEIGHT}
            fill={backgroundColor}
            listening={true}
            name="artboard"
          />
          {/* Committed shapes */}
          {shapes.map((shape) => (
            <ShapeRenderer
              key={shape.id}
              shape={shape}
              isSelected={selectedIds.includes(shape.id)}
              onSelect={handleSelect}
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransformEnd}
              onDoubleClick={handleDoubleClick}
            />
          ))}
          {/* Shape currently being drawn */}
          {drawState.currentShape && (
            <DrawingPreview shape={drawState.currentShape} />
          )}
          {/* Marquee selection rectangle */}
          {marquee && (
            <Rect
              x={Math.min(marquee.startX, marquee.endX)}
              y={Math.min(marquee.startY, marquee.endY)}
              width={Math.abs(marquee.endX - marquee.startX)}
              height={Math.abs(marquee.endY - marquee.startY)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[6, 3]}
              listening={false}
            />
          )}
          {/* Fairway in-progress preview */}
          {activeTool === "fairway" && fairwayPoints.length >= 4 && (() => {
            const smoothed = smoothSpine(fairwayPoints);
            const geometry = generateFairwayGeometry(smoothed, 60);
            return (
              <Group opacity={0.6} listening={false}>
                <Line points={geometry.mid} closed fill="#7a9a3e" />
                <Line points={geometry.inner} closed fill="#a4c46a" />
              </Group>
            );
          })()}
          {/* Fairway spine point markers */}
          {activeTool === "fairway" && fairwayPoints.length >= 2 && (
            <Group listening={false}>
              <Line
                points={fairwayPoints}
                stroke="#ffffff"
                strokeWidth={1.5}
                dash={[4, 4]}
              />
              {Array.from({ length: fairwayPoints.length / 2 }, (_, i) => (
                <Ellipse
                  key={i}
                  x={fairwayPoints[i * 2]}
                  y={fairwayPoints[i * 2 + 1]}
                  radiusX={4}
                  radiusY={4}
                  fill="#ffffff"
                  stroke="#333333"
                  strokeWidth={1}
                />
              ))}
            </Group>
          )}
          {/* OB Line in-progress preview */}
          {activeTool === "obline" && oblinePoints.length >= 2 && (
            <Group listening={false}>
              <Line
                points={oblinePoints}
                stroke="#dc2626"
                strokeWidth={2.5}
                dash={[8, 6]}
                lineCap="round"
                lineJoin="round"
                opacity={0.7}
              />
              {Array.from({ length: oblinePoints.length / 2 }, (_, i) => (
                <Ellipse
                  key={i}
                  x={oblinePoints[i * 2]}
                  y={oblinePoints[i * 2 + 1]}
                  radiusX={4}
                  radiusY={4}
                  fill="#ffffff"
                  stroke="#dc2626"
                  strokeWidth={1}
                />
              ))}
            </Group>
          )}
          {/* Stream in-progress preview */}
          {activeTool === "stream" && streamPoints.length >= 2 && (() => {
            const smoothed = smoothSpine(streamPoints);
            return (
              <Group listening={false}>
                <Line
                  points={smoothed}
                  stroke="#1e40af"
                  strokeWidth={19}
                  lineCap="round"
                  lineJoin="round"
                  opacity={0.5}
                />
                <Line
                  points={smoothed}
                  stroke="#7dd3fc"
                  strokeWidth={16}
                  lineCap="round"
                  lineJoin="round"
                  opacity={0.5}
                />
                {Array.from({ length: streamPoints.length / 2 }, (_, i) => (
                  <Ellipse
                    key={i}
                    x={streamPoints[i * 2]}
                    y={streamPoints[i * 2 + 1]}
                    radiusX={4}
                    radiusY={4}
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth={1}
                  />
                ))}
              </Group>
            );
          })()}
        </Layer>
      </Stage>
    </div>
  );
}

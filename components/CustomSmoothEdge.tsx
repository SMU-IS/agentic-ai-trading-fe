import {
  getSmoothStepPath,
  EdgeProps,
  BaseEdge,
  EdgeLabelRenderer,
} from "@xyflow/react"

export function CustomSmoothEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  label,
  labelStyle,
  style,
}: EdgeProps) {
  // ← cast data here instead of in the type signature
  const edgeData = data as
    | { offset?: number; borderRadius?: number }
    | undefined

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: edgeData?.borderRadius ?? 5,
    offset: edgeData?.offset ?? 20,
  })

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              pointerEvents: "all",
              ...labelStyle,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

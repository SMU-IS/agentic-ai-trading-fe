"use client"

import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react"
import { GroupNode } from "@/components/labeled-group-node"
import { CustomSmoothEdge } from "@/components/CustomSmoothEdge"
import { MONITORED_NODE_IDS } from "@/hooks/use-health-check"
import { StatusCard } from "../bento/status-card"

import "@xyflow/react/dist/style.css"
import {
  Play,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  LoaderCircle,
  Code2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef, useMemo } from "react"
import { Toggle } from "@/components/ui/toggle"
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from "framer-motion"
import { initialNodes, initialEdges } from "./flow-data"
import { useNodeStatistics } from "./node-statistics"
import { useHealthCheck } from "@/hooks/use-health-check"
import { HealthDot } from "@/components/agentflow/HealthDot"
import { DevFilterPanel } from "@/components/agentflow/DevFilterPanel" // ← new import
import { StatusCardPipeline } from "../bento/status-card-pipeline"

const edgeTypes = {
  customSmooth: CustomSmoothEdge,
}

const AnimatedCounter = ({
  value,
  suffix = "",
}: {
  value: number // ← keep as non-nullable; null is handled by NodeStatistics above
  suffix?: string
}) => {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))

  useEffect(() => {
    const controls = animate(count, value, { duration: 1 })
    return () => controls.stop()
  }, [value, count])

  return (
    <span className="font-bold text-primary">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}

// Node Statistics Component
const NodeStatistics = ({ nodeId }: { nodeId: string }) => {
  const nodeStats = useNodeStatistics()
  const stats = nodeStats[nodeId] ?? []

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.8 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute -left-64 top-4 z-50 w-56 -translate-y-1/2"
      style={{ zIndex: 9999 }}
    >
      <Card className="z-10 border-2 border-primary/20 bg-card p-4 shadow-xl backdrop-blur-sm">
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.4 }}
              className="space-y-1"
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">
                {stat.value === null ? (
                  // ✅ Render a dash instead of passing null to AnimatedCounter
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                )}
              </p>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

const CustomNode = ({ data, id }: any) => {
  const [sourceStates, setSourceStates] = useState(
    data.sources?.reduce((acc: any, source: any, index: number) => {
      acc[index] = source.enabled ?? true
      return acc
    }, {}) || {},
  )

  const handleToggle = (index: number) => {
    setSourceStates((prev: any) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const displayLabel = data.isDeveloperMode
    ? data.label
    : data.humanized || data.label
  const displayDescription = data.isDeveloperMode
    ? data.description
    : data.humanizedDescription || data.description

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className={
          data.connectedHandles?.has(`${id}-left-target`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className={
          data.connectedHandles?.has(`${id}-left-source`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className={
          data.connectedHandles?.has(`${id}-right-target`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className={
          data.connectedHandles?.has(`${id}-right-source`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className={
          data.connectedHandles?.has(`${id}-top-target`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className={
          data.connectedHandles?.has(`${id}-top-source`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className={
          data.connectedHandles?.has(`${id}-bottom-target`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className={
          data.connectedHandles?.has(`${id}-bottom-source`) ? "" : "!opacity-0"
        }
      />

      <div
        className="relative min-w-[220px] space-y-3 rounded-xl border-2 border-border p-4 shadow-lg"
        style={{
          backgroundColor: data.customBg ?? "hsl(var(--card))",
          minHeight: data.customHeight ?? " ",
        }}
      >
        {MONITORED_NODE_IDS.has(id) && (
          <HealthDot status={data.healthStatus ?? "loading"} />
        )}
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center">
            {data.icon && <data.icon className="h-6 w-6" />}
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {displayLabel}
          </p>
          {displayDescription && !data.sources && (
            <p className="mt-1 text-xs text-muted-foreground">
              {displayDescription}
            </p>
          )}
        </div>
        {data.sources && data.sources.length > 0 && (
          <div className="nodrag space-y-2">
            {data.sources.map((source: any, index: number) => (
              <Card
                key={index}
                className={`flex items-center gap-2 border-border p-2 transition-colors hover:opacity-90 ${source.color || "bg-muted/50"}`}
              >
                <source.icon className={`h-4 w-4 ${source.textColor || ""}`} />
                <span className="flex-1 text-xs font-medium">
                  {source.name}
                </span>
                {source.hasToggle && (
                  <Toggle
                    pressed={sourceStates[index]}
                    onPressedChange={() => handleToggle(index)}
                    className="nodrag relative h-5 w-9 rounded-full p-0 transition-colors data-[state=on]:bg-primary data-[state=off]:bg-card"
                    size="sm"
                  >
                    <motion.div
                      className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-md"
                      animate={{ x: sourceStates[index] ? 16 : 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  </Toggle>
                )}
              </Card>
            ))}
          </div>
        )}
        {data.showStats && <NodeStatistics nodeId={id} />}
      </div>
    </>
  )
}

const PipelineNode = ({ data, id }: any) => {
  const displayLabel = data.isDeveloperMode
    ? data.label
    : data.humanized || data.label
  const displaySteps = data.isDeveloperMode
    ? data.steps
    : data.humanizedSteps || data.steps

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className={
          data.connectedHandles?.has(`${id}-left-target`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className={
          data.connectedHandles?.has(`${id}-left-source`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className={
          data.connectedHandles?.has(`${id}-right-target`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className={
          data.connectedHandles?.has(`${id}-right-source`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className={
          data.connectedHandles?.has(`${id}-top-target`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className={
          data.connectedHandles?.has(`${id}-top-source`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className={
          data.connectedHandles?.has(`${id}-bottom-target`) ? "" : "!opacity-0"
        }
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className={
          data.connectedHandles?.has(`${id}-bottom-source`) ? "" : "!opacity-0"
        }
      />
      <div
        className="relative flex flex-col gap-3 rounded-xl border-2 border-border p-4 shadow-lg"
        style={{ backgroundColor: data.customBg ?? "hsl(var(--card))" }}
      >
        <p className="text-center text-sm font-bold text-foreground">
          {displayLabel}
        </p>
        <div className="space-y-2 text-xs">
          {displaySteps.map((step: string, index: number) => (
            <div
              key={index}
              className="rounded bg-muted px-3 py-1 text-foreground"
            >
              {step}
            </div>
          ))}
        </div>
        {data.showStats && <NodeStatistics nodeId={id} />}
      </div>
    </>
  )
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  pipeline: PipelineNode,
  labeledGroupNode: ({ data, id }: any) => (
    <GroupNode id={id} label={data.label} />
  ),
}

function AgentFlowContent({
  showStatusCard = true,
}: {
  showStatusCard?: boolean
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [isDeveloperMode, setIsDeveloperMode] = useState(false)
  const [isShimmering, setIsShimmering] = useState(false)
  const originalEdgesRef = useRef(initialEdges)

  const { setViewport, fitView } = useReactFlow()
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const tourCancelledRef = useRef(false)
  const { statuses: healthStatuses, secondsUntilRefresh } =
    useHealthCheck(30000)

  const nodeSequence = ["1", "2", "3", "4", "13", "16"]
  const tourSequence = nodeSequence.map((nodeId) => ({
    nodeId,
    duration: 2000,
  }))

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isDeveloperMode,
          healthStatus: healthStatuses[n.id] ?? "loading",
        },
      })),
    )
    setIsShimmering(true)
    const timer = setTimeout(() => setIsShimmering(false), 800)
    return () => clearTimeout(timer)
  }, [isDeveloperMode, setNodes, healthStatuses])

  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge: any, index: number) => {
        const originalEdge: any = originalEdgesRef.current[index]
        return {
          ...edge,
          data: originalEdge.data,
          label: isDeveloperMode
            ? originalEdge.label
            : originalEdge.humanizedLabel || originalEdge.label,
        }
      }),
    )
  }, [isDeveloperMode, setEdges])

  const connectedHandles = useMemo(
    () =>
      new Set(
        edges.flatMap((e) => [
          `${e.source}-${e.sourceHandle}`,
          `${e.target}-${e.targetHandle}`,
        ]),
      ),
    [edges],
  )

  const getAbsolutePosition = (nodeId: string): { x: number; y: number } => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }

    if (node.parentId) {
      const parentPos = getAbsolutePosition(node.parentId)
      return {
        x: node.position.x + parentPos.x,
        y: node.position.y + parentPos.y,
      }
    }

    return { x: node.position.x, y: node.position.y }
  }

  const focusOnNode = (nodeId: string) => {
    const { x: absoluteX, y: absoluteY } = getAbsolutePosition(nodeId) // ✅

    setActiveNodeId(nodeId)
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, showStats: n.id === nodeId },
      })),
    )

    const zoom = 1
    const x = window.innerWidth / 2 - absoluteX * zoom - 110
    const y = (window.innerHeight * 0.7) / 2 - absoluteY * zoom - 150
    setViewport({ x, y, zoom }, { duration: 800 })
  }

  const handleNodeClick = (event: React.MouseEvent, node: any) => {
    if (isPlaying) return
    const clickedIndex = nodeSequence.findIndex((id) => id === node.id)
    if (clickedIndex !== -1) {
      setCurrentStepIndex(clickedIndex)
      focusOnNode(node.id)
    }
  }

  const goForward = () => {
    if (currentStepIndex < nodeSequence.length - 1) {
      const nextIndex = currentStepIndex + 1
      setCurrentStepIndex(nextIndex)
      focusOnNode(nodeSequence[nextIndex])
    }
  }

  const goBackward = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1
      setCurrentStepIndex(prevIndex)
      focusOnNode(nodeSequence[prevIndex])
    } else if (currentStepIndex === 0) {
      setCurrentStepIndex(-1)
      setActiveNodeId(null)
      setNodes((nds) =>
        nds.map((n) => ({ ...n, data: { ...n.data, showStats: false } })),
      )
      fitView({ duration: 800, padding: 0.2 })
    }
  }

  const handleRefresh = () => {
    tourCancelledRef.current = true
    setIsPlaying(false)
    setActiveNodeId(null)
    setCurrentStepIndex(-1)
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, showStats: false } })),
    )
    fitView({ duration: 800, padding: 0.2 })
  }

  const playTour = async () => {
    setIsPlaying(true)
    setCurrentStepIndex(-1)
    tourCancelledRef.current = false

    for (const step of tourSequence) {
      if (tourCancelledRef.current) break
      const node = nodes.find((n) => n.id === step.nodeId)
      if (node) {
        focusOnNode(step.nodeId) // ✅ now uses absolute position + shared logic
        await new Promise((resolve) => setTimeout(resolve, step.duration))
      }
    }

    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, showStats: false } })),
    )

    if (!tourCancelledRef.current) {
      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 })
        setActiveNodeId(null)
        setIsPlaying(false)
      }, 500)
    } else {
      setIsPlaying(false)
    }
  }

  const stopTour = () => {
    tourCancelledRef.current = true
    setIsPlaying(false)
    setActiveNodeId(null)
    setCurrentStepIndex(-1)
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, showStats: false } })),
    )
    fitView({ duration: 800, padding: 0.2 })
  }

  const highlightedNodes = nodes.map((node) => ({
    ...node,
    data: { ...node.data, connectedHandles },
    style: {
      ...node.style,
      opacity: activeNodeId ? (node.id === activeNodeId ? 1 : 0.3) : 1,
      transition: "opacity 0.3s ease",
      zIndex: node.id === activeNodeId ? 1000 : (node.zIndex ?? 1),
      x: node.position.x,
    },
  }))

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Title + description — full width on mobile, left side on desktop */}
        <div className="flex flex-col">
          <h1 className="text-xl text-foreground italic mb-2">
            <span className="font-geist font-thin">Agent</span>Flow
          </h1>
          <p className="text-sm text-muted-foreground">
            See your agents' performance in real-time. Click on nodes to view
            stats, or use the tour to explore key components.
          </p>
        </div>

        {/* Buttons — full width row on mobile, right side on desktop */}
        <div className="flex items-end   gap-2 flex-end">
          <Button
            onClick={handleRefresh}
            className="rounded-full border border-foreground/25 bg-card text-foreground hover:bg-primary/5"
            size="icon"
            title="Reset to original view"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            onClick={goBackward}
            disabled={currentStepIndex < 0 || isPlaying}
            className="rounded-full border border-foreground/25 bg-card text-foreground hover:bg-primary/5"
            size="icon"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={goForward}
            disabled={currentStepIndex >= nodeSequence.length - 1 || isPlaying}
            size="icon"
            className="rounded-full border border-foreground/25 bg-card text-foreground hover:bg-primary/5"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <motion.div whileHover={{ scale: 1.0 }}>
            <Button
              onClick={isPlaying ? stopTour : playTour}
              className="relative overflow-hidden rounded-full border border-foreground/25 bg-transparent p-0 hover:bg-primary/10"
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  backgroundColor: isPlaying
                    ? "hsl(var(--primary) / 0.1)"
                    : "hsl(var(--card))",
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
              <motion.div
                className="relative flex items-center gap-2 px-4 py-2"
                animate={{
                  color: isPlaying
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--primary))",
                }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence mode="wait">
                  {isPlaying ? (
                    <motion.div
                      key="playing"
                      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-2 text-xs"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <LoaderCircle className="h-4 w-4" />
                      </motion.div>
                      Stop Playing
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-2 text-xs"
                    >
                      <motion.div
                        animate={{ rotate: 0 }}
                        whileHover={{ rotate: 90, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Play className="h-4 w-4" />
                      </motion.div>
                      Play Metrics(10s)
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>

      <motion.div className="relative">
        <Card
          className="border-foreground/10 bg-card/50 backdrop-blur-sm relative overflow-hidden"
          style={{ height: "70vh" }}
        >
          {isShimmering && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none z-[999]"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          )}

          {/* Dev Mode Toggle */}
          {showStatusCard && (
            <Toggle
              pressed={isDeveloperMode}
              onPressedChange={setIsDeveloperMode}
              className="absolute right-4 top-4 z-[1000] flex items-center gap-2 rounded-full border border-foreground/25 bg-card px-3 py-2 shadow-lg data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
            >
              <Code2 className="h-3 w-3" />
              <span className="text-xs font-medium">Agent Settings</span>
            </Toggle>
          )}

          {/* Health Legend + Countdown */}
          <Card className="w-28 absolute right-4 top-20 z-[1000] rounded-xl border border-foreground/25 bg-card/80 px-3 py-2 shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <HealthDot status="healthy" variant="inline" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <HealthDot status="unhealthy" variant="inline" />
                <span className="text-xs text-muted-foreground">Error</span>
              </div>
              <div className="border-t border-border" />
              <span className="inline-block w-26 text-xs text-muted-foreground text-center">
                Refresh in{" "}
                <span className="font-semibold text-foreground">
                  {secondsUntilRefresh}s
                </span>
              </span>
            </div>
          </Card>

          {/* ← DevFilterPanel: separate component, shown only in dev mode */}
          <AnimatePresence>
            {isDeveloperMode && <DevFilterPanel />}
          </AnimatePresence>

          <ReactFlow
            nodes={highlightedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            nodesDraggable={false}
            fitView
            edgeTypes={edgeTypes}
            attributionPosition="bottom-left"
            defaultViewport={{ x: 200, y: -100, zoom: 0.75 }}
            minZoom={0.3}
            maxZoom={2}
          >
            <Controls
              position="top-left"
              showInteractive={false}
              style={{
                backgroundColor: "hsl(var(--foreground))",
                borderRadius: "8px",
              }}
              className="[&>button]:border-border [&>button]:bg-card [&>button]:text-foreground [&>button:hover]:bg-muted"
            />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              nodeColor="hsl(var(--muted))"
              style={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              maskColor="hsl(var(--muted) / 0.2)"
            />
            <Background gap={16} size={1} />
          </ReactFlow>
        </Card>
      </motion.div>
      {showStatusCard && (
        <motion.div className="flex flex-col gap-4 sm:flex-row">
          <Card className="border-foreground/10 bg-card/50 backdrop-blur-sm relative overflow-hidden p-8 w-full sm:w-1/2">
            <StatusCardPipeline />
          </Card>
          <Card className="border-foreground/10 bg-card/50 backdrop-blur-sm relative overflow-hidden p-8 w-full sm:w-1/2">
            <StatusCard />
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export default function AgentFlowTab({
  showStatusCard = true,
}: {
  showStatusCard?: boolean
}) {
  return (
    <ReactFlowProvider>
      <AgentFlowContent showStatusCard={showStatusCard} />
    </ReactFlowProvider>
  )
}

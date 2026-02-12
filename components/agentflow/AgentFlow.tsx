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
import "@xyflow/react/dist/style.css"
import {
  Database,
  Newspaper,
  Brain,
  Bot,
  Bell,
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  LoaderCircle,
  Code2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaDiscord, FaReddit } from "react-icons/fa"
import { useState, useEffect, useRef } from "react"
import { Toggle } from "@/components/ui/toggle"
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from "framer-motion"
import { initialNodes, initialEdges } from "./flow-data"
import { nodeStatistics } from "./node-statistics"

// Animated Counter Component
const AnimatedCounter = ({
  value,
  suffix = "",
}: {
  value: number
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
  const stats = nodeStatistics[nodeId] || []

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.8 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute -left-64 top-1/2 z-50 w-56 -translate-y-1/2"
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
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
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

  // Determine which label and description to show
  const displayLabel = data.isDeveloperMode
    ? data.label
    : data.humanized || data.label

  const displayDescription = data.isDeveloperMode
    ? data.description
    : data.humanizedDescription || data.description

  return (
    <>
      {/* Handles */}
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="source" position={Position.Left} id="left-source" />
      <Handle type="target" position={Position.Right} id="right-target" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Top} id="top-source" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />

      <div className="relative min-w-[220px] space-y-3 rounded-xl border-2 border-border bg-card p-4 shadow-lg">
        {/* Main Icon */}
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center">
            {data.icon && <data.icon className="h-6 w-6" />}
          </div>
        </div>

        {/* Title */}
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

        {/* Source Cards - Only show if sources exist */}
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

                {/* Toggle - Only show if hasToggle is true */}
                {source.hasToggle && (
                  <Toggle
                    pressed={sourceStates[index]}
                    onPressedChange={() => handleToggle(index)}
                    className="nodrag relative h-5 w-9 rounded-full p-0 transition-colors data-[state=on]:bg-primary data-[state=off]:bg-card"
                    size="sm"
                  >
                    <motion.div
                      className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full border border-foreground/40 bg-card shadow-sm"
                      animate={{
                        x: sourceStates[index] ? 16 : 0,
                      }}
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

        {/* Statistics - Show when node is active */}
        {data.showStats && <NodeStatistics nodeId={id} />}
      </div>
    </>
  )
}

// Pipeline Node Component
const PipelineNode = ({ data, id }: any) => {
  // Determine which label and steps to show
  const displayLabel = data.isDeveloperMode
    ? data.label
    : data.humanized || data.label

  const displaySteps = data.isDeveloperMode
    ? data.steps
    : data.humanizedSteps || data.steps

  return (
    <>
      {/* LEFT - both target and source */}
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="source" position={Position.Left} id="left-source" />

      {/* RIGHT - both target and source */}
      <Handle type="target" position={Position.Right} id="right-target" />
      <Handle type="source" position={Position.Right} id="right-source" />

      {/* TOP - both target and source */}
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Top} id="top-source" />

      {/* BOTTOM - both target and source */}
      <Handle type="target" position={Position.Bottom} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />

      <div className="relative flex flex-col gap-3 rounded-xl border-2 border-border bg-card p-4 shadow-lg">
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

        {/* Statistics - Show when node is active */}
        {data.showStats && <NodeStatistics nodeId={id} />}
      </div>
    </>
  )
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  pipeline: PipelineNode,
}

function AgentFlowContent() {
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

  const nodeSequence = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

  const tourSequence = [
    { nodeId: "1", duration: 1500 },
    { nodeId: "2", duration: 1500 },
    { nodeId: "3", duration: 1500 },
    { nodeId: "4", duration: 1500 },
    { nodeId: "5", duration: 1500 },
    { nodeId: "6", duration: 1500 },
    { nodeId: "7", duration: 1500 },
    { nodeId: "8", duration: 1500 },
    { nodeId: "9", duration: 1500 },
    { nodeId: "10", duration: 1500 },
  ]

  // Update nodes when developer mode changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isDeveloperMode,
        },
      })),
    )

    // Trigger shimmer effect
    setIsShimmering(true)
    const timer = setTimeout(() => {
      setIsShimmering(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [isDeveloperMode, setNodes])

  // Update edges when developer mode changes
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge: any, index: number) => {
        const originalEdge: any = originalEdgesRef.current[index]
        return {
          ...edge,
          label: isDeveloperMode
            ? originalEdge.label
            : originalEdge.humanizedLabel || originalEdge.label,
        }
      }),
    )
  }, [isDeveloperMode, setEdges])

  const focusOnNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (node) {
      setActiveNodeId(nodeId)

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            showStats: n.id === nodeId,
          },
        })),
      )

      const zoom = 1
      const x = window.innerWidth / 2 - node.position.x * zoom - 110
      const y = (window.innerHeight * 0.7) / 2 - node.position.y * zoom - 150

      setViewport({ x, y, zoom }, { duration: 800 })
    }
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
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            showStats: false,
          },
        })),
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
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          showStats: false,
        },
      })),
    )

    fitView({ duration: 800, padding: 0.2 })
  }

  const playTour = async () => {
    setIsPlaying(true)
    setCurrentStepIndex(-1)
    tourCancelledRef.current = false

    for (const step of tourSequence) {
      if (tourCancelledRef.current) {
        break
      }

      const node = nodes.find((n) => n.id === step.nodeId)
      if (node) {
        setActiveNodeId(step.nodeId)

        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              showStats: n.id === step.nodeId,
            },
          })),
        )

        const zoom = 1
        const x = window.innerWidth / 2 - node.position.x * zoom - 110
        const y = (window.innerHeight * 0.7) / 2 - node.position.y * zoom - 150

        setViewport({ x, y, zoom }, { duration: 800 })
        await new Promise((resolve) => setTimeout(resolve, step.duration))
      }
    }

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          showStats: false,
        },
      })),
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
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          showStats: false,
        },
      })),
    )
    fitView({ duration: 800, padding: 0.2 })
  }

  const highlightedNodes = nodes.map((node) => ({
    ...node,
    style: {
      ...node.style,
      opacity: activeNodeId ? (node.id === activeNodeId ? 1 : 0.3) : 1,
      transition: "opacity 0.3s ease",
      zIndex: node.id === activeNodeId ? 1000 : 1,
    },
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl text-foreground italic mb-2">
            <span className="font-geist font-thin">Agent</span>Flow
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete overview of the agentic workflow
          </p>
        </div>

        {/* Navigation and Tour Buttons */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            className="rounded-full border border-foreground/25 bg-card text-foreground hover:bg-primary/5"
            size="icon"
            title="Reset to original view"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Backward Button */}
          <Button
            onClick={goBackward}
            disabled={currentStepIndex < 0 || isPlaying}
            className="rounded-full border border-foreground/25 bg-card text-foreground hover:bg-primary/5"
            size="icon"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Forward Button */}
          <Button
            onClick={goForward}
            disabled={currentStepIndex >= nodeSequence.length - 1 || isPlaying}
            size="icon"
            className="rounded-full border border-foreground/25 bg-card text-foreground hover:bg-primary/5"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Play Tour Button */}
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
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
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
                      className="flex items-center gap-2"
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
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 0 }}
                        whileHover={{ rotate: 90, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Play className="h-4 w-4" />
                      </motion.div>
                      Play Tour (15s)
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
          {/* Shimmer effect on the entire card */}
          {isShimmering && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none z-[999]"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
              }}
            />
          )}

          {/* Developer Mode Toggle */}
          <Toggle
            pressed={isDeveloperMode}
            onPressedChange={setIsDeveloperMode}
            className="absolute right-4 top-4 z-[1000] flex items-center gap-2 rounded-full border border-foreground/25 bg-card px-3 py-2 shadow-lg data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
          >
            <Code2 className="h-3 w-3" />
            <span className="text-xs font-medium">Dev Mode</span>
          </Toggle>

          <ReactFlow
            nodes={highlightedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            nodesDraggable={false}
            fitView
            attributionPosition="bottom-left"
            defaultViewport={{
              x: 200,
              y: -100,
              zoom: 0.75,
            }}
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
    </div>
  )
}

export default function AgentFlowTab() {
  return (
    <ReactFlowProvider>
      <AgentFlowContent />
    </ReactFlowProvider>
  )
}

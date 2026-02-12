import { Node, Edge, MarkerType } from "@xyflow/react"
import { Database, Newspaper, Brain, Bot, Bell } from "lucide-react"
import { FaDiscord, FaReddit } from "react-icons/fa"
import { DiDatabase, DiRedis } from "react-icons/di"
import { SiLangchain, SiKong } from "react-icons/si"

interface CustomEdge extends Edge {
  humanizedLabel?: string
}

export const initialNodes: Node[] = [
  //   News Data Sources
  {
    id: "1",
    type: "custom",
    data: {
      label: "News Data Source",
      humanized: "News Sources",
      icon: Database,
      sources: [
        {
          name: "Reddit",
          icon: FaReddit,
          color: "bg-[#FF5700]/20",
          textColor: "text-orange-500",
          hasToggle: true,
          enabled: true,
        },
        {
          name: "Discord",
          icon: FaDiscord,
          color: "bg-purple-400/20",
          textColor: "text-purple-500",
          hasToggle: true,
          enabled: false,
        },
      ],
    },
    position: { x: 50, y: 0 },
  },
  //   Scraper Service
  {
    id: "2",
    type: "custom",
    data: {
      label: "Scraper Service",
      humanized: "News Collector",
      description: "Runs periodically",
      humanizedDescription: "Reading News",
      icon: Newspaper,
      variant: "process",
    },
    position: { x: 50, y: 250 },
  },
  //  Raw News Stream
  {
    id: "3",
    type: "custom",
    data: {
      label: "Raw News Stream",
      humanized: "Live News Feed",
      description: "Redis",
      icon: Database,
      variant: "stream",
      sources: [
        {
          name: "Redis",
          icon: DiRedis,
          color: "bg-muted",
          textColor: "text-red-600",
          hasToggle: false,
        },
      ],
    },
    position: { x: 50, y: 450 },
  },
  //  News Analysis Pipeline
  {
    id: "4",
    type: "pipeline",
    data: {
      label: "News Analysis Service",
      humanized: "Smart News Analyzer",
      steps: [
        "1. Preprocessor Service",
        "2. Ticker Identification Service",
        "3. Event Identification Service",
        "4. Sentiment & Relevance Engine",
        "5. Vectoriser + Embedding Generator",
      ],
      humanizedSteps: [
        "1. News Clean Up",
        "2. Stock/Ticker Detector",
        "3. Topic Identifier",
        "4. Sentiment & Relevance checker",
        "5. Smart Indexing",
      ],
    },
    position: { x: 400, y: 250 },
  },
  //  Vector Database
  {
    id: "5",
    type: "custom",
    data: {
      label: "Vector Database",
      humanized: "AI Database",
      description: "Qdrant",
      icon: Database,
      variant: "primary",
      sources: [
        {
          name: "Qdrant",
          icon: DiDatabase,
          color: "bg-muted",
          textColor: "text-pink-600",
          hasToggle: false,
        },
      ],
    },
    position: { x: 425, y: 600 },
  },
  // RAG AI
  {
    id: "6",
    type: "custom",
    data: {
      label: "RAG AI (LangChain)",
      humanized: "AI Engine",
      description: "Convert queries into vector embeddings",
      humanizedDescription: "Finds the right context for your questions",
      icon: Brain,
      variant: "primary",
      sources: [
        {
          name: "LangChain",
          icon: SiLangchain,
          color: "bg-muted",
          textColor: "text-teal-600",
          hasToggle: false,
        },
      ],
    },
    position: { x: 100, y: 750 },
  },
  // Chatbot Module
  {
    id: "7",
    type: "custom",
    data: {
      label: "Chatbot Module (LangChain)",
      humanized: "Chat Assistant",
      description: "Handle queries, explains and summarises news",
      humanizedDescription: "Answers your questions and explains news",
      icon: Bot,
      variant: "primary",
      sources: [
        {
          name: "LangChain",
          icon: SiLangchain,
          color: "bg-muted",
          textColor: "text-teal-600",
          hasToggle: false,
        },
      ],
    },
    position: { x: 400, y: 900 },
  },
  // Trading Agent Module
  {
    id: "8",
    type: "custom",
    data: {
      label: "Trading Agent Module (LangGraph)",
      humanized: "Trading Engine",
      description: "Periodically queries RAG, makes decisions, executes trades",
      humanizedDescription:
        "Analyzes news, makes decisions, and executes trades",
      icon: Bot,
      variant: "primary",
      sources: [
        {
          name: "LangGraph",
          icon: SiLangchain,
          color: "bg-muted",
          textColor: "text-green-600",
          hasToggle: false,
        },
      ],
    },
    position: { x: 400, y: 1100 },
  },
  // News Aggregator Service
  {
    id: "9",
    type: "pipeline",
    data: {
      label: "News Aggregator Service",
      humanized: "News Intelligent Compiler",
      steps: [
        "1. Topic Tracker",
        "2. Threshold Monitor",
        "3. Deep analysis",
        "4. Decision engine",
      ],
      humanizedSteps: [
        "1. Topic Tracker",
        "2. Threshold Monitor",
        "3. Deep analysis",
        "4. Decision engine",
      ],
    },
    position: { x: 900, y: 800 },
  },
  // News Notification Stream
  {
    id: "10",
    type: "custom",
    data: {
      label: "News Notification Stream",
      humanized: "Notifications",
      description: "Redis",
      icon: Bell,
      variant: "stream",
      sources: [
        {
          name: "Redis",
          icon: DiRedis,
          color: "bg-muted",
          textColor: "text-red-600",
          hasToggle: false,
        },
      ],
    },
    position: { x: 900, y: 285 },
  },
]

export const initialEdges: CustomEdge[] = [
  // Data Sources to Scraper
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "smoothstep",
    label: "24/7 News Watcher",
    humanizedLabel: "Always watching for news",
    sourceHandle: "bottom-source",
    targetHandle: "top-target",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
      color: "hsl(var(--primary))",
    },
    animated: true,
    labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11 },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.1 },
  },
  // Scraper to Raw News Stream
  {
    id: "e2-3",
    source: "2",
    target: "3",
    type: "smoothstep",
    label: "Publish jobs to queue",
    humanizedLabel: "Sends news for processing",
    animated: true,
    sourceHandle: "bottom-source",
    targetHandle: "top-target",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
      color: "hsl(var(--primary))",
    },
    labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11 },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.1 },
  },
  // Raw News Stream to News Analysis Pipeline
  {
    id: "e3-4",
    source: "3",
    target: "4",
    type: "smoothstep",
    label: "Consumes",
    humanizedLabel: "Picks up news",
    animated: true,
    sourceHandle: "right-source",
    targetHandle: "left-target",
    markerStart: {
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
      color: "hsl(var(--primary))",
    },
    labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11 },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.1 },
  },
  // News Analysis to Vector DB
  {
    id: "e4-5",
    source: "4",
    target: "5",
    type: "smoothstep",
    sourceHandle: "bottom-source",
    targetHandle: "top-target",
    label: "Stores News",
    humanizedLabel: "Saves to memory",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
      color: "hsl(var(--primary))",
    },
    labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11 },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.1 },
  },
  // Vector DB to RAG AI
  {
    id: "e5-6",
    source: "5",
    target: "6",
    type: "smoothstep",
    label: "Retrieves Relevant News",
    humanizedLabel: "Fetches relevant stories",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
      color: "hsl(var(--primary))",
    },
    labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11 },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.1 },
  },
  // RAG AI to Chatbot
  {
    id: "e6-7",
    source: "6",
    target: "7",
    type: "smoothstep",
    label: "Provides Context",
    humanizedLabel: "Gives background info",
    sourceHandle: "bottom-source",
    targetHandle: "left-target",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
      color: "hsl(var(--primary))",
    },
    labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11 },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.1 },
  },
  // RAG AI to Trading Agent
  {
    id: "e6-8",
    source: "6",
    target: "8",
    type: "smoothstep",
    label: "Provides Context",
    humanizedLabel: "Shares market insights",
    sourceHandle: "bottom-source",
    targetHandle: "left-target",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
      color: "hsl(var(--primary))",
    },
    labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11 },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.1 },
  },
  // News Analysis to News Notification Stream
  {
    id: "e4-10",
    source: "4",
    target: "10",
    type: "smoothstep",
    label: "Trigger Incoming News",
    humanizedLabel: "Signals new news",
    animated: false,
    sourceHandle: "right-source",
    targetHandle: "left-target",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
      color: "hsl(var(--primary))",
    },
    labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11 },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.1 },
  },
  // News Aggregator to News Notification Stream
  {
    id: "e9-10",
    source: "9",
    target: "10",
    type: "smoothstep",
    label: "Consumes",
    humanizedLabel: "Reads alerts",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
      color: "hsl(var(--primary))",
    },
    sourceHandle: "top-source",
    targetHandle: "bottom-target",
    labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11 },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.1 },
  },
  // News Aggregator to Trading Agent
  {
    id: "e9-8",
    source: "9",
    target: "8",
    type: "smoothstep",
    label: "Calls",
    humanizedLabel: "Triggers",
    sourceHandle: "right-source",
    targetHandle: "right-target",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
      color: "hsl(var(--primary))",
    },
    labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11 },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.1 },
  },
]

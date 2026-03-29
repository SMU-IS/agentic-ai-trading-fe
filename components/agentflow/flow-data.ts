import { Node, Edge, MarkerType } from "@xyflow/react"
import {
  Database,
  Newspaper,
  Brain,
  Bot,
  Bell,
  User,
  ChartCandlestick,
} from "lucide-react"
import { FaDiscord, FaReddit } from "react-icons/fa"
import { DiDatabase, DiRedis } from "react-icons/di"
import {
  SiLangchain,
  SiKong,
  SiOllama,
  SiTradingview,
  SiRedis,
} from "react-icons/si"

interface CustomEdge extends Edge {
  humanizedLabel?: string
  data?: {
    offset?: number
    borderRadius?: number
  }
}

export const initialNodes: Node[] = [
  // The group container node
  {
    id: "group-lower-backend",
    type: "labeledGroupNode",
    position: { x: 0, y: 0 },
    data: { label: "Backend Services" },
    width: 1600,
    height: 1400,
    zIndex: -1, // ← add this
  },
  // The other group container node
  {
    id: "group-backend",
    type: "labeledGroupNode",
    position: { x: 1800, y: 0 },
    data: { label: "Main Services" },
    width: 330,
    height: 1100,
  },

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
          hasToggle: false,
          enabled: true,
        },
        {
          name: "TradingView",
          icon: SiTradingview,
          color: "bg-blue-400/20",
          textColor: "text-blue-500",
          hasToggle: false,
          enabled: false,
        },
      ],
    },
    position: { x: 50, y: 70 },
    parentId: "group-lower-backend",
    extent: "parent",
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
    position: { x: 50, y: 320 },
    parentId: "group-lower-backend",
    extent: "parent",
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
    position: { x: 50, y: 520 },
    parentId: "group-lower-backend",
    extent: "parent",
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
    position: { x: 400, y: 320 },
    parentId: "group-lower-backend",
    extent: "parent",
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
    position: { x: 425, y: 670 },
    parentId: "group-lower-backend",
    extent: "parent",
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
    position: { x: 100, y: 820 },
    parentId: "group-lower-backend",
    extent: "parent",
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
    position: { x: 400, y: 970 },
    parentId: "group-lower-backend",
    extent: "parent",
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
    position: { x: 400, y: 1170 },
    parentId: "group-lower-backend",
    extent: "parent",
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
    position: { x: 1150, y: 415 },
    parentId: "group-lower-backend",
    extent: "parent",
  },
  // News Aggregator Stream
  {
    id: "10",
    type: "custom",
    data: {
      label: "News Aggregator Stream",
      humanized: "News Aggregator",
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
    position: { x: 800, y: 430 },
    parentId: "group-lower-backend",
    extent: "parent",
  },
  // News Notifications Stream
  {
    id: "11",
    type: "custom",
    data: {
      label: "News Notifications Stream",
      humanized: "News Notifications",
      description: "Redis",
      icon: Newspaper,
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
    position: { x: 800, y: 230 },
    parentId: "group-lower-backend",
    extent: "parent",
  },
  //  Aggregator Analysis Stream
  {
    id: "12",
    type: "custom",
    data: {
      label: "Aggregator Analysis Stream",
      humanized: "Aggregator Analysis Stream",
      description: "Redis",
      icon: Newspaper,
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
    position: { x: 950, y: 820 },
    parentId: "group-lower-backend",
    extent: "parent",
  },
  // Trading Signal Stream
  {
    id: "13",
    type: "custom",
    data: {
      label: "Trading Signal Stream",
      humanized: "Trading Signal Stream",
      description: "Redis",
      icon: Newspaper,
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
    position: { x: 1350, y: 820 },
    parentId: "group-lower-backend",
    extent: "parent",
  },

  // Node 1
  {
    id: "14",
    type: "custom",
    data: {
      label: "Chatbot Service",
      humanized: "Chatbot",
      description: "Ollama",
      icon: Bot,
      variant: "stream",
      sources: [
        {
          name: "Ollama",
          icon: SiOllama,
          color: "bg-muted",
          textColor: "text-orange-600",
          hasToggle: false,
        },
      ],
    },
    position: { x: 50, y: 60 }, // ← relative to parent, not absolute
    parentId: "group-backend",
    extent: "parent",
  },

  // Node 2
  {
    id: "15",
    type: "custom",
    data: {
      label: "Trading Agent Service",
      humanized: "Automatic Trading System",
      description: "Ollama",
      icon: Newspaper,
      variant: "stream",
      sources: [
        {
          name: "Ollama",
          icon: SiOllama,
          color: "bg-muted",
          textColor: "text-orange-600",
          hasToggle: false,
        },
        // {
        //   name: "Redis",
        //   icon: SiRedis,
        //   color: "bg-muted",
        //   textColor: "text-red-600",
        //   hasToggle: false,
        // },
      ],
    },
    position: { x: 50, y: 260 }, // ← relative to parent, not absolute
    parentId: "group-backend",
    extent: "parent",
  },
  // Node 3
  {
    id: "16",
    type: "custom",
    data: {
      label: "Trading Service (Brokerage)",
      humanized: "Trading Brokerage",
      description: "Alpaca",
      icon: ChartCandlestick,
      variant: "stream",
      sources: [
        {
          name: "Alpaca",
          icon: SiTradingview,
          color: "bg-muted",
          textColor: "text-yellow-600",
          hasToggle: false,
        },
      ],
    },
    position: { x: 50, y: 460 }, // ← relative to parent, not absolute
    parentId: "group-backend",
    extent: "parent",
  },
  // Node 4
  {
    id: "17",
    type: "custom",
    data: {
      label: "Notifications Service",
      humanized: "Notifications",
      description: "Notifications",
      icon: Bell,
      variant: "stream",
      sources: [
        {
          name: "Redis",
          icon: SiRedis,
          color: "bg-muted",
          textColor: "text-red-600",
          hasToggle: false,
        },
      ],
    },
    position: { x: 50, y: 660 }, // ← relative to parent, not absolute
    parentId: "group-backend",
    extent: "parent",
  },
  // Node 5
  {
    id: "18",
    type: "custom",
    data: {
      label: "User Service",
      humanized: "User Account",
      description: "User",
      icon: User,
      variant: "stream",
    },
    position: { x: 50, y: 860 }, // ← relative to parent, not absolute
    parentId: "group-backend",
    extent: "parent",
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
    label: "Publish",
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
  // News Analysis to News Aggregator Stream
  {
    id: "e4-11",
    source: "4",
    target: "11",
    type: "smoothstep",
    label: "Publish",
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
  // News Aggregator to News Aggregator Stream
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
    sourceHandle: "left-source",
    targetHandle: "right-target",
    labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11 },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.1 },
  },
  // News Aggregator to Aggregator Analysis Stream
  {
    id: "e9-12",
    source: "9",
    target: "12",
    type: "smoothstep",
    label: "Calls",
    humanizedLabel: "Triggers",
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
  // News Aggregator to trading signal Stream
  {
    id: "e9-13",
    source: "9",
    target: "13",
    type: "smoothstep",
    label: "Calls",
    humanizedLabel: "Triggers",
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
  // Trading Agent module to trading signal Stream
  {
    id: "e8-13",
    source: "13",
    target: "8",
    type: "smoothstep",
    label: "Listens for trades",
    humanizedLabel: "Waits for trades",
    sourceHandle: "bottom-source",
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
  // group connection
  {
    id: "group-group-to-something",
    source: "group-lower-backend",
    target: "group-backend",
    type: "customSmooth",
    // data: { offset: 650 }, // ← moved here
    sourceHandle: "right-source",
    targetHandle: "left-target",
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
]

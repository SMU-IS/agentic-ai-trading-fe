"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Bookmark, Copy, MessageSquare, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function MarkdownStreamingContent({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(content);
      setCurrentIndex(content.length);
      return;
    }

    if (currentIndex > content.length) {
      setCurrentIndex(0);
      setDisplayedText("");
    }

    const speed = 20;

    const animate = (timestamp: number) => {
      if (lastUpdateRef.current === 0) {
        lastUpdateRef.current = timestamp;
      }

      const elapsed = timestamp - lastUpdateRef.current;

      if (elapsed >= speed && currentIndex < content.length) {
        const nextIndex = Math.min(currentIndex + 1, content.length);
        setDisplayedText(content.slice(0, nextIndex));
        setCurrentIndex(nextIndex);
        lastUpdateRef.current = timestamp;
      }

      if (currentIndex < content.length) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [content, currentIndex, isStreaming]);

  const parseMarkdown = (text: string) => {
    const parts: JSX.Element[] = [];
    let buffer = "";
    let i = 0;

    while (i < text.length) {
      if (text[i] === "*" && text[i + 1] === "*") {
        if (buffer) {
          parts.push(<span key={`text-${parts.length}`}>{buffer}</span>);
          buffer = "";
        }

        let j = i + 2;
        let boldText = "";
        let foundClosing = false;

        while (j < text.length - 1) {
          if (text[j] === "*" && text[j + 1] === "*") {
            boldText = text.slice(i + 2, j);
            foundClosing = true;
            j += 2;
            break;
          }
          j++;
        }

        if (foundClosing) {
          parts.push(
            <strong key={`bold-${parts.length}`} className="font-semibold">
              {boldText}
            </strong>,
          );
          i = j;
        } else {
          buffer += text.slice(i, j);
          i = j;
        }
      } else if (text[i] === "*" && text[i + 1] !== "*" && (i === 0 || text[i - 1] !== "*")) {
        if (buffer) {
          parts.push(<span key={`text-${parts.length}`}>{buffer}</span>);
          buffer = "";
        }

        let j = i + 1;
        let italicText = "";
        let foundClosing = false;

        while (j < text.length) {
          if (text[j] === "*" && (j === text.length - 1 || text[j + 1] !== "*")) {
            italicText = text.slice(i + 1, j);
            foundClosing = true;
            j += 1;
            break;
          }
          j++;
        }

        if (foundClosing) {
          parts.push(
            <em key={`italic-${parts.length}`} className="italic">
              {italicText}
            </em>,
          );
          i = j;
        } else {
          buffer += text.slice(i, j);
          i = j;
        }
      } else if (text[i] === "`") {
        if (buffer) {
          parts.push(<span key={`text-${parts.length}`}>{buffer}</span>);
          buffer = "";
        }

        let j = i + 1;
        let codeText = "";
        let foundClosing = false;

        while (j < text.length) {
          if (text[j] === "`") {
            codeText = text.slice(i + 1, j);
            foundClosing = true;
            j += 1;
            break;
          }
          j++;
        }

        if (foundClosing) {
          parts.push(
            <code key={`code-${parts.length}`} className="px-1 py-0.5 bg-muted rounded text-xs font-mono">
              {codeText}
            </code>,
          );
          i = j;
        } else {
          buffer += text.slice(i, j);
          i = j;
        }
      } else if (text[i] === "\n") {
        if (buffer) {
          parts.push(<span key={`text-${parts.length}`}>{buffer}</span>);
          buffer = "";
        }
        parts.push(<br key={`br-${parts.length}`} />);
        i++;
      } else {
        buffer += text[i];
        i++;
      }
    }

    if (buffer) {
      parts.push(<span key={`text-${parts.length}`}>{buffer}</span>);
    }

    return parts;
  };

  return (
    <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
      {parseMarkdown(displayedText)}
      {isStreaming && <span className="animate-pulse">|</span>}
    </div>
  );
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  isStreaming?: boolean;
}

export default function ChatComponent() {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm Agent M, your AI trading assistant. I can help you analyze markets, track your portfolio, or answer questions about prediction markets. How can I help you today?",
      isStreaming: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}`;

  useEffect(() => {
    // Use requestAnimationFrame to ensure scroll happens after render
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "auto",
        block: "end",
      });
    });
  }, [chatMessages]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const streamBackendResponse = async (userMessage: string, assistantMessageId: string, signal: AbortSignal) => {
    const response = await fetch(`${BASE_URL}/rag/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        message: userMessage,
        tickers: [],
      }),
      signal: signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No response body");
    }

    let accumulatedContent = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        if (!event.trim()) continue;

        const lines = event.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data.trim() === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              const token = parsed.token || "";

              if (token) {
                accumulatedContent += token;

                setChatMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: accumulatedContent,
                          isStreaming: true,
                        }
                      : msg,
                  ),
                );
              }
            } catch (parseError) {
              if (data.trim() && data.trim() !== "[DONE]") {
                accumulatedContent += data;
                setChatMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: accumulatedContent,
                          isStreaming: true,
                        }
                      : msg,
                  ),
                );
              }
            }
          }
        }
      }
    }

    if (buffer.trim()) {
      const lines = buffer.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data.trim() && data.trim() !== "[DONE]") {
            try {
              const parsed = JSON.parse(data);
              const token = parsed.token || "";
              if (token) {
                accumulatedContent += token;
                setChatMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: accumulatedContent,
                          isStreaming: true,
                        }
                      : msg,
                  ),
                );
              }
            } catch {
              accumulatedContent += data;
              setChatMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId ? { ...msg, content: accumulatedContent, isStreaming: true } : msg,
                ),
              );
            }
          }
        }
      }
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: chatInput,
      isStreaming: false,
    };

    setChatMessages((prev) => [...prev, userMessage]);

    const messageToSend = chatInput;
    setChatInput("");
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      setChatMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          isStreaming: true,
        },
      ]);

      await streamBackendResponse(messageToSend, assistantMessageId, abortControllerRef.current.signal);

      setChatMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg)),
      );
    } catch (e: any) {
      console.error("Error sending message:", e);

      if (e.name === "AbortError" || e.message === "AbortError") {
        setChatMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      } else {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "I apologize, but I encountered an error processing your request. Please try again.",
                  isStreaming: false,
                }
              : msg,
          ),
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {});
  };

  return (
    <Card className="bg-card border-border flex flex-col overflow-hidden h-full min-h-[500px]">
      <CardHeader className="pb-3 flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-foreground text-lg font-semibold">Chat</CardTitle>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <BarChart3 className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {chatMessages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" ? (
                <div className="max-w-[90%] space-y-2">
                  {message.isStreaming && !message.content ? (
                    <span className="text-sm text-muted-foreground animate-pulse">Thinking...</span>
                  ) : (
                    <MarkdownStreamingContent content={message.content} isStreaming={message.isStreaming || false} />
                  )}

                  {message.sources && message.sources.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                      <span className="text-muted-foreground">Sources:</span>
                      {message.sources.map((source, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                          {source}
                        </span>
                      ))}
                    </div>
                  )}

                  {!message.isStreaming && message.content && (
                    <div className="flex items-center gap-2 pt-1">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                        <Bookmark className="w-3.5 h-3.5" />
                        Save to note
                      </button>
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {/* <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsDown className="w-4 h-4" />
                      </button> */}
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-muted text-foreground text-sm">
                  {message.content}
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border">
          <div className="relative">
            <input
              type="text"
              placeholder="Ask about markets, portfolio, or predictions..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
              disabled={isLoading}
              className="w-full bg-muted/30 border border-border rounded-lg py-3 pl-4 pr-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={sendChatMessage}
                disabled={isLoading || !chatInput.trim()}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  MessageSquare,
  Bookmark,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Send,
} from 'lucide-react';
import StreamingText from './StreamingText';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  isStreaming?: boolean;
}

export default function ChatComponent() {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm Agent M, your AI trading assistant. I can help you analyze markets, track your portfolio, or answer questions about prediction markets. How can I help you today?",
      isStreaming: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // SSE streaming function - same as AskAI
  const streamBackendResponse = async (
    userMessage: string,
    assistantMessageId: string,
    signal: AbortSignal,
  ) => {
    const response = await fetch(`${BASE_URL}/rag/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test',
      },
      body: JSON.stringify({
        message: userMessage,
        tickers: [], // Empty array for general chat, no specific tickers
      }),
      signal: signal,
    });

    console.log('res', response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let accumulatedContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        if (!event.trim()) continue;

        const lines = event.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data.trim() === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              const token = parsed.token || '';

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
              if (data.trim() && data.trim() !== '[DONE]') {
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
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim() && data.trim() !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              const token = parsed.token || '';
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
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent, isStreaming: true }
                    : msg,
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
      role: 'user',
      content: chatInput,
      isStreaming: false,
    };

    setChatMessages((prev) => [...prev, userMessage]);

    const messageToSend = chatInput;
    setChatInput('');
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      // Add empty assistant message
      setChatMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          isStreaming: true,
        },
      ]);

      // Stream from backend
      await streamBackendResponse(
        messageToSend,
        assistantMessageId,
        abortControllerRef.current.signal,
      );

      // Mark streaming as complete
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg,
        ),
      );
    } catch (e: any) {
      console.error('Error sending message:', e);

      if (e.name === 'AbortError' || e.message === 'AbortError') {
        setChatMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId),
        );
      } else {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    'I apologize, but I encountered an error processing your request. Please try again.',
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
    navigator.clipboard.writeText(content).then(() => {
      console.log('Copied to clipboard');
    });
  };

  const renderMessageContent = (content: string, isStreaming: boolean) => {
    const parts = content.split(/(\*\*[^*]+\*\*|•[^\n]+)/);

    return (
      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={i} className="font-semibold">
                <StreamingText
                  text={part.slice(2, -2)}
                  isStreaming={isStreaming}
                />
              </strong>
            );
          }
          if (part.startsWith('•')) {
            return (
              <span key={i} className="block ml-2 text-muted-foreground">
                <StreamingText text={part} isStreaming={isStreaming} />
              </span>
            );
          }
          return (
            <span key={i}>
              <StreamingText text={part} isStreaming={isStreaming} />
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="bg-card border-border flex flex-col overflow-hidden h-full min-h-[500px]">
      <CardHeader className="pb-3 flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-foreground text-lg font-semibold">
          Chat
        </CardTitle>
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
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="max-w-[90%] space-y-2">
                  {/* Show "Thinking..." while waiting for first token */}
                  {message.isStreaming && !message.content ? (
                    <span className="text-sm text-muted-foreground animate-pulse">
                      Thinking...
                    </span>
                  ) : (
                    renderMessageContent(
                      message.content,
                      message.isStreaming || false,
                    )
                  )}

                  {message.sources && message.sources.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                      <span className="text-muted-foreground">Sources:</span>
                      {message.sources.map((source, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-primary/10 text-primary rounded"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action buttons - show after streaming completes */}
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
                      <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsDown className="w-4 h-4" />
                      </button>
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

        {/* Chat input */}
        <div className="p-4 border-t border-border">
          <div className="relative">
            <input
              type="text"
              placeholder="Ask about markets, portfolio, or predictions..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
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

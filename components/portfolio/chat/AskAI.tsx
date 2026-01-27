'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StreamingText from './StreamingText';

interface AskAIProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextData?: any;
}

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
};

export default function AskAI({ open, onOpenChange, contextData }: AskAIProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const hasAutoSentRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && contextData && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true;

      let autoMessage = '';

      if (
        contextData.avgPrice !== undefined &&
        contextData.currentPrice !== undefined
      ) {
        autoMessage =
          `I have a position in ${contextData.symbol}:\n` +
          `- Current Price: $${contextData.currentPrice.toFixed(2)}\n` +
          `- Shares: ${Math.abs(contextData.shares)}\n` +
          `- Avg Entry Price: $${contextData.avgPrice.toFixed(2)}\n` +
          `- Total P/L: ${contextData.totalPL >= 0 ? '+' : ''}$${contextData.totalPL.toFixed(2)} (${contextData.changePercent.toFixed(2)}%)\n\n` +
          `Can you analyze this position and provide insights?`;
      } else if (contextData.type) {
        const txDate = new Date(contextData.datetime).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        autoMessage =
          `I have a transaction for ${contextData.symbol}:\n` +
          `- Type: ${contextData.type.toUpperCase()}\n` +
          `- Date: ${txDate}\n` +
          `- Price: $${contextData.price.toFixed(2)}\n` +
          `- Quantity: ${contextData.filledQty} shares\n` +
          `- Total Value: $${contextData.totalValue.toFixed(2)}\n` +
          `- Order Type: ${contextData.reason}\n\n` +
          `Can you analyze this transaction and provide insights?`;
      }

      if (autoMessage) {
        handleSendMessage(autoMessage);
      }
    }
  }, [open, contextData]);

  useEffect(() => {
    if (!open) {
      hasAutoSentRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [open]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);

    if (!messageText) {
      setInput('');
    }

    setLoading(true);
    setError(null);
    setStreamingMessageId(assistantMessageId);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Extract tickers from contextData
      let tickers: string[] = [];

      if (contextData) {
        // Single stock/transaction context
        if (contextData.symbol) {
          tickers = [contextData.symbol];
        }
        // Multiple items (e.g., portfolio view)
        else if (Array.isArray(contextData)) {
          tickers = contextData
            .map((item: any) => item.symbol)
            .filter((symbol): symbol is string => Boolean(symbol));
        }
      }

      // Remove duplicates
      tickers = [...new Set(tickers)];

      // Build payload matching backend schema
      const payload = {
        message: textToSend,
        tickers: tickers,
      };

      console.log('Sending to backend:', payload); // Debug log

      const response = await fetch('http://localhost:8000/api/v1/rag/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test',
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error:', errorData);
        throw new Error(
          `HTTP ${response.status}: ${errorData.detail || response.statusText}`,
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          isStreaming: true,
        },
      ]);

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Parse the chunk (adjust based on your API's response format)
        try {
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));

              if (data.content || data.delta || data.answer) {
                const newContent = data.content || data.delta || data.answer;
                accumulatedContent += newContent;

                // Update the streaming message
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg,
                  ),
                );
              }
            }
          }
        } catch (parseError) {
          // If not JSON, treat as plain text
          accumulatedContent += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg,
            ),
          );
        }
      }

      // Mark streaming as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg,
        ),
      );
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setError('Request cancelled');
      } else {
        setError(
          e instanceof Error ? e.message : 'Unexpected error talking to Ask AI',
        );
      }

      // Remove the streaming message on error
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== assistantMessageId),
      );
    } finally {
      setLoading(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  };

  const handleSend = () => {
    handleSendMessage();
  };

  return (
    <>
      <div
        className={`
          fixed inset-0 z-40 bg-black/40 backdrop-blur-sm
          transition-opacity duration-300 ease-out
          ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => onOpenChange(false)}
      />

      <div className="fixed bottom-2 left-0 right-0 z-50 pointer-events-none">
        <div className="mx-auto max-w-5xl px-4 pb-4 pointer-events-none">
          <div
            className={`
              pointer-events-auto
              transform transition-all duration-500 ease-out
              ${
                open
                  ? 'translate-y-0 opacity-100 scale-100'
                  : 'translate-y-[calc(100%+2rem)] opacity-0 scale-95'
              }
            `}
            style={{
              transitionTimingFunction: open
                ? 'cubic-bezier(0.16, 1, 0.3, 1)'
                : 'cubic-bezier(0.7, 0, 0.84, 0)',
            }}
          >
            <div className="relative rounded-2xl p-[2px]">
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-[-100%] bg-gradient-conic-smooth animate-spin-border" />
              </div>

              <Card className="relative bg-neutral-900 backdrop-blur-xl border-0 shadow-2xl rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Ask Agent M.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contextData?.symbol
                        ? `Analyzing ${contextData.symbol}`
                        : 'Ask about your holdings, risk, or what to do next.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close Ask AI"
                    onClick={() => onOpenChange(false)}
                    className="ml-2 inline-flex items-center justify-center rounded-full border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-2 text-sm">
                  {messages.length === 0 && !error && !loading && (
                    <p className="text-muted-foreground text-xs">
                      {contextData
                        ? 'Loading analysis...'
                        : 'Try: "Why is my portfolio down today?" or "What should I do with my largest position?"'}
                    </p>
                  )}

                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`
                        flex animate-slide-up
                        ${m.role === 'user' ? 'justify-end' : 'justify-start'}
                      `}
                    >
                      <div
                        className={`px-3 py-2 rounded-xl max-w-[80%] ${
                          m.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {m.role === 'assistant' && m.isStreaming ? (
                          <StreamingText
                            text={m.content}
                            isStreaming={true}
                            speed={20}
                          />
                        ) : (
                          <span className="whitespace-pre-wrap">
                            {m.content}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {error && (
                    <p className="text-xs text-red-500 animate-shake">
                      {error}
                    </p>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="flex items-center gap-2 px-4 pb-3 pt-2 border-t border-border">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      className="flex-1 text-sm bg-border border-border rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:border-gray-600 transition-all"
                      placeholder={
                        loading
                          ? 'Thinking...'
                          : 'Ask anything about your portfolio...'
                      }
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={loading}
                    />
                    <Button
                      size="icon"
                      className="rounded-xl transition-transform hover:scale-110 active:scale-95"
                      onClick={handleSend}
                      disabled={loading || !input.trim()}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }

        @keyframes spin-border {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        .animate-spin-border {
          animation: spin-border 4s linear infinite;
        }

        .bg-gradient-conic-smooth {
          background: conic-gradient(
            from 0deg,
            #14b8a6,
            #0d9488,
            #0f766e,
            #115e59,
            #134e4a,
            #1a3a38,
            #1a1a1a,
            #0a0a0a,
            #000000,
            #0a0a0a,
            #1a1a1a,
            #1a3a38,
            #134e4a,
            #115e59,
            #0f766e,
            #0d9488,
            #14b8a6
          );
        }
      `}</style>
    </>
  );
}

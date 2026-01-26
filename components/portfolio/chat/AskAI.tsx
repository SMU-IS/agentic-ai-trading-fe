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

      if (contextData.shares !== undefined) {
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

  // Mock streaming function
  const simulateStreamingResponse = async (
    userMessage: string,
    assistantMessageId: string,
    signal: AbortSignal,
  ) => {
    // Generate mock response based on context
    let mockResponse = '';

    if (contextData?.symbol) {
      if (contextData.shares !== undefined) {
        // Holdings analysis
        const isProfit = contextData.totalPL >= 0;
        mockResponse =
          `Based on your ${contextData.symbol} position, here's my analysis:\n\n` +
          `📊 Performance Overview:\n` +
          `Your position is currently ${isProfit ? 'profitable' : 'in a loss'} with a ${Math.abs(contextData.changePercent).toFixed(2)}% ${isProfit ? 'gain' : 'loss'}. ` +
          `This ${isProfit ? 'suggests good entry timing' : 'may present a buying opportunity if fundamentals remain strong'}.\n\n` +
          `💡 Key Insights:\n` +
          `• Average entry price: $${contextData.avgPrice.toFixed(2)}\n` +
          `• Current market price: $${contextData.currentPrice.toFixed(2)}\n` +
          `• Position size: ${Math.abs(contextData.shares)} shares\n\n` +
          `🎯 Recommendation:\n` +
          `${isProfit ? 'Consider taking partial profits if this represents a significant gain. You might want to set a trailing stop loss to protect your gains.' : 'If you believe in the long-term prospects, this could be an opportunity to average down. However, reassess the fundamental reasons for your initial investment.'}\n\n` +
          `Would you like me to analyze any specific aspect of this position?`;
      } else if (contextData.type) {
        // Transaction analysis
        const isBuy = contextData.type === 'buy';
        mockResponse =
          `Let me analyze this ${contextData.type.toUpperCase()} transaction for ${contextData.symbol}:\n\n` +
          `📝 Transaction Details:\n` +
          `You ${isBuy ? 'acquired' : 'sold'} ${contextData.filledQty} shares at $${contextData.price.toFixed(2)} per share, ` +
          `for a total of $${contextData.totalValue.toFixed(2)}.\n\n` +
          `⏰ Timing Analysis:\n` +
          `This transaction was executed on ${new Date(contextData.datetime).toLocaleDateString()}. ` +
          `${isBuy ? "As a buyer, you'll want to monitor if the price continues to trend upward." : 'As a seller, this locked in your position at this price point.'}\n\n` +
          `💭 Strategic Considerations:\n` +
          `${isBuy ? '• Monitor for confirmation that your entry was well-timed\n• Consider setting a stop-loss to manage risk\n• Track any upcoming earnings or news that could affect the stock' : '• Evaluate if the exit timing aligns with your investment goals\n• Consider tax implications of this sale\n• Review if you want to reallocate the capital'}\n\n` +
          `What else would you like to know about this transaction?`;
      }
    } else {
      // General questions
      mockResponse =
        `That's a great question! Let me help you with that.\n\n` +
        `Based on current market conditions and your portfolio structure, here are some insights:\n\n` +
        `📈 Market Overview:\n` +
        `The market has been experiencing volatility recently. It's important to maintain a diversified portfolio and stay focused on your long-term investment goals.\n\n` +
        `💼 Portfolio Strategy:\n` +
        `• Review your asset allocation regularly\n` +
        `• Consider rebalancing if any position grows too large\n` +
        `• Keep some cash reserves for opportunities\n` +
        `• Don't let emotions drive your investment decisions\n\n` +
        `🎯 Next Steps:\n` +
        `I recommend reviewing your largest positions and ensuring they still align with your investment thesis. ` +
        `Would you like me to analyze any specific holdings?\n\n` +
        `Feel free to ask me about specific stocks or strategies!`;
    }

    // Stream the response character by character
    const words = mockResponse.split(' ');
    let accumulatedContent = '';

    for (let i = 0; i < words.length; i++) {
      if (signal.aborted) {
        throw new Error('AbortError');
      }

      // Add word with space (except for last word)
      accumulatedContent += words[i] + (i < words.length - 1 ? ' ' : '');

      // Update the streaming message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: accumulatedContent }
            : msg,
        ),
      );

      // Random delay between 30-80ms for more natural feel
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 50 + 30),
      );
    }
  };

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

      // Simulate streaming with mock data
      await simulateStreamingResponse(
        textToSend,
        assistantMessageId,
        abortControllerRef.current.signal,
      );

      // Mark streaming as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg,
        ),
      );
    } catch (e: any) {
      if (e.message === 'AbortError') {
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

                <div className="max-h-96 overflow-y-scroll px-4 py-3 space-y-2 text-sm">
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
                            : 'bg-transparent text-foreground'
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

'use client';

import { useState } from 'react';
import { X, Send, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AskAIProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AskAI({ open, onOpenChange }: AskAIProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:8000/api/v1/rag/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test',
        },
        body: JSON.stringify({
          message: input.trim(),
        }),
      });

      if (!res.ok) {
        let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errorData = await res.json();
          if (errorData.detail) {
            if (typeof errorData.detail === 'object') {
              errorDetail = `${errorData.detail.type || 'Error'}: ${errorData.detail.error || errorData.detail.message || JSON.stringify(errorData.detail)}`;
              console.error('Backend traceback:', errorDetail);

              if (errorData.detail.traceback) {
                console.error('Backend traceback:', errorData.detail.traceback);
              }
            } else {
              errorDetail = errorData.detail;
            }
          }
        } catch {
          errorDetail = await res.text();
        }
        throw new Error(errorDetail);
      }

      const data = await res.json();
      const aiContent: string =
        data.answer ??
        data.content ??
        data.messages?.[data.messages.length - 1]?.content ??
        'Sorry, I could not generate a response.';

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: aiContent },
      ]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unexpected error talking to Ask AI',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay with fade animation */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/40 backdrop-blur-sm
          transition-opacity duration-300 ease-out
          ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => onOpenChange(false)}
      />

      {/* Bottom sheet container */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
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
            {/* Animated gradient border wrapper */}
            <div className="relative rounded-2xl p-[2px]">
              {/* Spinning gradient border (behind the card) */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-[-100%] bg-gradient-conic-smooth animate-spin-border" />
              </div>

              {/* Actual card content (on top, covers the center) */}
              <Card className="relative bg-black backdrop-blur-xl border-0 shadow-2xl rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Ask Agent M.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ask about your holdings, risk, or what to do next.
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

                {/* Messages */}
                <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-2 text-sm">
                  {messages.length === 0 && !error && (
                    <p className="text-muted-foreground text-xs">
                      Try: "Why is my portfolio down today?" or "What should I
                      do with my largest position?"
                    </p>
                  )}

                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`
                        flex animate-slide-up
                        ${m.role === 'user' ? 'justify-end' : 'justify-start'}
                      `}
                      style={{
                        animationDelay: `${idx * 50}ms`,
                        animationFillMode: 'backwards',
                      }}
                    >
                      <div
                        className={`px-3 py-2 rounded-xl max-w-[80%] ${
                          m.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}

                  {error && (
                    <p className="text-xs text-red-500 animate-shake">
                      {error}
                    </p>
                  )}
                </div>

                {/* Input row */}
                <div className="flex items-center gap-2 px-4 pb-3 pt-2 border-t border-border">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      className="flex-1 text-sm bg-border border-border rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500 transition-all"
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
                      disabled={loading}
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

'use client';

import { useState } from 'react';
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

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

export default function ChatComponent() {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm Agent M, your AI trading assistant. I can help you analyze markets, track your portfolio, or answer questions about prediction markets. How can I help you today?",
    },
  ]);

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;

    // Add user message
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
    };

    setChatMessages([...chatMessages, newMessage]);
    setChatInput('');

    // Simulate AI response (Mock)
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            "I'm analyzing the market data based on your request. Here are some key insights:\n\n**Market Trends:**\n• Tech sector shows strong momentum\n• Bond yields are stabilizing\n\nWould you like me to execute any trades based on this information?",
          sources: ['Bloomberg', 'Reuters'],
        },
      ]);
    }, 1000);
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
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {message.content
                      .split(/(\*\*[^*]+\*\*|•[^\n]+)/)
                      .map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return (
                            <strong key={i} className="font-semibold">
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        if (part.startsWith('•')) {
                          return (
                            <span
                              key={i}
                              className="block ml-2 text-muted-foreground"
                            >
                              {part}
                            </span>
                          );
                        }
                        return <span key={i}>{part}</span>;
                      })}
                  </div>
                  {message.sources && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                      <Bookmark className="w-3.5 h-3.5" />
                      Save to note
                    </button>
                    <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-muted text-foreground text-sm">
                  {message.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Chat input */}
        <div className="p-4 border-t border-border">
          <div className="relative">
            <input
              type="text"
              placeholder="Start typing..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
              className="w-full bg-muted/30 border border-border rounded-lg py-3 pl-4 pr-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={sendChatMessage}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
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

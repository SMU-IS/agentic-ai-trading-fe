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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      isStreaming: false,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/chatbot/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: chatInput,
            user_id: 'current_user', // Replace with actual user ID from auth
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to get response from chatbot');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          data.response ||
          data.answer ||
          'I apologize, but I could not process your request.',
        sources: data.sources || [],
        isStreaming: true,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);

      // After streaming completes, update to non-streaming
      setTimeout(
        () => {
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, isStreaming: false }
                : msg,
            ),
          );
        },
        assistantMessage.content.length * 30 + 100,
      );
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'I apologize, but I encountered an error processing your request. Please try again.',
        isStreaming: true,
      };

      setChatMessages((prev) => [...prev, errorMessage]);

      setTimeout(
        () => {
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === errorMessage.id ? { ...msg, isStreaming: false } : msg,
            ),
          );
        },
        errorMessage.content.length * 30 + 100,
      );
    } finally {
      setIsLoading(false);
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
                  {renderMessageContent(
                    message.content,
                    message.isStreaming || false,
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
                  {!message.isStreaming && (
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

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[90%] space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <span>Agent M is thinking...</span>
                </div>
              </div>
            </div>
          )}

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

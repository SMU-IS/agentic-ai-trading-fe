"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { ChevronDown, BrainCircuit } from "lucide-react"
import { useState } from "react"

interface MarkdownRendererProps {
  content: string
  className?: string
}

function ThoughtBlock({ content }: { content: string }) {
  const [isOpen, setIsOpen] = useState(true)

  // Don't render until we have some actual content beyond just a few characters or whitespace
  if (!content || content.trim().length < 2) return null

  return (
    <div className="my-4 rounded-xl border border-teal-500/20 bg-teal-500/5 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-teal-400/80 hover:bg-teal-500/10 transition-colors border-b border-teal-500/10"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-3.5 w-3.5 animate-pulse" />
          <span>Thinking Process</span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-300",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        />
      </button>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden",
        )}
      >
        <div className="p-4 text-xs italic text-muted-foreground/80 leading-relaxed space-y-2 border-l-2 border-teal-500/30 ml-4 my-2">
           <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content.trim()}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Enhanced parsing to handle multiple <thought> blocks correctly
  const thoughtSegments: string[] = []
  let mainContent = ""
  
  // Handle escaped tags like \<thought>
  const sanitizedContent = content.replace(/\\<thought>/g, '<thought>')
  
  // Regex to find all thought blocks
  const parts = sanitizedContent.split("<thought>")
  
  // The first part is always main content (text before the first <thought>)
  mainContent += parts[0]
  
  for (let i = 1; i < parts.length; i++) {
    const thoughtAndRest = parts[i]
    if (thoughtAndRest.includes("</thought>")) {
      const [thought, ...rest] = thoughtAndRest.split("</thought>")
      thoughtSegments.push(thought)
      mainContent += rest.join("</thought>") // Put back any content after the closing tag
    } else {
      // Still streaming this thought block
      thoughtSegments.push(thoughtAndRest)
    }
  }

  // Remove any trailing partial <thought tag or markdown artifacts that might show up during streaming
  // This prevents the raw tag or empty separators (like > or ---) from flashing
  mainContent = mainContent
    .replace(/\\?$/, '') // Remove trailing backslash
    .replace(/<t?h?o?u?g?h?t?>?$/, '') // Remove partial tag
    .replace(/(?:^|\n)[\s>*-]+$/, '$1') // Strip trailing blockquote markers, list markers, or horizontal rules
    .trimEnd()

  return (
    <div className={cn("prose prose-invert max-w-none text-sm leading-relaxed", className)}>
      {thoughtSegments.map((thought, idx) => {
        const cleanedThought = thought.replace(/<\/t?h?o?u?g?h?t?>?$/, '').trim();
        // Higher threshold to prevent empty-looking accordions during the very start of streaming
        if (cleanedThought.length < 10) return null;
        
        return (
          <ThoughtBlock 
            key={idx} 
            content={cleanedThought} 
          />
        );
      })}
      
      {mainContent && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => (
              <strong className="font-bold text-teal-400/90">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-teal-200/80">{children}</em>
            ),
            code: ({ node, inline, className, children, ...props }: any) => {
              if (inline) {
                return (
                  <code
                    className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-teal-300/90 border border-border/50"
                    {...props}
                  >
                    {children}
                  </code>
                )
              }
              return (
                <div className="relative my-4 group">
                  <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-normal">
                    <code {...props}>{children}</code>
                  </pre>
                </div>
              )
            },
            ul: ({ children }) => (
              <ul className="mb-4 ml-4 list-disc space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 ml-4 list-decimal space-y-1">{children}</ol>
            ),
            li: ({ children }) => <li className="pl-1">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="my-4 border-l-4 border-teal-500/30 pl-4 italic text-muted-foreground">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="my-4 overflow-x-auto">
                <table className="w-full border-collapse border border-border text-xs text-left">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border bg-muted/50 px-3 py-2 font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-3 py-2">{children}</td>
            ),
            h1: ({ children }) => (
              <h1 className="mb-4 text-lg font-bold text-foreground border-b border-border pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 text-md font-bold text-foreground/90">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 text-sm font-bold text-foreground/80">
                {children}
              </h3>
            ),
            hr: () => <hr className="my-6 border-border" />,
            a: ({ children, href }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 underline underline-offset-4 hover:text-teal-300 transition-colors"
              >
                {children}
              </a>
            ),
          }}
        >
          {mainContent}
        </ReactMarkdown>
      )}
    </div>
  )
}

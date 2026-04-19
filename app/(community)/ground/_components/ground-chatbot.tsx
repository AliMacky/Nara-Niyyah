"use client";

/**
 * GroundChatbot — floating chat panel for Nara Ground volunteers.
 *
 * Fixed in the bottom-right corner of every Ground page. Renders as a
 * button that expands into a chat panel. The assistant knows how the
 * app works and handles quick questions without the volunteer needing
 * to contact the campaign manager.
 *
 * Design: DESIGN_SYSTEM.md — paper tones, clay accent, no glass-morphism.
 * Depth comes from border weight and paper-100 surfaces, not blur/shadow.
 */

import { useState, useTransition, useRef, useEffect } from "react";
import { MessageSquare, X, Send, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  sendGroundChatMessage,
  type ChatMessage,
} from "@/server/ground/chatbot";

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] px-3.5 py-2.5 rounded-md text-[0.875rem] leading-[1.4375rem]",
          isUser
            ? "bg-[var(--clay-100)] text-[var(--ink-900)] rounded-br-sm"
            : "bg-[var(--paper-200)] text-[var(--ink-700)] rounded-bl-sm",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GroundChatbot
// ---------------------------------------------------------------------------

export function GroundChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm the Ground Assistant. Ask me anything about how the app works — lanes, points, logging shifts, ranks, whatever.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  function handleSend() {
    const text = input.trim();
    if (!text || isPending) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");

    startTransition(async () => {
      try {
        // Send only the actual conversation (skip the canned opening message)
        // so the API doesn't treat it as real assistant output.
        const apiMessages = nextMessages.filter(
          (m) =>
            !(
              m.role === "assistant" &&
              m.content.startsWith("Hi! I'm the Ground Assistant")
            ),
        );
        const { response } = await sendGroundChatMessage(apiMessages);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I couldn't connect right now. Try again in a moment.",
          },
        ]);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-20 right-5 z-40",
          "w-[320px] sm:w-[360px]",
          "rounded-md border border-[var(--paper-300)] bg-[var(--paper-50)]",
          "flex flex-col overflow-hidden",
          "transition-all duration-[240ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto shadow-[0_4px_24px_rgba(28,26,23,0.12)]"
            : "opacity-0 translate-y-3 pointer-events-none",
        )}
        style={{ maxHeight: "min(480px, calc(100dvh - 120px))" }}
        aria-hidden={!isOpen}
        role="dialog"
        aria-label="Ground Assistant chat"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--paper-200)] bg-[var(--paper-100)] shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare
              size={15}
              strokeWidth={1.75}
              className="text-[var(--clay-600)]"
            />
            <span className="text-[0.8125rem] font-medium text-[var(--ink-900)]">
              Ground Assistant
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
            className="text-[var(--ink-300)] hover:text-[var(--ink-900)] transition-colors duration-[120ms] outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)] rounded"
          >
            <ChevronDown size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {isPending && (
            <div className="flex justify-start">
              <div className="bg-[var(--paper-200)] rounded-md rounded-bl-sm px-3.5 py-2.5">
                <span className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--ink-300)] animate-bounce"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-[var(--paper-200)] px-3 py-3 flex items-end gap-2 bg-[var(--paper-50)]">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question…"
            rows={1}
            disabled={isPending}
            className={cn(
              "flex-1 resize-none bg-transparent text-[0.875rem] text-[var(--ink-900)]",
              "placeholder:text-[var(--ink-300)]",
              "outline-none leading-[1.375rem]",
              "max-h-[96px] overflow-y-auto",
              "disabled:opacity-50",
            )}
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isPending}
            aria-label="Send message"
            className={cn(
              "shrink-0 w-8 h-8 flex items-center justify-center rounded-md",
              "transition-colors duration-[120ms]",
              "outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)]",
              "disabled:opacity-40 disabled:pointer-events-none",
              "bg-[var(--clay-600)] text-[var(--paper-50)] hover:bg-[var(--clay-500)]",
            )}
          >
            <Send size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close Ground Assistant" : "Open Ground Assistant"}
        aria-expanded={isOpen}
        className={cn(
          "fixed bottom-5 right-5 z-40",
          "flex items-center gap-2",
          "px-4 py-2.5 rounded-full",
          "text-[0.8125rem] font-medium",
          "transition-all duration-[120ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          "outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)] focus-visible:ring-offset-2",
          "shadow-[0_2px_12px_rgba(28,26,23,0.15)]",
          isOpen
            ? "bg-[var(--paper-200)] text-[var(--ink-700)] hover:bg-[var(--paper-300)]"
            : "bg-[var(--clay-600)] text-[var(--paper-50)] hover:bg-[var(--clay-500)]",
        )}
      >
        {isOpen ? (
          <X size={15} strokeWidth={1.75} />
        ) : (
          <MessageSquare size={15} strokeWidth={1.75} />
        )}
        <span className="hidden sm:inline">
          {isOpen ? "Close" : "Ask a question"}
        </span>
      </button>
    </>
  );
}

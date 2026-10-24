"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./ChatInterface.module.css";
import { Button } from "@/components/ui/Button";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { formatCurrencyINR } from "@/lib/format";
import type { EventPlanRequest } from "@/types/event";

export interface ChatInterfaceProps {
  readonly eventContext?: Partial<EventPlanRequest>;
}

const STARTER_PROMPTS = [
  "How can we cut 10% from our decor budget?",
  "What questions should we ask our caterer during tasting?",
  "Recommend a backup contingency plan if it rains",
  "Suggest unique personalized return gift ideas",
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ eventContext }) => {
  const {
    messages,
    isStreaming,
    error,
    sendMessageStream,
    sendQuickAsk,
    abortStream,
    clearHistory,
  } = useStreamingChat({ eventContext });

  const [input, setInput] = useState("");
  const [chatMode, setChatMode] = useState<"stream" | "ask">("stream");
  const [srAnnouncement, setSrAnnouncement] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevStreamingRef = useRef(isStreaming);

  // Auto-scroll to bottom as messages stream
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  // Announce when streaming completes
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) {
      // Streaming just stopped
      setSrAnnouncement("Response complete");
      setTimeout(() => setSrAnnouncement(""), 1000);
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isStreaming) return;

    setInput("");
    if (chatMode === "stream") {
      await sendMessageStream(text);
    } else {
      await sendQuickAsk(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.chatContainer}>
      {/* Screen reader announcements for streaming status */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {srAnnouncement}
      </div>

      {/* Context Awareness Banner */}
      <div className={styles.contextBanner}>
        <div className={styles.contextDetails}>
          <span aria-hidden="true">🎯</span>
          {eventContext?.eventType ? (
            <span>
              <strong>Active Context:</strong>{" "}
              {eventContext.eventType.charAt(0).toUpperCase() + eventContext.eventType.slice(1)} in{" "}
              {eventContext.city || "your city"} ({eventContext.guestCount || "—"} guests
              {eventContext.budget ? ` • ${formatCurrencyINR(eventContext.budget, { compact: true })}` : ""})
            </span>
          ) : (
            <span>General Celebration Advisory Mode (No active plan selected)</span>
          )}
        </div>

        <button
          type="button"
          onClick={clearHistory}
          style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "var(--font-size-xs)" }}
          title="Clear chat history"
        >
          Clear History
        </button>
      </div>

      {/* Message Area */}
      <div
        className={styles.messageArea}
        role="log"
        aria-label="Conversation log"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions text"
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${isUser ? styles.userRow : styles.assistantRow}`}
            >
              <div
                className={`${styles.avatar} ${isUser ? styles.userAvatar : styles.assistantAvatar}`}
                aria-hidden="true"
              >
                {isUser ? "👤" : "✨"}
              </div>

              <div className={`${styles.messageBubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
                {!isUser && (
                  <div className={styles.messageMeta}>
                    <span style={{ fontWeight: 700, fontSize: "var(--font-size-xs)" }}>Eventoria Assistant</span>
                    <span className={styles.metaTier}>
                      {msg.modelTier === "detailed" ? "Deep Planning (Flash)" : "Quick Advice"}
                    </span>
                  </div>
                )}

                <div className={styles.messageContent}>
                  {msg.content || (
                    <div className={styles.typingIndicator} aria-label="Assistant is typing..." role="status" aria-live="polite">
                      <span className={styles.dot} />
                      <span className={styles.dot} />
                      <span className={styles.dot} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {error && (
          <div 
            role="alert" 
            aria-live="assertive"
            style={{ padding: "var(--space-2) var(--space-4)", backgroundColor: "var(--color-error-subtle)", color: "var(--color-error)", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-xs)" }}
          >
            ⚠️ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts */}
      <div className={styles.starterPrompts}>
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className={styles.starterChip}
            onClick={() => handleSend(prompt)}
            disabled={isStreaming}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Row */}
      <div className={styles.inputBar}>
        <div className={styles.modeToggleBar}>
          <div className={styles.modeSelect}>
            <button
              type="button"
              className={`${styles.modeButton} ${chatMode === "stream" ? styles.modeButtonActive : ""}`}
              onClick={() => setChatMode("stream")}
            >
              🌊 Deep Streaming
            </button>
            <button
              type="button"
              className={`${styles.modeButton} ${chatMode === "ask" ? styles.modeButtonActive : ""}`}
              onClick={() => setChatMode("ask")}
            >
              ⚡ Quick Ask (Lite)
            </button>
          </div>

          <span>Press Enter to send</span>
        </div>

        <div className={styles.formRow}>
          <input
            type="text"
            className={styles.chatInput}
            placeholder={
              chatMode === "stream"
                ? "Ask about budgets, timeline sequences, or vendor questions..."
                : "Ask a quick planning question..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            aria-label="Chat input message"
          />

          {isStreaming ? (
            <Button variant="danger" size="md" onClick={abortStream}>
              Stop ⏹
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSend()}
              disabled={!input.trim()}
            >
              Send 🚀
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

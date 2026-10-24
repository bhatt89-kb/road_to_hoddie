"use client";

import { useState, useRef, useCallback } from "react";
import type { ChatMessage, EventPlanRequest } from "@/types/event";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { useLocalStorage } from "./useLocalStorage";

export interface UseStreamingChatOptions {
  readonly eventContext?: Partial<EventPlanRequest>;
}

const INITIAL_MESSAGES: ReadonlyArray<ChatMessage> = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hello! I am your Eventoria Planning Assistant. I can help you balance your budget, review vendor contracts, sequence day-of schedules, or brainstorm creative celebration ideas. How can I assist you today?",
    timestamp: 0,
    modelTier: "quick",
  },
];

export function useStreamingChat(options: UseStreamingChatOptions = {}) {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(
    LOCAL_STORAGE_KEYS.CHAT_HISTORY,
    INITIAL_MESSAGES as ChatMessage[]
  );

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Send message via SSE streaming
  const sendMessageStream = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const assistantMessageId = `assistant-${Date.now()}`;
      const placeholderAssistant: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        modelTier: "detailed",
      };

      // Append user message + empty assistant placeholder
      const updatedMessages = [...messages, userMessage];
      setMessages([...updatedMessages, placeholderAssistant]);
      setIsStreaming(true);

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            eventContext: options.eventContext,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No readable stream response received.");

        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("data: ")) continue;

            const dataContent = trimmedLine.replace("data: ", "");
            if (dataContent === "[DONE]") break;

            try {
              const parsed = JSON.parse(dataContent);
              if (parsed.text) {
                accumulatedText += parsed.text;
                // Live update assistant message
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedText }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore partial JSON parse chunks
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // User aborted stream, do not treat as error
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to receive AI response.";
        setError(message);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    "I encountered a temporary connection issue. Please verify your message or check your rate limit.",
                }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isStreaming, options.eventContext, setMessages]
  );

  // Send non-streaming quick ask
  const sendQuickAsk = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const assistantMessageId = `assistant-${Date.now()}`;
      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      try {
        const response = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: trimmed,
            eventContext: options.eventContext,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: "assistant",
          content: data.answer || "No response received.",
          timestamp: Date.now(),
          modelTier: "quick",
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get quick advice.";
        setError(message);
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, options.eventContext, setMessages]
  );

  // Stop active stream
  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  // Clear conversation history
  const clearHistory = useCallback(() => {
    abortStream();
    setMessages([
      {
        id: "welcome-cleared",
        role: "assistant",
        content: "Chat history cleared. How can I help you with your celebration planning?",
        timestamp: Date.now(),
        modelTier: "quick",
      },
    ]);
  }, [abortStream, setMessages]);

  return {
    messages,
    isStreaming,
    error,
    sendMessageStream,
    sendQuickAsk,
    abortStream,
    clearHistory,
  };
}

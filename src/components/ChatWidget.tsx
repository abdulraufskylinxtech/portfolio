"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  externalOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SESSION_STORAGE_KEY = "portfolio-chat-session-id";

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getStoredSessionId(): string {
  if (typeof window === "undefined") return createSessionId();
  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const id = createSessionId();
  localStorage.setItem(SESSION_STORAGE_KEY, id);
  return id;
}

const ChatWidget = ({ externalOpen, onOpenChange }: ChatWidgetProps) => {
  const t = useTranslations("chat");
  const locale = useLocale();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen ?? internalOpen;

  const setIsOpen = (open: boolean) => {
    setInternalOpen(open);
    onOpenChange?.(open);
  };

  const [sessionId, setSessionId] = useState<string>(() => getStoredSessionId());
  const sessionIdRef = useRef(sessionId);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t("greeting") },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipHistoryLoadRef = useRef(false);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const greetingMessage = useCallback((): Message => {
    return { role: "assistant", content: t("greeting") };
  }, [t]);

  const loadSessionHistory = useCallback(
    async (forSessionId: string) => {
      if (skipHistoryLoadRef.current) {
        skipHistoryLoadRef.current = false;
        return;
      }

      setIsLoadingHistory(true);
      try {
        const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(forSessionId)}`);
        if (!res.ok) return;

        const data = (await res.json()) as {
          messages?: { role: "user" | "assistant"; content: string }[];
        };

        // Ignore stale responses (e.g. user clicked New chat while fetch was in flight)
        if (forSessionId !== sessionIdRef.current) return;

        if (data.messages?.length) {
          setMessages(data.messages);
        } else {
          setMessages([greetingMessage()]);
        }
      } catch {
        if (forSessionId === sessionIdRef.current) {
          setMessages([greetingMessage()]);
        }
      } finally {
        if (forSessionId === sessionIdRef.current) {
          setIsLoadingHistory(false);
        }
      }
    },
    [greetingMessage],
  );

  useEffect(() => {
    if (externalOpen !== undefined) {
      setInternalOpen(externalOpen);
    }
  }, [externalOpen]);

  useEffect(() => {
    if (isOpen) {
      void loadSessionHistory(sessionIdRef.current);
    }
  }, [isOpen, loadSessionHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isLoadingHistory]);

  const handleNewChat = () => {
    const newId = createSessionId();
    sessionIdRef.current = newId;
    skipHistoryLoadRef.current = true;
    localStorage.setItem(SESSION_STORAGE_KEY, newId);
    setSessionId(newId);
    setMessages([greetingMessage()]);
    setInputValue("");
    setIsLoadingHistory(false);
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const activeSessionId = sessionIdRef.current;
    const userMessage: Message = { role: "user", content: inputValue.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId,
          message: userMessage.content,
          locale,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        }),
      });

      const data = (await res.json()) as {
        response?: string;
        sessionId?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Chat request failed");
      }

      if (data.sessionId && data.sessionId !== sessionIdRef.current) {
        sessionIdRef.current = data.sessionId;
        localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
        setSessionId(data.sessionId);
      }

      if (activeSessionId !== sessionIdRef.current) return;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response ?? t("error"),
        },
      ]);
    } catch (error) {
      console.error("AI Error:", error);
      if (activeSessionId === sessionIdRef.current) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("error"),
          },
        ]);
      }
    } finally {
      if (activeSessionId === sessionIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Chat"
        className={cn(
          "chat-launcher group fixed z-40 flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16",
          "bottom-[max(1.25rem,env(safe-area-inset-bottom))] end-[max(1.25rem,env(safe-area-inset-right))]",
          "bg-primary text-primary-foreground shadow-[0_10px_28px_hsl(var(--primary)/0.45)]",
          "ring-4 ring-primary/25 transition-all duration-300 hover:scale-105 hover:bg-primary-glow hover:shadow-[0_12px_32px_hsl(var(--primary-glow)/0.5)]",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
          isOpen ? "pointer-events-none scale-0 opacity-0" : "scale-100 opacity-100",
        )}
      >
        <MessageCircle
          className="h-7 w-7 stroke-[2] text-primary-foreground sm:h-8 sm:w-8"
          fill="none"
          aria-hidden
        />
      </button>

      <Card
        className={cn(
          "fixed z-40 flex flex-col glass border-primary/30 shadow-2xl transition-all duration-300",
          "bottom-[max(1rem,env(safe-area-inset-bottom))] end-[max(1rem,env(safe-area-inset-right))]",
          "h-[min(32rem,calc(100dvh-5.5rem))] w-[min(24rem,calc(100vw-2rem))]",
          isOpen ? "scale-100 opacity-100 animate-slide-in-right" : "pointer-events-none scale-95 opacity-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-3 w-3 shrink-0 animate-glow-pulse rounded-full bg-primary" />
            <h3 className="truncate font-semibold text-foreground">{t("title")}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="hover:bg-secondary"
              aria-label={t("newChat")}
              title={t("newChat")}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="hover:bg-secondary"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}-${message.content.slice(0, 24)}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-secondary p-3 text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("placeholder")}
              className="border-border bg-secondary"
              disabled={isLoading || isLoadingHistory}
            />
            <Button
              onClick={() => void handleSend()}
              size="icon"
              className="shrink-0 bg-primary hover:bg-primary-glow"
              disabled={isLoading || isLoadingHistory || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};

export default ChatWidget;

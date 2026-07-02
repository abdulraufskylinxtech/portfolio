"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocalizedSite } from "@/components/providers/content-provider";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  externalOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const ChatWidget = ({ externalOpen, onOpenChange }: ChatWidgetProps) => {
  const t = useTranslations("chat");
  const locale = useLocale();
  const site = useLocalizedSite();
  const displayName = site.name;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen ?? internalOpen;

  const setIsOpen = (open: boolean) => {
    setInternalOpen(open);
    onOpenChange?.(open);
  };

  const sessionIdRef = useRef(createSessionId());
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t("greeting", { name: displayName }) },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  const greetingMessage = useCallback((): Message => {
    return { role: "assistant", content: t("greeting", { name: displayName }) };
  }, [t, displayName]);

  const startFreshChat = useCallback(() => {
    const newId = createSessionId();
    sessionIdRef.current = newId;
    setMessages([greetingMessage()]);
    setInputValue("");
    setIsLoading(false);
  }, [greetingMessage]);

  const scrollToLatest = useCallback(() => {
    requestAnimationFrame(() => {
      const anchor = messagesEndRef.current;
      if (!anchor) return;

      const viewport = anchor.closest("[data-radix-scroll-area-viewport]");
      if (viewport instanceof HTMLElement) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
        return;
      }

      anchor.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, []);

  useEffect(() => {
    if (externalOpen !== undefined) {
      setInternalOpen(externalOpen);
    }
  }, [externalOpen]);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      startFreshChat();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, startFreshChat]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0) return [greetingMessage()];
      if (prev.length === 1 && prev[0].role === "assistant") return [greetingMessage()];
      return prev;
    });
  }, [greetingMessage]);

  useEffect(() => {
    scrollToLatest();
  }, [messages, isLoading, scrollToLatest]);

  const handleNewChat = () => {
    startFreshChat();
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

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
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
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-secondary p-3 text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden />
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
              disabled={isLoading}
            />
            <Button
              onClick={() => void handleSend()}
              size="icon"
              className="shrink-0 bg-primary hover:bg-primary-glow"
              disabled={isLoading || !inputValue.trim()}
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

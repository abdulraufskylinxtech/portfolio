"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContent, usePublishedProjects } from "@/components/providers/content-provider";
import { mimicAI } from "@/lib/mimicAI";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  externalOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ChatWidget = ({ externalOpen, onOpenChange }: ChatWidgetProps) => {
  const t = useTranslations("chat");
  const { site } = useContent();
  const projects = usePublishedProjects();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen ?? internalOpen;

  const setIsOpen = (open: boolean) => {
    setInternalOpen(open);
    onOpenChange?.(open);
  };

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t("greeting") },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalOpen !== undefined) {
      setInternalOpen(externalOpen);
    }
  }, [externalOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const aiResponse = await mimicAI(userMessage.content, site, projects);
      const aiMessage: Message = {
        role: "assistant",
        content: aiResponse.response,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, I'm having trouble responding right now. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 animate-glow-pulse rounded-full bg-primary" />
            <h3 className="font-semibold text-foreground">{t("title")}</h3>
          </div>
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

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
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
              onClick={handleSend}
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

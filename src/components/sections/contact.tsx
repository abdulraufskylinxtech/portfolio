"use client";

import { useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Loader2, Mail, Linkedin, Github, Send, Phone, Instagram } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { z } from "zod";

import { ContactMap } from "@/components/pages/contact-map";
import { useSiteInfo } from "@/components/providers/content-provider";
import { getPhoneNumber } from "@/lib/data";
import { getWhatsAppUrl } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function ContactSection() {
  const t = useTranslations("contact");
  const site = useSiteInfo();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduceMotion = useReducedMotion();

  const contactSchema = z.object({
    name: z.string().min(1, t("validation.nameRequired")).max(100),
    email: z.string().email(t("validation.invalidEmail")).max(255),
    message: z.string().min(10, t("validation.messageMin")).max(1000),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      contactSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t("toast.validationError"),
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setSending(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          website: "",
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        email_sent?: boolean;
        email_warning?: string;
        saved?: boolean;
      };

      if (!res.ok) {
        throw new Error(data.error ?? t("toast.error"));
      }

      setFormData({ name: "", email: "", message: "" });

      if (data.email_sent) {
        toast({ title: t("toast.successTitle"), description: t("toast.success") });
      } else if (data.saved) {
        toast({
          title: t("toast.savedTitle"),
          description: data.email_warning
            ? t("toast.savedNoEmail")
            : t("toast.savedPendingEmail"),
        });
      }
    } catch (error) {
      toast({
        title: t("toast.errorTitle"),
        description: error instanceof Error ? error.message : t("toast.error"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const phone = getPhoneNumber(site);
  const whatsapp = site.whatsapp?.trim();
  const showPhone = Boolean(phone && phone !== whatsapp);

  const socialLinks = [
    { icon: Mail, label: "Email", href: `mailto:${site.email}`, text: site.email },
    ...(showPhone
      ? [
          {
            icon: Phone,
            label: "Phone",
            href: `tel:${phone!.replace(/\s/g, "")}`,
            text: phone!,
          },
        ]
      : []),
    ...(whatsapp
      ? [
          {
            icon: Phone,
            label: "WhatsApp",
            href: getWhatsAppUrl(whatsapp),
            text: whatsapp,
          },
        ]
      : []),
    {
      icon: Linkedin,
      label: "LinkedIn",
      href: site.linkedin,
      text: site.linkedin.replace("https://", ""),
    },
    {
      icon: Github,
      label: "GitHub",
      href: site.github,
      text: site.github.replace("https://", ""),
    },
    ...(site.instagram
      ? [
          {
            icon: Instagram,
            label: "Instagram",
            href: site.instagram,
            text: site.instagram.replace("https://", ""),
          },
        ]
      : []),
  ];

  return (
    <section
      ref={ref}
      id="contact"
      className="scroll-mt-24 border-b border-border bg-section-alt py-20 sm:py-28"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={reduceMotion || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {t("sectionLabel")}
          </p>
          <h2 className="mt-3 mb-4 text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mb-12 max-w-2xl text-muted-foreground">{t("subtitle")}</p>

          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <Card className="glass border-primary/20 bg-background/95 shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
              <CardHeader>
                <CardTitle>{t("form.send")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    className="pointer-events-none absolute h-0 w-0 opacity-0"
                    aria-hidden
                  />
                  <Input
                    placeholder={t("form.name")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border-primary/20 bg-card/95 text-foreground placeholder:text-muted-foreground"
                    required
                    disabled={sending}
                  />
                  <Input
                    type="email"
                    placeholder={t("form.email")}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-primary/20 bg-card/95 text-foreground placeholder:text-muted-foreground"
                    required
                    disabled={sending}
                  />
                  <Textarea
                    placeholder={t("form.message")}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="min-h-32 border-primary/20 bg-card/95 text-foreground placeholder:text-muted-foreground"
                    required
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground shadow-[0_12px_24px_hsl(var(--primary)/0.22)] hover:bg-primary-glow"
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        {t("form.sending")}
                      </>
                    ) : (
                      <>
                        {t("form.send")}
                        <Send className="ms-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-xl font-semibold text-foreground">{t("connect")}</h3>
                <div className="grid gap-3">
                  {socialLinks.map(({ icon: Icon, label, href, text }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm transition hover:border-primary/40 hover:bg-primary/10"
                      data-cursor-hover
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {label}
                        </p>
                        <p className="truncate text-sm font-medium text-foreground">{text}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              <ContactMap />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

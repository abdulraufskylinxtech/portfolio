"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";

import { useBlogPostBySlug } from "@/components/providers/content-provider";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function BlogPostPageContent({ slug }: { slug: string }) {
  const t = useTranslations("blog");
  const post = useBlogPostBySlug(slug);

  if (!post) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 pt-24">
        <h1 className="text-2xl font-bold">Post Not Found</h1>
        <Button asChild>
          <Link href="/blog">{t("backToBlog")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="px-4 pb-16 pt-24">
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/blog">
              <ArrowLeft className="me-2 h-4 w-4" />
              {t("backToBlog")}
            </Link>
          </Button>

          <h1 className="mb-4 break-words text-3xl font-bold text-foreground sm:text-4xl">
            {post.title}
          </h1>

          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              {post.post_type}
            </span>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </motion.div>
      </div>
    </article>
  );
}

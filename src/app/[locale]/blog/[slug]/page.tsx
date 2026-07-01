import { BlogPostPageContent } from "@/components/pages/blog-post-page";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <main className="flex-1">
      <BlogPostPageContent slug={slug} />
    </main>
  );
}

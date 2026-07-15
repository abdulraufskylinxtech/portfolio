"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ExternalLink, Github } from "lucide-react";
import { useTranslations } from "next-intl";

import { usePublishedProjects } from "@/components/providers/content-provider";
import type { Project } from "@/lib/data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ProjectsSection() {
  const t = useTranslations("projects");
  const projects = usePublishedProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = selectedProject?.images ?? [];

  const openProjectModal = (project: Project) => {
    setSelectedProject(project);
    setCurrentImageIndex(0);
  };

  const goToImage = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      const next = ((index % images.length) + images.length) % images.length;
      setCurrentImageIndex(next);
    },
    [images.length],
  );

  const nextImage = useCallback(() => goToImage(currentImageIndex + 1), [currentImageIndex, goToImage]);
  const prevImage = useCallback(() => goToImage(currentImageIndex - 1), [currentImageIndex, goToImage]);

  useEffect(() => {
    if (!selectedProject || images.length <= 1) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedProject, images.length, nextImage, prevImage]);

  return (
    <section id="projects" className="scroll-mt-24 py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {t("sectionLabel")}
          </p>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">{t("subtitle")}</p>
        </div>

        {projects.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No projects yet. Add them in <code className="text-primary">data/projects.json</code>.
          </p>
        ) : (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="glass group cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-[0_0_28px_hsl(var(--primary)/0.15)]"
                onClick={() => openProjectModal(project)}
                data-cursor-hover
              >
                {project.images?.[0] && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <Image
                      src={project.images[0]}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      loading="lazy"
                    />
                    {project.images.length > 1 && (
                      <span className="absolute bottom-2 end-2 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
                        +{project.images.length - 1}
                      </span>
                    )}
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-foreground transition-colors group-hover:text-primary">
                    {project.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-muted-foreground">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.slice(0, 4).map((tech) => (
                      <Badge key={tech} variant="secondary" className="bg-secondary/80 text-secondary-foreground">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  {project.github_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-28 flex-1"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={project.github_link} target="_blank" rel="noopener noreferrer">
                        <Github className="me-2 h-4 w-4" />
                        {t("code")}
                      </a>
                    </Button>
                  )}
                  {project.live_link && (
                    <Button size="sm" className="min-w-28 flex-1" asChild onClick={(e) => e.stopPropagation()}>
                      <a href={project.live_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="me-2 h-4 w-4" />
                        {t("demo")}
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="pe-8 text-xl leading-snug sm:text-2xl">
              {selectedProject?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6">
              {images.length > 0 && (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-xl bg-muted">
                    <div className="relative aspect-video w-full">
                      {images.map((src, index) => (
                        <div
                          key={src}
                          className={cn(
                            "absolute inset-0 transition-opacity duration-300 ease-in-out",
                            index === currentImageIndex ? "opacity-100" : "pointer-events-none opacity-0",
                          )}
                        >
                          <Image
                            src={src}
                            alt={`${selectedProject.title} — ${index + 1}`}
                            fill
                            className="object-contain p-1"
                            sizes="(max-width: 896px) 100vw, 896px"
                            priority={index === currentImageIndex}
                          />
                        </div>
                      ))}
                    </div>

                    {images.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute start-2 top-1/2 h-9 w-9 -translate-y-1/2 bg-background/80 backdrop-blur-sm sm:start-3 sm:h-10 sm:w-10"
                          onClick={prevImage}
                          aria-label={t("prevImage")}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute end-2 top-1/2 h-9 w-9 -translate-y-1/2 bg-background/80 backdrop-blur-sm sm:end-3 sm:h-10 sm:w-10"
                          onClick={nextImage}
                          aria-label={t("nextImage")}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <span className="absolute bottom-3 start-1/2 -translate-x-1/2 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                          {currentImageIndex + 1} / {images.length}
                        </span>
                      </>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="flex justify-center gap-2">
                      {images.map((src, index) => (
                        <button
                          key={`${src}-dot-${index}`}
                          type="button"
                          onClick={() => goToImage(index)}
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            index === currentImageIndex
                              ? "w-6 bg-primary"
                              : "w-2 bg-muted-foreground/40 hover:bg-primary/60",
                          )}
                          aria-label={t("goToImage", { n: index + 1 })}
                        />
                      ))}
                    </div>
                  )}

                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.map((src, index) => (
                        <button
                          key={`${src}-thumb-${index}`}
                          type="button"
                          onClick={() => goToImage(index)}
                          className={cn(
                            "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                            index === currentImageIndex
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border opacity-70 hover:opacity-100",
                          )}
                        >
                          <Image src={src} alt="" fill className="object-cover" sizes="96px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{t("description")}</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{selectedProject.description}</p>
              </div>

              {selectedProject.apis?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{t("apis")}</h3>
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                    {selectedProject.apis.map((api) => (
                      <li key={api}>{api}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedProject.highlights?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{t("highlights")}</h3>
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                    {selectedProject.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{t("technologies")}</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tags.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 min-[400px]:flex-row min-[400px]:flex-wrap">
                {selectedProject.github_link && (
                  <Button variant="outline" className="w-full min-[400px]:w-auto" asChild>
                    <a href={selectedProject.github_link} target="_blank" rel="noopener noreferrer">
                      <Github className="me-2 h-4 w-4" />
                      {t("code")}
                    </a>
                  </Button>
                )}
                {selectedProject.live_link && (
                  <Button className="w-full min-[400px]:w-auto" asChild>
                    <a href={selectedProject.live_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="me-2 h-4 w-4" />
                      {t("demo")}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { AboutSection } from "@/components/sections/about";
import { ContactSection } from "@/components/sections/contact";
import { ExperienceSection } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { ProjectsSection } from "@/components/sections/projects";
import { SkillsSection } from "@/components/sections/skills";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

export function HomePageContent() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <Hero onChatOpen={() => setIsChatOpen(true)} />
      <ProjectsSection />
      <SkillsSection />
      <ExperienceSection />
      <AboutSection />
      <ContactSection />
      <ChatWidget externalOpen={isChatOpen} onOpenChange={setIsChatOpen} />
    </>
  );
}

import { useState } from "react";
import { PortfolioData } from "./types";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Profile from "./components/Profile";
import Competencies from "./components/Competencies";
import Projects from "./components/Projects";
import Trust from "./components/Trust";
import Contact from "./components/Contact";
import initialData from "../portfolio.json";

export default function App() {
  const [data] = useState<PortfolioData>(initialData as PortfolioData);

  if (!data) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        <Hero title={data.hero.title} subtitle={data.hero.subtitle} />
        <Profile 
          introduction={data.profile.introduction} 
          details={data.profile.details}
          education={data.profile.education}
          certifications={data.profile.certifications}
          languages={data.profile.languages}
          profileImage={data.profile.profileImage}
        />
        <Competencies introduction={data.competencies.introduction} items={data.competencies.items} />
        <Projects projects={data.projects} />
        <Trust content={data.trust.content} />
        <Contact email={data.contact.email} content={data.contact.content} />
      </main>

      <footer className="py-12 border-t border-gray-100 bg-gray-50/50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-medium text-gray-400">
            © 2024 Min Chae Yun. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

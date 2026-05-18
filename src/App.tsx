import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { PortfolioData } from "./types";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Profile from "./components/Profile";
import Competencies from "./components/Competencies";
import Projects from "./components/Projects";
import Trust from "./components/Trust";
import Contact from "./components/Contact";
import Admin from "./pages/Admin";
import { getPortfolio, getProjects, savePortfolio, saveProject } from "./lib/firebase";
import initialData from "../portfolio.json";

function Home() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        let portfolioDoc = await getPortfolio();
        let projectsList = await getProjects();

        if (!portfolioDoc || projectsList.length === 0) {
          console.log("Initializing Firebase with local data...");
          const { projects, ...rest } = initialData;
          await savePortfolio(rest);
          for (const project of (projects as any[])) {
            await saveProject(project.id, project);
          }
          portfolioDoc = rest;
          projectsList = projects;
        }

        setData({
          ...portfolioDoc,
          projects: projectsList
        } as PortfolioData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setData(initialData as PortfolioData);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-xl font-bold text-navy-900">로딩 중...</div>
      </div>
    );
  }

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
            © {new Date().getFullYear()} Min Chae Yun. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

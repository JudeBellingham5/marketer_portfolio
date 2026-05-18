import { useState, useEffect } from "react";
import { PortfolioData } from "./types";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Profile from "./components/Profile";
import Competencies from "./components/Competencies";
import Projects from "./components/Projects";
import Trust from "./components/Trust";
import Contact from "./components/Contact";
import Admin from "./pages/Admin";
import { motion, AnimatePresence } from "motion/react";
import initialData from "../portfolio.json";

export default function App() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Primary: Try server API (Cloud Run environment)
      const res = await fetch("/api/portfolio").catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Secondary: Fallback to local file (Static / Netlify initial state)
        setData(initialData as PortfolioData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setData(initialData as PortfolioData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveData = async (newData: PortfolioData) => {
    const token = localStorage.getItem("admin_token");
    if (!token || token !== "token-admin-authorized-0925") {
      alert("권한이 없습니다. 다시 로그인해 주세요.");
      return;
    }

    try {
      // 1. Try server API
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify(newData),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      setData(newData);
      setIsAdminOpen(false);
      alert("성공적으로 저장되었습니다.");
    } catch (error: any) {
      console.error("Save error:", error);
      alert(`저장 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy-900 text-white">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-2xl font-bold tracking-widest"
        >
          LOADING PORTFOLIO...
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar onAdminClick={() => setIsAdminOpen(true)} />
      
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

      <AnimatePresence>
        {isAdminOpen && (
          <Admin
            data={data}
            onClose={() => setIsAdminOpen(false)}
            onSave={handleSaveData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { motion } from "motion/react";
import { Project } from "../types";
import { ExternalLink, Tag, Presentation } from "lucide-react";

interface ProjectsProps {
  projects: Project[];
}

export default function Projects({ projects }: ProjectsProps) {
  return (
    <section id="projects" className="py-20 bg-navy-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start mb-16 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
            <h2 className="section-title mb-0 text-blue-600">주요 프로젝트</h2>
          </div>
          <p className="text-gray-700 font-medium max-w-2xl">
            데이터 수집부터 퍼널 분석, 해석, 전략 제안까지 전 과정을 <br className="hidden md:block" />
            주도적으로 수행한 프로젝트를 정리했습니다.
          </p>
        </div>

        <div className="space-y-24">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid lg:grid-cols-12 gap-8 lg:items-stretch"
            >
              {/* Project Info Summary */}
              <div className="lg:col-span-12 xl:col-span-5">
                <div className="bg-navy-900 rounded-2xl overflow-hidden text-white shadow-xl h-full flex flex-col">
                  {project.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden bg-white/5 border-b border-white/10 flex items-center justify-center">
                      <img 
                        src={project.imageUrl.startsWith('data:') || project.imageUrl.startsWith('http') ? project.imageUrl : `${import.meta.env.BASE_URL}${project.imageUrl.replace(/^\//, '')}`} 
                        alt={project.title} 
                        className="max-w-full max-h-full object-contain" 
                      />
                    </div>
                  )}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-blue-400 mb-4">
                      <span className="text-sm font-bold tracking-widest uppercase">Project 0{index + 1}</span>
                    </div>
                    <h3 className="text-3xl font-bold mb-6 tracking-tight leading-snug">
                      {project.title}
                    </h3>
                    <p className="text-navy-100 mb-8 leading-relaxed">
                      {project.summary}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {project.keywords.map((kw) => (
                        <span key={kw} className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Tag size={12} />
                          {kw}
                        </span>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-white/10 mb-8 mt-auto">
                      <p className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">My Role</p>
                      <p className="text-sm text-navy-200 leading-relaxed">
                        {project.role}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {project.projectUrl && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
                        >
                          <ExternalLink size={16} />
                          프로젝트 보기
                        </a>
                      )}
                      {project.pptUrl && (
                        <a
                          href={project.pptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 border border-white/20 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-all"
                        >
                          <Presentation size={16} />
                          PPT 보기
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Detail Report */}
              <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6">
                <div className="report-card flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    <h4 className="text-xl font-bold">Background</h4>
                  </div>
                  <p className="text-gray-600 leading-relaxed flex-1 text-lg">
                    {project.background}
                  </p>
                </div>

                <div className="report-card flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    <h4 className="text-xl font-bold">Process & Content</h4>
                  </div>
                  <p className="text-gray-600 leading-relaxed flex-1 text-lg">
                    {project.content}
                  </p>
                </div>

                <div className="report-card bg-blue-50/50 border-blue-100 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    <h4 className="text-xl font-bold text-navy-900">Results & Insights</h4>
                  </div>
                  <p className="text-navy-800 leading-relaxed font-medium flex-1 text-lg">
                    {project.result}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

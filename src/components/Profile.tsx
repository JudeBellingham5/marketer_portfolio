import { motion } from "motion/react";
import { PortfolioDetail, Education, Certification } from "../types";
import { Award, Globe, GraduationCap } from "lucide-react";

interface ProfileProps {
  introduction: string;
  details: PortfolioDetail[];
  education: Education;
  certifications: Certification[];
  languages: string[];
  profileImage?: string;
}

export default function Profile({ introduction, details, education, certifications, languages, profileImage }: ProfileProps) {
  return (
    <section id="profile" className="py-20 bg-navy-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-label">Profile</span>
            <h2 className="section-title">전문성을 기반으로 비즈니스의 실질적 성장을 주도합니다</h2>
            <p className="text-lg text-gray-600 leading-relaxed italic mb-8">
              "{introduction}"
            </p>
            
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="aspect-square w-48 bg-gray-100 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-200">
                  {profileImage ? (
                    <img 
                      src={profileImage.startsWith('data:') || profileImage.startsWith('http') ? profileImage : `${import.meta.env.BASE_URL}${profileImage.replace(/^\//, '')}`} 
                      alt="민채윤" 
                      className="max-w-full max-h-full object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl bg-gradient-to-br from-navy-100 to-navy-200">
                      MCY
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-navy-900 mb-1">민채윤</h3>
                  <p className="text-blue-600 font-medium mb-4">Marketer</p>
                  <div className="space-y-4">
                    {/* 프로필 데이터 노출 영역: 이름, 생년월일, 학력, 자격증 등의 텍스트는 portfolio.json에서 수정할 수 있습니다. */}
                    {details.map((detail, index) => (
                      <div key={index}>
                        <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{detail.label}</dt>
                        <dd className="text-sm font-medium text-navy-800">{detail.value}</dd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Education Layout Improvement */}
            <div className="report-card">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="text-blue-600" size={20} />
                <h4 className="font-bold">Education</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">School / Major</p>
                  <p className="text-sm font-bold text-navy-900">{education.school}</p>
                  <p className="text-sm text-gray-600">{education.major}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">GPA</p>
                  <p className="text-sm font-bold text-navy-900">{education.gpa} / {education.maxGpa}</p>
                  {education.doubleMajor && (
                    <div className="mt-2 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded inline-block">
                      복수전공: {education.doubleMajor}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Certifications Chips */}
            <div className="report-card">
              <div className="flex items-center gap-2 mb-6">
                <Award className="text-blue-600" size={20} />
                <h4 className="font-bold">Certifications</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert) => (
                  <span key={cert.id} className="px-4 py-2 bg-navy-900 text-white text-xs font-semibold rounded-lg shadow-sm">
                    {cert.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages Chips */}
            <div className="report-card">
              <div className="flex items-center gap-2 mb-6">
                <Globe className="text-blue-600" size={20} />
                <h4 className="font-bold">Languages</h4>
              </div>
              <div className="flex flex-wrap gap-3">
                {languages.map((lang) => (
                  <div key={lang} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-bold text-navy-900">{lang}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

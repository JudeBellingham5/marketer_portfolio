import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  title: string;
  subtitle: string;
}

export default function Hero({ title, subtitle }: HeroProps) {
  // Format title to have a break after '최적화하고,'
  const formattedTitle = title.replace("최적화하고,", "최적화하고,<br />");

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -z-10 opacity-10">
        <div className="w-[800px] h-[800px] bg-blue-600 rounded-full blur-3xl -mr-96 -mt-96" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <span className="section-label">Marketer</span>
          <h1 
            className="text-5xl lg:text-7xl font-bold text-navy-900 tracking-tight leading-[1.1] mb-8"
            dangerouslySetInnerHTML={{ __html: formattedTitle }}
          />
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mb-10">
            {subtitle}
          </p>
          
          <div className="flex flex-wrap gap-4">
            <a
              href="#projects"
              className="px-8 py-4 bg-navy-900 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-navy-800 transition-colors"
            >
              프로젝트 보기
              <ArrowRight size={20} />
            </a>
            <a
              href="#competencies"
              className="px-8 py-4 border border-gray-200 text-navy-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              역량 보기
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

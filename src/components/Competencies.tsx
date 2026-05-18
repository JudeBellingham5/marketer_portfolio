import { motion } from "motion/react";
import { CompetencyItem } from "../types";
import { CheckCircle2 } from "lucide-react";

interface CompetenciesProps {
  introduction: string;
  items: CompetencyItem[];
}

export default function Competencies({ introduction, items }: CompetenciesProps) {
  return (
    <section id="competencies" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-label">Core Competencies</span>
          <h2 className="section-title">데이터 기반의 전 과정 최적화</h2>
          <p 
            className="text-gray-600 text-lg"
            dangerouslySetInnerHTML={{ __html: introduction }}
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="report-card group"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                <CheckCircle2 size={24} className="text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-4">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

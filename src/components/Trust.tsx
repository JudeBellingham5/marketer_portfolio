import { motion } from "motion/react";
import { Lightbulb } from "lucide-react";

interface TrustProps {
  content: string;
}

export default function Trust({ content }: TrustProps) {
  return (
    <section id="trust" className="py-24 bg-white border-y border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <span className="section-label">Why Trust My Work</span>
          <h2 className="section-title">투명한 프로세스가 전략의 근거가 됩니다</h2>
          <div className="relative p-10 bg-navy-50 rounded-3xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
              <Lightbulb size={24} />
            </div>
            <p className="text-xl text-navy-800 leading-loose">
              {content}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

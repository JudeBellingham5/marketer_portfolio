import { motion } from "motion/react";
import { Mail, ArrowUpRight } from "lucide-react";

interface ContactProps {
  email: string;
  content: string;
}

export default function Contact({ email, content }: ContactProps) {
  return (
    <footer id="contact" className="py-24 bg-navy-900 text-white overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute bottom-0 left-0 opacity-20 transform -translate-x-1/2 translate-y-1/2">
        <div className="w-[600px] h-[600px] bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-blue-400 font-bold tracking-widest uppercase text-xs mb-4 block">Get In Touch</span>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-8">
              함께 성장할 비즈니스 파트너를 기다립니다
            </h2>
            <p className="text-navy-200 text-lg leading-relaxed mb-10 mx-auto">
              {content}
            </p>
            
            <a 
              href={`mailto:${email}`}
              className="inline-flex items-center gap-4 text-2xl font-bold text-white hover:text-blue-400 transition-colors group"
            >
              <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <Mail />
              </div>
              {email}
              <ArrowUpRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </motion.div>
        </div>

        <div className="mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-navy-400 text-sm">
          <p>© 2024 Min Chae-yun. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Notion</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

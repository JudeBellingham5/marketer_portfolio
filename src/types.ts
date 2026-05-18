export interface PortfolioDetail {
  label: string;
  value: string;
}

export interface Education {
  school: string;
  major: string;
  doubleMajor?: string;
  gpa: string;
  maxGpa: string;
}

export interface Certification {
  id: string;
  name: string;
}

export interface CompetencyItem {
  title: string;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  background: string;
  role: string;
  content: string;
  result: string;
  imageUrl?: string;
  pptUrl?: string;
  projectUrl?: string;
}

export interface PortfolioData {
  hero: {
    title: string;
    subtitle: string;
  };
  profile: {
    introduction: string;
    profileImage?: string;
    education: Education;
    certifications: Certification[];
    languages: string[];
    details: PortfolioDetail[];
  };
  competencies: {
    introduction: string;
    items: CompetencyItem[];
  };
  projects: Project[];
  trust: {
    content: string;
  };
  contact: {
    email: string;
    content: string;
  };
}

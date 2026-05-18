import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Save, ArrowLeft, Upload, Plus, Trash2 } from 'lucide-react';
import { getPortfolio, getProjects, savePortfolio, saveProject, db } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1902') {
      setIsAuthorized(true);
      fetchData();
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const p = await getPortfolio();
      const pr = await getProjects();
      setPortfolio(p);
      setProjects(pr);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePortfolio = async () => {
    setLoading(true);
    try {
      await savePortfolio(portfolio);
      alert('프로필 정보가 저장되었습니다.');
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async (project: any) => {
    setLoading(true);
    try {
      await saveProject(project.id, project);
      alert('프로젝트가 저장되었습니다.');
      fetchData();
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'projects', id));
      alert('프로젝트가 삭제되었습니다.');
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addProject = () => {
    const newProject = {
      id: `project-${Date.now()}`,
      title: '새 프로젝트',
      subtitle: '',
      summary: '',
      content: '',
      background: '',
      role: '',
      result: '',
      imageUrl: '',
      tags: [],
      keywords: [],
      order: projects.length
    };
    setProjects([...projects, newProject]);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-8">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter password (1902)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !portfolio) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/')} className="flex items-center text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to My Site
          </button>
          <h1 className="text-xl font-bold">Portfolio Admin</h1>
          <div className="flex gap-4">
             {loading && <span className="text-sm text-blue-500 animate-pulse mt-2">Saving...</span>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-12">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Main Settings (Hero & Profile)</h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleSavePortfolio}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" /> 
                {loading ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
          
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="p-6 bg-gray-50 rounded-xl space-y-4">
              <h3 className="font-bold text-navy-900 border-b pb-2">Hero Section</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hero Title</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={portfolio?.hero?.title || ''}
                    onChange={(e) => setPortfolio({ ...portfolio, hero: { ...portfolio.hero, title: e.target.value }})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hero Subtitle</label>
                  <textarea 
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 min-h-[80px] focus:ring-2 focus:ring-blue-500 outline-none"
                    value={portfolio?.hero?.subtitle || ''}
                    onChange={(e) => setPortfolio({ ...portfolio, hero: { ...portfolio.hero, subtitle: e.target.value }})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Profile Image</label>
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                      {portfolio?.profile?.profileImage ? (
                        <img src={portfolio.profile.profileImage} className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="inline-block bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition">
                        Upload Image
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, (url) => setPortfolio({ ...portfolio, profile: { ...portfolio.profile, profileImage: url } }))}
                        />
                      </label>
                      <p className="text-[10px] text-gray-400 max-w-[150px]">Recommended: Square image, max 1MB for Firestore.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Introduction</label>
                  <textarea 
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 min-h-[100px] focus:ring-2 focus:ring-blue-500 outline-none"
                    value={portfolio?.profile?.introduction || ''}
                    onChange={(e) => setPortfolio({ ...portfolio, profile: { ...portfolio.profile, introduction: e.target.value }})}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-1">Profile Details</h3>
                {portfolio?.profile?.details?.map((detail: any, idx: number) => (
                  <div key={idx}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">{detail.label}</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={detail.value}
                      onChange={(e) => {
                        const newDetails = [...portfolio.profile.details];
                        newDetails[idx].value = e.target.value;
                        setPortfolio({ ...portfolio, profile: { ...portfolio.profile, details: newDetails }});
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Projects</h2>
            <button 
              onClick={addProject}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Project
            </button>
          </div>

          {projects.map((project, idx) => (
            <div key={project.id} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
              <div className="flex justify-between items-start">
                <input 
                  className="text-lg font-bold bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none"
                  value={project.title}
                  onChange={(e) => {
                    const newProjects = [...projects];
                    newProjects[idx].title = e.target.value;
                    setProjects(newProjects);
                  }}
                />
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteProject(project.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleSaveProject(projects[idx])}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold grow"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Image</label>
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                    {project.imageUrl ? (
                      <img src={project.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <label className="block w-full text-center bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-200">
                    Upload Project Image
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, (url) => {
                        const newProjects = [...projects];
                        newProjects[idx].imageUrl = url;
                        setProjects(newProjects);
                      })}
                    />
                  </label>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                    <textarea 
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      value={project.summary}
                      onChange={(e) => {
                        const newProjects = [...projects];
                        newProjects[idx].summary = e.target.value;
                        setProjects(newProjects);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input 
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      value={project.role}
                      onChange={(e) => {
                        const newProjects = [...projects];
                        newProjects[idx].role = e.target.value;
                        setProjects(newProjects);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

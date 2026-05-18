import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { PortfolioData, Project } from "../types";
import { X, Save, Lock, LayoutDashboard, FileText, Briefcase, Settings, Upload, Image as ImageIcon, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { db, storage, auth } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

interface AdminProps {
  data: PortfolioData | null;
  onClose: () => void;
  onSave: (newData: PortfolioData) => void;
}

export default function Admin({ data, onClose, onSave }: AdminProps) {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [editableData, setEditableData] = useState<PortfolioData | null>(data);
  const [activeTab, setActiveTab] = useState("hero");
  const [uploadStatus, setUploadStatus] = useState<{ isUploading: boolean; stage: string; progress: number }>({
    isUploading: false,
    stage: "",
    progress: 0
  });

  useEffect(() => {
    setEditableData(data);
    
    // Check if already authorized
    const checkAuth = async () => {
      const savedToken = localStorage.getItem("admin_token");
      if (savedToken === "token-admin-authorized-0925") {
        console.log("Found valid token in localStorage");
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, [data]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const ADMIN_PASSWORD = "0925"; // Hardcoded for static site compatibility (Netlify)
    const AUTH_TOKEN = "token-admin-authorized-0925";

    console.log("Attempting login...");
    try {
      // 1. Try server-side login first (Cloud Run environment)
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ password }),
      }).catch(() => null);
      
      if (response && response.ok) {
        const result = await response.json();
        if (result.success) {
          setIsAuthorized(true);
          localStorage.setItem("admin_token", result.token);
          return;
        }
      }

      // 2. Fallback to client-side check if 404 or backend unavailable (Netlify environment)
      console.log("Falling back to client-side auth check");
      if (password === ADMIN_PASSWORD) {
        // Sign in to Firebase Auth to allow Storage writes
        try {
          await signInAnonymously(auth);
          console.log("Firebase Anonymous Auth successful");
        } catch (authError) {
          console.error("Firebase Auth failed:", authError);
          // Still proceed, maybe rules allow public write (though unlikely)
        }
        
        setIsAuthorized(true);
        localStorage.setItem("admin_token", AUTH_TOKEN);
      } else {
        alert("비밀번호가 일치하지 않습니다.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      // Final fallback
      if (password === ADMIN_PASSWORD) {
        setIsAuthorized(true);
        localStorage.setItem("admin_token", AUTH_TOKEN);
      } else {
        alert(`로그인 요청 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Compression timeout")), 10000);
      const reader = new FileReader();
      
      reader.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };

      reader.onload = (event) => {
        const img = new Image();
        img.onerror = (err) => {
          clearTimeout(timeout);
          reject(err);
        };
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              clearTimeout(timeout);
              if (blob) resolve(blob);
              else reject(new Error("Canvas compression failed"));
            },
            "image/jpeg",
            0.8
          );
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("파일 용량이 너무 큽니다. 10MB 이하의 이미지만 업로드 가능합니다.");
      e.target.value = "";
      return;
    }

    setUploadStatus({ isUploading: true, stage: "초기화 중...", progress: 10 });
    console.log("Starting upload for:", file.name);
    
    // Safety timeout to ensure UI doesn't hang forever
    const uploadTimeout = setTimeout(() => {
      setUploadStatus(prev => ({ ...prev, isUploading: false }));
      alert("업로드 시간이 초과되었습니다. 네트워크 상태를 확인하시거나 다시 시도해주세요.");
    }, 60000);

    try {
      let uploadTarget: Blob | File = file;
      if (file.type.startsWith("image/")) {
        try {
          setUploadStatus({ isUploading: true, stage: "이미지 압축 중...", progress: 30 });
          uploadTarget = await compressImage(file);
        } catch (compressError) {
          console.warn("Compression failed, using original:", compressError);
          uploadTarget = file;
        }
      }

      setUploadStatus({ isUploading: true, stage: "서버로 전송 중...", progress: 60 });
      
      // 1. Try Server-side upload first (Reliable in Cloud Run / Dev)
      try {
        const formData = new FormData();
        formData.append("file", uploadTarget, file.name);
        const token = localStorage.getItem("admin_token");
        
        const serverRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Authorization": token || "" },
          body: formData,
        }).catch(() => null);

        if (serverRes && serverRes.ok) {
          const result = await serverRes.json();
          if (result.success) {
            callback(result.url);
            alert("이미지 업로드가 완료되었습니다. (서버 저장)");
            return;
          }
        }
      } catch (serverError) {
        console.warn("Server upload failed, trying Firebase Storage:", serverError);
      }

      // 2. Fallback to Firebase Storage (For Netlify / Production)
      setUploadStatus({ isUploading: true, stage: "Firebase Storage로 전송 중...", progress: 70 });
      
      // Sanitize filename: remove special characters and spaces for better CORS/URL compatibility
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = `uploads/${uniqueSuffix}_${sanitizedName}`;
      const storageRef = ref(storage, filename);
      
      console.log("Uploading to Firebase Storage (Fallback):", filename);
      await uploadBytes(storageRef, uploadTarget);
      
      setUploadStatus({ isUploading: true, stage: "주소 받아오는 중...", progress: 90 });
      console.log("Fetching download URL...");
      const url = await getDownloadURL(storageRef);
      console.log("URL received:", url);
      
      callback(url);
      alert("이미지 업로드가 완료되었습니다. (Firebase 저장)");
    } catch (error: any) {
      console.error("Upload process error:", error);
      let errorMsg = error.message;
      if (error.code === 'storage/unauthorized') {
        errorMsg = "Firebase Storage 권한이 없습니다. 인증 설정을 확인하세요.";
      } else if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        errorMsg = "네트워크 오류 또는 CORS 차단이 발생했습니다. 브라우저에서 '광고 차단기'를 끄거나 Firebase Storage CORS 설정을 확인하세요.";
      }
      alert(`업로드 중 오류가 발생했습니다: ${errorMsg}`);
    } finally {
      clearTimeout(uploadTimeout);
      setUploadStatus({ isUploading: false, stage: "", progress: 100 });
      e.target.value = "";
    }
  };

  const handleSave = () => {
    if (editableData) {
      onSave(editableData);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-[60] bg-navy-900/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-navy-900">
              <Lock className="text-blue-600" />
              Admin Access
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Password</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-navy-900 text-white py-4 rounded-xl font-bold hover:bg-navy-800 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-navy-50 flex overflow-hidden">
      {/* Admin Sidebar */}
      <div className="w-64 bg-navy-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="text-blue-400" />
            Admin Panel
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "hero", label: "Hero Section", icon: FileText },
            { id: "profile", label: "Profile & Education", icon: Briefcase },
            { id: "projects", label: "Projects", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? "bg-blue-600 text-white" : "text-navy-300 hover:bg-white/5"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleSave}
            disabled={uploadStatus.isUploading}
            className="w-full bg-blue-600 flex items-center justify-center gap-2 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {uploadStatus.isUploading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 text-navy-400 hover:text-white text-sm py-2"
          >
            Exit Admin
          </button>
        </div>
      </div>

      {/* Admin Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-white/50 backdrop-blur-3xl">
        {uploadStatus.isUploading && (
          <div className="fixed top-8 right-8 z-[70] bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex flex-col gap-2 min-w-[200px]">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin" size={20} />
              <span className="font-bold text-sm">{uploadStatus.stage}</span>
            </div>
            <div className="w-full bg-blue-400 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-white h-full transition-all duration-300" 
                style={{ width: `${uploadStatus.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {activeTab === "hero" && editableData && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-8">Hero Section</h3>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Main Title</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold"
                  value={editableData.hero.title}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      hero: { ...editableData.hero, title: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Subtitle</label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 leading-relaxed"
                  value={editableData.hero.subtitle}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      hero: { ...editableData.hero, subtitle: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}

          {activeTab === "profile" && editableData && (
            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Profile Info</h3>
                
                {/* Profile Image Upload */}
                <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                  <label className="block text-sm font-bold text-gray-400 mb-4 uppercase">Profile Image</label>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center">
                      {editableData.profile.profileImage ? (
                        <img src={editableData.profile.profileImage} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImageIcon size={32} />
                        </div>
                      )}
                    </div>
                    <label className="group relative cursor-pointer">
                      <div className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold group-hover:bg-blue-100 transition-colors">
                        <Upload size={18} />
                        Upload Profile Photo
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        disabled={uploadStatus.isUploading}
                        onChange={(e) => handleFileUpload(e, (url) => {
                          if (editableData) {
                            setEditableData({ ...editableData, profile: { ...editableData.profile, profileImage: url } });
                          }
                        })}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Introduction</label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 leading-relaxed"
                    value={editableData.profile.introduction}
                    onChange={(e) =>
                      setEditableData({
                        ...editableData,
                        profile: { ...editableData.profile, introduction: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              {/* Education Section */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Education</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">School</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-4 py-2"
                      value={editableData.profile.education.school}
                      onChange={(e) => setEditableData({
                        ...editableData,
                        profile: { ...editableData.profile, education: { ...editableData.profile.education, school: e.target.value } }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Major</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-4 py-2"
                      value={editableData.profile.education.major}
                      onChange={(e) => setEditableData({
                        ...editableData,
                        profile: { ...editableData.profile, education: { ...editableData.profile.education, major: e.target.value } }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Double Major (Optional)</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-4 py-2"
                      value={editableData.profile.education.doubleMajor || ""}
                      onChange={(e) => setEditableData({
                        ...editableData,
                        profile: { ...editableData.profile, education: { ...editableData.profile.education, doubleMajor: e.target.value } }
                      })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">GPA</label>
                      <input
                        className="w-full border border-gray-200 rounded-xl px-4 py-2"
                        value={editableData.profile.education.gpa}
                        onChange={(e) => setEditableData({
                          ...editableData,
                          profile: { ...editableData.profile, education: { ...editableData.profile.education, gpa: e.target.value } }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Max</label>
                      <input
                        className="w-full border border-gray-200 rounded-xl px-4 py-2"
                        value={editableData.profile.education.maxGpa}
                        onChange={(e) => setEditableData({
                          ...editableData,
                          profile: { ...editableData.profile, education: { ...editableData.profile.education, maxGpa: e.target.value } }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Items */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold">Profile Details</h3>
                  <button 
                    onClick={() => {
                      const newDetails = [...editableData.profile.details, { label: "New Label", value: "New Value" }];
                      setEditableData({ ...editableData, profile: { ...editableData.profile, details: newDetails } });
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={16} /> Add Detail
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {editableData.profile.details.map((detail, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                      <div className="flex justify-between items-start">
                         <input
                          className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-transparent border-b border-gray-200"
                          value={detail.label}
                          onChange={(e) => {
                            const newDetails = [...editableData.profile.details];
                            newDetails[idx].label = e.target.value;
                            setEditableData({ ...editableData, profile: { ...editableData.profile, details: newDetails } });
                          }}
                        />
                        <button 
                          onClick={() => {
                            const newDetails = editableData.profile.details.filter((_, i) => i !== idx);
                            setEditableData({ ...editableData, profile: { ...editableData.profile, details: newDetails } });
                          }}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <input
                        className="w-full text-sm font-medium text-navy-800 bg-white px-3 py-2 rounded-lg border border-gray-200"
                        value={detail.value}
                        onChange={(e) => {
                          const newDetails = [...editableData.profile.details];
                          newDetails[idx].value = e.target.value;
                          setEditableData({ ...editableData, profile: { ...editableData.profile, details: newDetails } });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "projects" && editableData && (
            <div className="space-y-12">
               <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Projects</h3>
                <button 
                  onClick={() => {
                    const newProject: Project = {
                      id: `project-${Date.now()}`,
                      title: "New Project",
                      summary: "Short summary...",
                      keywords: ["Tag 1"],
                      background: "",
                      role: "",
                      content: "",
                      result: "",
                      imageUrl: ""
                    };
                    setEditableData({ ...editableData, projects: [...editableData.projects, newProject] });
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus size={16} /> Add Project
                </button>
              </div>
              {editableData.projects.map((project, idx) => (
                <div key={project.id} className="p-8 bg-white rounded-3xl border border-gray-200 space-y-8 shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                    <h4 className="font-bold text-blue-600 flex items-center gap-2">
                       <LayoutDashboard size={18} />
                       Project #{idx + 1}
                    </h4>
                    <button 
                      onClick={() => {
                        const newProjects = editableData.projects.filter((_, i) => i !== idx);
                        setEditableData({ ...editableData, projects: newProjects });
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-red-500 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} /> Remove Project
                    </button>
                  </div>

                  {/* Project Image */}
                  <div className="grid md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Thumbnail</label>
                      <div className="aspect-video w-full rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center">
                        {project.imageUrl ? (
                          <img src={project.imageUrl} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon size={32} />
                          </div>
                        )}
                      </div>
                      <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer">
                        <Upload size={14} /> Change Project Image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          disabled={uploadStatus.isUploading}
                          onChange={(e) => handleFileUpload(e, (url) => {
                            if (editableData) {
                              const newProjects = [...editableData.projects];
                              newProjects[idx].imageUrl = url;
                              setEditableData({ ...editableData, projects: newProjects });
                            }
                          })}
                        />
                      </label>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Title</label>
                        <input
                          className="w-full border border-gray-100 rounded-xl px-4 py-3 font-bold text-lg"
                          value={project.title}
                          onChange={(e) => {
                            const newProjects = [...editableData.projects];
                            newProjects[idx].title = e.target.value;
                            setEditableData({ ...editableData, projects: newProjects });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Summary</label>
                        <textarea
                          rows={3}
                          className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm leading-relaxed"
                          value={project.summary}
                          onChange={(e) => {
                            const newProjects = [...editableData.projects];
                            newProjects[idx].summary = e.target.value;
                            setEditableData({ ...editableData, projects: newProjects });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">PPT Link URL</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm"
                          value={project.pptUrl || ""}
                          onChange={(e) => {
                            const newProjects = [...editableData.projects];
                            newProjects[idx].pptUrl = e.target.value;
                            setEditableData({ ...editableData, projects: newProjects });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Project Link URL</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm"
                          value={project.projectUrl || ""}
                          onChange={(e) => {
                            const newProjects = [...editableData.projects];
                            newProjects[idx].projectUrl = e.target.value;
                            setEditableData({ ...editableData, projects: newProjects });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Background</label>
                      <textarea
                        rows={4}
                        className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm"
                        value={project.background}
                        onChange={(e) => {
                          const newProjects = [...editableData.projects];
                          newProjects[idx].background = e.target.value;
                          setEditableData({ ...editableData, projects: newProjects });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Process & Content</label>
                      <textarea
                        rows={4}
                        className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm"
                        value={project.content}
                        onChange={(e) => {
                          const newProjects = [...editableData.projects];
                          newProjects[idx].content = e.target.value;
                          setEditableData({ ...editableData, projects: newProjects });
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">My Role</label>
                      <textarea
                        rows={3}
                        className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm"
                        value={project.role}
                        onChange={(e) => {
                          const newProjects = [...editableData.projects];
                          newProjects[idx].role = e.target.value;
                          setEditableData({ ...editableData, projects: newProjects });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Results & Insights</label>
                      <textarea
                        rows={3}
                        className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm"
                        value={project.result}
                        onChange={(e) => {
                          const newProjects = [...editableData.projects];
                          newProjects[idx].result = e.target.value;
                          setEditableData({ ...editableData, projects: newProjects });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

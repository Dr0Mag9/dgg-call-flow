import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BookOpen, Search, FileText, Video, Link as LinkIcon, X } from 'lucide-react';

export default function StudyLibrary() {
  const { token } = useAppStore();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  useEffect(() => {
    fetch('/api/materials', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMaterials(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [token]);

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.description?.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'scripts': return <FileText className="w-6 h-6 text-blue-500" />;
      case 'videos': return <Video className="w-6 h-6 text-purple-500" />;
      case 'links': return <LinkIcon className="w-6 h-6 text-green-500" />;
      default: return <BookOpen className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Study Library</h2>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search scripts, guides, and materials..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading materials...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No materials found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {getIcon(material.category)}
                  </div>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full uppercase tracking-wider">
                    {material.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{material.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{material.description}</p>
                <button 
                  onClick={() => setSelectedMaterial(material)}
                  className="text-blue-600 font-medium text-sm hover:text-blue-700 flex items-center gap-1"
                >
                  View Material &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {getIcon(selectedMaterial.category)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedMaterial.title}</h3>
                  <span className="text-sm text-gray-500 uppercase tracking-wider font-medium">{selectedMaterial.category}</span>
                </div>
              </div>
              <button onClick={() => setSelectedMaterial(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {selectedMaterial.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-gray-700">{selectedMaterial.description}</p>
                </div>
              )}
              {selectedMaterial.content && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Content</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-800 font-mono text-sm">
                    {selectedMaterial.content}
                  </div>
                </div>
              )}
              {selectedMaterial.fileUrl && (
                <div className="mt-6">
                  <a href={selectedMaterial.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                    <LinkIcon className="w-4 h-4" /> Open External Link
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

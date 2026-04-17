import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BookOpen, Search, FileText, Video, Link as LinkIcon, X, Sparkles, Download, Layers, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      case 'scripts': return <FileText className="w-6 h-6 text-gold" />;
      case 'videos': return <Video className="w-6 h-6 text-gold" />;
      case 'links': return <LinkIcon className="w-6 h-6 text-gold" />;
      default: return <BookOpen className="w-6 h-6 text-gold" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-xl font-black text-pearl tracking-tight font-serif italic uppercase underline decoration-gold/30">Growth Archive</h2>
          <p className="text-gold-light/40 text-[9px] font-black uppercase tracking-[0.3em] mt-0.5">Intelligence & Training Resources</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="luxury-card p-2 flex gap-4 bg-navy/20"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/20 group-focus-within:text-gold w-4 h-4 transition-colors" />
          <input 
            type="text" 
            placeholder="Scan archive for strategic assets..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-navy-light/20 border border-gold/5 rounded-lg focus:ring-1 focus:ring-gold/20 focus:border-gold/30 text-xs text-pearl transition-all outline-none placeholder:text-gold-light/10 italic"
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-24">
          <Sparkles className="w-8 h-8 text-gold animate-spin mx-auto mb-4 opacity-20" />
          <span className="text-gold-light/30 italic">Unlocking intelligence library...</span>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center py-24 text-gold-light/30 italic">No intelligence matching these markers found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMaterials.map((material, i) => (
            <motion.div 
              key={material.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="luxury-card overflow-hidden group cursor-pointer border-gold/10 hover:border-gold/40 flex flex-col min-h-[160px]"
              onClick={() => setSelectedMaterial(material)}
            >
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-gold/5 rounded-xl border border-gold/10 group-hover:bg-gold/10 group-hover:border-gold/30 transition-all shadow-lg">
                    {React.cloneElement(getIcon(material.category) as React.ReactElement<any>, { className: 'w-4 h-4 text-gold' })}
                  </div>
                  <span className="px-2 py-0.5 bg-gold/10 text-gold text-[7px] font-black rounded border border-gold/20 uppercase tracking-widest italic">
                    {material.category}
                  </span>
                </div>
                <h3 className="text-sm font-black text-pearl group-hover:text-gold transition-colors tracking-tight mb-1 uppercase italic">{material.title}</h3>
                <p className="text-[9px] text-gold-light/30 font-bold mb-4 line-clamp-2 leading-relaxed italic">"{material.description}"</p>
              </div>
              
              <div className="px-4 py-2 bg-gold/5 border-t border-gold/5 flex items-center justify-between group-hover:bg-gold/10 transition-all">
                <span className="text-[8px] font-black text-gold/40 uppercase tracking-widest">Access Asset</span>
                <div className="w-4 h-4 rounded-full border border-gold/10 flex items-center justify-center text-gold group-hover:translate-x-1 transition-transform text-[10px]">
                  &rarr;
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Material Detail Modal */}
      <AnimatePresence>
        {selectedMaterial && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-6 text-white">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMaterial(null)}
              className="absolute inset-0 bg-navy/90 backdrop-blur-xl" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="luxury-card w-full max-w-4xl max-h-[85vh] overflow-hidden relative z-10 border-gold/30 shadow-[0_0_50px_rgba(212,175,55,0.1)] flex flex-col"
            >
              <div className="px-8 py-6 border-b border-gold/10 flex justify-between items-center bg-gold/5">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-gold/10 rounded-xl border border-gold/20">
                    {getIcon(selectedMaterial.category)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-pearl tracking-tight">{selectedMaterial.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                      <span className="text-[10px] text-gold font-black uppercase tracking-[0.2em]">{selectedMaterial.category}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedMaterial(null)} className="p-2 rounded-full hover:bg-gold/10 text-gold-light/40 hover:text-gold transition-all">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="p-10 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
                {selectedMaterial.description && (
                  <div>
                    <h4 className="flex items-center gap-2 text-[10px] font-black text-gold/60 uppercase tracking-[0.3em] mb-4">
                      <Layers className="w-3 h-3" /> Briefing Summary
                    </h4>
                    <p className="text-gold-light/80 text-lg leading-relaxed font-medium italic">"{selectedMaterial.description}"</p>
                  </div>
                )}

                {selectedMaterial.content && (
                  <div>
                    <h4 className="flex items-center gap-2 text-[10px] font-black text-gold/60 uppercase tracking-[0.3em] mb-4">
                      <FileText className="w-3 h-3" /> Document Intelligence
                    </h4>
                    <div className="bg-navy-light/40 p-8 rounded-2xl border border-gold/10 whitespace-pre-wrap text-pearl/80 font-mono text-sm leading-8 shadow-inner">
                      {selectedMaterial.content}
                    </div>
                  </div>
                )}

                {selectedMaterial.fileUrl && (
                  <div className="pt-4">
                    <motion.a 
                      whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(212,175,55,0.2)' }}
                      whileTap={{ scale: 0.98 }}
                      href={selectedMaterial.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-3 luxury-button text-xs py-4 px-8"
                    >
                      <Globe className="w-4 h-4" /> 
                      <span className="tracking-widest uppercase">Launch External Resource</span>
                      <Download className="w-4 h-4 ml-2" />
                    </motion.a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

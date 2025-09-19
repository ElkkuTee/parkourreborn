import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

export default function AdminModal({ isOpen, onClose, onTechsUpdate }) {
  const [activeTab, setActiveTab] = useState('add');
  const [techs, setTechs] = useState([]);
  const [selectedTech, setSelectedTech] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 1,
    tags: '',
    aka: '',
    videoUrl: ''
  });

  useEffect(() => {
    if (isOpen && activeTab === 'edit') {
      fetchTechs();
    }
  }, [isOpen, activeTab]);

  const fetchTechs = async () => {
    try {
      const response = await fetch('/api/techs');
      const data = await response.json();
      setTechs(data.data || []);
    } catch (error) {
      console.error('Error fetching techs:', error);
    }
  };

  const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getAuthToken();
      const isEdit = activeTab === 'edit' && selectedTech;
      
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        aka: formData.aka.split(',').map(a => a.trim()).filter(a => a),
        ...(isEdit && { id: selectedTech.id })
      };

      const response = await fetch('/api/admin/techs', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to save tech');

      alert(`Tech ${isEdit ? 'updated' : 'created'} successfully!`);
      setFormData({ name: '', description: '', difficulty: 1, tags: '', aka: '', videoUrl: '' });
      setSelectedTech(null);
      onTechsUpdate?.();
      
      if (activeTab === 'edit') fetchTechs();
      
    } catch (error) {
      console.error('Error saving tech:', error);
      alert(`Failed to ${activeTab === 'edit' ? 'update' : 'create'} tech: ${error.message}`);
    }
  };

  const handleEdit = (tech) => {
    setSelectedTech(tech);
    setFormData({
      name: tech.name || '',
      description: tech.description || '',
      difficulty: tech.difficulty || 1,
      tags: (tech.tags || []).join(', '),
      aka: (tech.aka || []).join(', '),
      videoUrl: tech.videoUrl || ''
    });
  };

  const handleDelete = async (techId) => {
    if (!confirm('Are you sure you want to delete this tech?')) return;
    
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`/api/admin/techs?id=${techId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete tech');

      alert('Tech deleted successfully!');
      fetchTechs();
      onTechsUpdate?.();
      
    } catch (error) {
      console.error('Error deleting tech:', error);
      alert(`Failed to delete tech: ${error.message}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative bg-white dark:bg-pr-dark p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-pr-neon transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Panel</h2>
              
              {/* Tabs */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setActiveTab('add')}
                  className={`px-4 py-2 rounded-md ${activeTab === 'add' ? 'bg-pr-neon text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Add Tech
                </button>
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-4 py-2 rounded-md ${activeTab === 'edit' ? 'bg-pr-neon text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Edit/Delete Techs
                </button>
              </div>

              {/* Add/Edit Form */}
              {(activeTab === 'add' || selectedTech) && (
                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      rows="3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.difficulty}
                        onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video URL</label>
                      <input
                        type="url"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                        placeholder="gearless, magrail, grappler"
                        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alternative Names (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.aka}
                        onChange={(e) => setFormData({...formData, aka: e.target.value})}
                        placeholder="Long Jump Boost, LJB"
                        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-pr-neon text-white rounded-md hover:opacity-90"
                    >
                      {selectedTech ? 'Update Tech' : 'Add Tech'}
                    </button>
                    
                    {selectedTech && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTech(null);
                          setFormData({ name: '', description: '', difficulty: 1, tags: '', aka: '', videoUrl: '' });
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:opacity-90"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Tech List for Editing */}
              {activeTab === 'edit' && !selectedTech && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select a tech to edit:</h3>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {techs.map(tech => (
                      <div key={tech.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{tech.name}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">Difficulty: {tech.difficulty}</span>
                        </div>
                        <div className="space-x-2">
                          <button
                            onClick={() => handleEdit(tech)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:opacity-90"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tech.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-md hover:opacity-90"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
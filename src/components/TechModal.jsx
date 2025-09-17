import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const TechModal = ({ tech, isOpen, onClose }) => {
  const [requesting, setRequesting] = useState(false);

  if (!tech) return null;

  const handleHelpRequest = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Please login first');
      return;
    }

    try {
      setRequesting(true);
      const message = prompt('Add an optional message for your help request:');
      if (message === null) {
        setRequesting(false);
        return; // User cancelled the prompt
      }
      
      console.log('Sending help request:', { tech: tech.name, message });

      const response = await fetch('/api/send-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          techId: tech.name,
          message
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send help request');
      }

      alert('Help request sent successfully!');
    } catch (error) {
      console.error('Help request error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to send help request: ${errorMessage}`);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Flex Container for Centering */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative bg-pr-dark p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-pr-neon transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Title */}
              <h2 className="text-2xl font-bold text-pr-neon mb-4">
                {tech.name}
              </h2>

              {/* Video */}
              <div className="aspect-w-16 aspect-h-9 mb-4">
                {tech.videoUrl ? (
                  <iframe
                    src={tech.videoUrl}
                    className="w-full h-full rounded"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center">
                    <span className="text-gray-400">No video available</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-300 mb-6">{tech.description}</p>

              {/* Bottom row */}
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {tech.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-gray-800 text-pr-neon rounded-full shadow-sm"
                    >
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </span>
                  ))}
                </div>
                <span className="text-pr-neon ml-4">
                  Difficulty {tech.difficulty}
                </span>
              </div>

              {/* Request Help Button */}
              <button
                onClick={handleHelpRequest}
                disabled={requesting}
                className="mt-4 px-4 py-2 bg-pr-neon text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {requesting ? 'Sending...' : 'Request Help'}
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TechModal;
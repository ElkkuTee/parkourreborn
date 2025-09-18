import React from "react";
import TechCard from "./TechCard";

export default function TechList({ techs = [], loading, onTechClick }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg h-48"
          />
        ))}
      </div>
    );
  }

  if (!techs.length) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        <p>No techs found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {techs.map((tech) => (
        <TechCard 
          key={tech.id} 
          tech={tech} 
          onClick={() => onTechClick(tech)} 
        />
      ))}
    </div>
  );
}
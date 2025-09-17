import React from "react";
import TechCard from "./TechCard";

const TechList = ({ techs, onTechClick }) => {
  if (techs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-lg">No techs found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {techs.map(tech => (
        <TechCard 
          key={tech.id}
          tech={tech}
          onTechClick={onTechClick} 
        />
      ))}
    </div>
  );
};

export default TechList;
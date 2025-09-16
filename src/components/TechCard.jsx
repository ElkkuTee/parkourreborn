import React from "react";

export default function TechCard({ tech }) {
  return (
    <div
      className="bg-gray-900 border-2 border-pr-neon rounded-2xl p-5 shadow-md 
                 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-pr-neon/70 cursor-pointer"
    >
      {/* Tech Name */}
      <h3 className="text-pr-neon text-xl font-extrabold mb-2 drop-shadow-lg">
        {tech.name}
      </h3>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-4">{tech.description}</p>

      {/* Tags and Difficulty */}
      <div className="flex justify-between items-center">
        {/* Tags */}
        <div className="flex gap-2 flex-wrap">
          {tech.tags?.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-800 text-pr-neon rounded-full shadow-sm"
            >
              {tag.charAt(0).toUpperCase() + tag.slice(1)}
            </span>
          ))}
        </div>

        {/* Difficulty */}
        <span className="text-white text-sm font-medium">
          Difficulty {tech.difficulty}
        </span>
      </div>
    </div>
  );
}

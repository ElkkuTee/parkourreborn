import React from "react";
import TechCard from "./TechCard";

export default function TechList({ techs }) {
  if (techs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-lg">No techs found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {techs.map(tech => (
        <TechCard key={tech.id} tech={tech} />
      ))}
    </div>
  );
}
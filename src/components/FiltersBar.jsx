import React, { useState, useRef, useEffect } from "react";

export default function FiltersBar({ search, setSearch, tags, setTags, sort, setSort }) {
  const tagOptions = ["gearless", "magrail", "grappler"];
  const dropdownOptions = [
    { label: "A–Z", value: "az" },
    { label: "Z–A", value: "za" },
    { label: "Difficulty Low–High", value: "diff_asc" },
    { label: "Difficulty High–Low", value: "diff_desc" },
  ];

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTag = (tag) => {
    const newTags = new Set(tags);
    newTags.has(tag) ? newTags.delete(tag) : newTags.add(tag);
    setTags(newTags);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 p-4">
      {/* Search Bar */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search techs..."
        className="flex-1 p-3 rounded-full bg-gray-800 text-white placeholder-gray-400 border border-gray-700
                   focus:outline-none focus:ring-2 focus:ring-pr-neon focus:border-pr-neon transition-all duration-300
                   hover:ring-pr-neon/50"
      />

      {/* Tag Buttons */}
      <div className="flex gap-3 mt-2 md:mt-0">
        {tagOptions.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-4 py-2 rounded-full font-medium cursor-pointer select-none 
                        transition-all duration-300 transform
                        ${tags.has(tag)
                          ? "bg-pr-neon text-gray-900 shadow-lg scale-105"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-105"}`}
          >
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </button>
        ))}
      </div>

      {/* Custom Dropdown */}
      <div className="relative mt-2 md:mt-0 w-48" ref={dropdownRef}>
        <div
          className="cursor-pointer p-3 rounded-full bg-gray-800 text-white border-2 border-gray-700
                     flex justify-between items-center transition-all duration-300 hover:border-pr-neon"
          onClick={() => setOpen(!open)}
        >
          {dropdownOptions.find((o) => o.value === sort)?.label || "Sort"}
          <svg
            className={`w-5 h-5 text-pr-neon transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {open && (
          <div className="absolute mt-2 w-full bg-gray-900 border-2 border-pr-neon rounded-2xl shadow-lg z-50">
            {dropdownOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  setSort(opt.value);
                  setOpen(false);
                }}
                className="px-4 py-2 cursor-pointer hover:bg-pr-neon hover:text-gray-900 transition-colors duration-200 rounded-xl"
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
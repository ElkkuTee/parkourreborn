import React, { useEffect, useState } from "react";
import FiltersBar from "./components/FiltersBar";
import TechList from "./components/TechList";
import ThemeSwitch from "./components/ThemeSwitch";
import TechModal from "./components/TechModal";
import DiscordLogin from "./components/DiscordLogin";

function App() {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState(new Set());
  const [sort, setSort] = useState("az");
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("theme") || "blue";
  });
  const [selectedTech, setSelectedTech] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTechs = async () => {
    setLoading(true);
    try {
      let query = [];
      if (search) query.push(`search=${encodeURIComponent(search)}`);
      if (tags.size > 0) query.push(`tags=${[...tags].join(",")}`);
      if (sort) query.push(`sort=${sort}`);
      const queryString = query.length ? "?" + query.join("&") : "";

      const res = await fetch(`/api/techs${queryString}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setTechs(data.data || []);
    } catch (error) {
      console.error("Error fetching techs:", error);
      setTechs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechs();
  }, [search, tags, sort]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
  };

  const handleTechClick = (tech) => {
    setSelectedTech(tech);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTech(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-pr-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Parkour Reborn Techs
          </h1>
          <div className="flex items-center gap-4">
            <DiscordLogin />
            <ThemeSwitch
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
            />
          </div>
        </div>

        <FiltersBar
          search={search}
          setSearch={setSearch}
          tags={tags}
          setTags={setTags}
          sort={sort}
          setSort={setSort}
        />

        {loading ? (
          <div className="text-center py-8">
            <p className="text-lg">Loading...</p>
          </div>
        ) : (
          <TechList techs={techs} onTechClick={handleTechClick} />
        )}

        <TechModal
          tech={selectedTech}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
}

export default App;
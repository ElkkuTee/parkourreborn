import React, { useEffect, useState } from "react";
import FiltersBar from "./components/FiltersBar";
import TechList from "./components/TechList";
import ThemeSwitch from "./components/ThemeSwitch";
import TechModal from "./components/TechModal";
import DiscordLogin from "./components/DiscordLogin";
import HamburgerMenu from "./components/HamburgerMenu";
import SettingsModal from "./components/SettingsModal.jsx";
import AccountModal from "./components/AccountModal";

function App() {
  // Tech list state
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState(new Set());
  const [sort, setSort] = useState("az");
  const [selectedTech, setSelectedTech] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Navigation and modal state
  const [currentPage, setCurrentPage] = useState("techs");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  // Fetch techs data
  useEffect(() => {
    const fetchTechs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (tags.size) params.append("tags", Array.from(tags).join(","));
        if (sort) params.append("sort", sort);

        const response = await fetch(`/api/techs?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch techs");

        const data = await response.json();
        setTechs(data || []); // Ensure we always have an array
        setError(null);
      } catch (err) {
        console.error("Error fetching techs:", err);
        setError(err.message);
        setTechs([]); // Reset to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchTechs();
  }, [search, tags, sort]);

  // Handle page changes for modals
  useEffect(() => {
    if (currentPage === "settings") {
      setIsSettingsOpen(true);
      setCurrentPage("techs");
    } else if (currentPage === "account") {
      setIsAccountOpen(true);
      setCurrentPage("techs");
    }
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-white dark:bg-pr-dark">
      <HamburgerMenu
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Main Content */}
        {currentPage === "techs" && (
          <>
            <FiltersBar
              search={search}
              setSearch={setSearch}
              tags={tags}
              setTags={setTags}
              sort={sort}
              setSort={setSort}
            />
            {error ? (
              <div className="text-center py-8 text-red-600 dark:text-red-400">
                <p>{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-pr-neon text-white rounded-md hover:opacity-90"
                >
                  Retry
                </button>
              </div>
            ) : (
              <TechList
                techs={techs}
                loading={loading}
                onTechClick={(tech) => {
                  setSelectedTech(tech);
                  setIsModalOpen(true);
                }}
              />
            )}
          </>
        )}
        {currentPage === "contributions" && (
          <div className="text-center py-20 text-gray-600 dark:text-gray-400">
            <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
            <p>Support and contribution options will be available here.</p>
          </div>
        )}
        {currentPage === "about" && (
          <div className="text-center py-20 text-gray-600 dark:text-gray-400">
            <h2 className="text-2xl font-bold mb-4">About PR Techs</h2>
            <p>Project information and details coming soon.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedTech && (
        <TechModal
          tech={selectedTech}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTech(null);
          }}
        />
      )}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={currentTheme}
        setCurrentTheme={setCurrentTheme}
      />
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
      />
    </div>
  );
}

export default App;
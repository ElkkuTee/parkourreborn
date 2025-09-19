import React, { useEffect, useState } from "react";
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import FiltersBar from "./components/FiltersBar";
import TechList from "./components/TechList";
import ThemeSwitch from "./components/ThemeSwitch";
import TechModal from "./components/TechModal";
import DiscordLogin from "./components/DiscordLogin";
import HamburgerMenu from "./components/HamburgerMenu";
import SettingsModal from "./components/SettingsModal";
import AccountModal from "./components/AccountModal";
import AdminModal from "./components/AdminModal";

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
  const [currentPage, setCurrentPage] = useState("techs");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Handle Discord OAuth token processing on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const customToken = params.get('token');
    
    if (customToken) {
      // Clean URL immediately
      window.history.replaceState({}, document.title, '/');
      handleCustomToken(customToken);
    }
  }, []);

  const handleCustomToken = async (customToken) => {
    try {
      console.log('Processing Discord OAuth token...');
      
      const auth = getAuth();
      const userCredential = await signInWithCustomToken(auth, customToken);
      console.log('Discord authentication successful');
      
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('auth_token', idToken);
      
      // Set up token refresh
      setInterval(async () => {
        const user = auth.currentUser;
        if (user) {
          const newToken = await user.getIdToken(true);
          localStorage.setItem('auth_token', newToken);
        }
      }, 3600000); // Refresh token every hour
      
    } catch (error) {
      console.error('Discord authentication error:', error);
      alert(`Authentication failed: ${error.message}`);
    }
  };

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

  // Watch for page changes to handle modals
  useEffect(() => {
    if (currentPage === "settings") {
      setIsSettingsOpen(true);
      setCurrentPage("techs");
    } else if (currentPage === "account") {
      setIsAccountOpen(true);
      setCurrentPage("techs");
    } else if (currentPage === "admin") {
      setIsAdminOpen(true);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pr-neon to-blue-400 bg-clip-text text-transparent animate-pulse drop-shadow-lg mb-4">
            Parkour Reborn Techs
          </h1>
        </div>

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

            {loading ? (
              <div className="text-center py-8">
                <p className="text-lg text-white dark:text-white">Loading...</p>
              </div>
            ) : (
              <TechList techs={techs} onTechClick={handleTechClick} />
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

        <TechModal
          tech={selectedTech}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />

        {/* Modals */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
        />
        <AccountModal
          isOpen={isAccountOpen}
          onClose={() => setIsAccountOpen(false)}
        />
        <AdminModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          onTechsUpdate={fetchTechs}
        />
      </div>
    </div>
  );
}

export default App;

import React, { useEffect, useState } from "react";
import FiltersBar from "./components/FiltersBar";
import TechList from "./components/TechList";

function App() {
  const [techs, setTechs] = useState([]);
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState(new Set());
  const [sort, setSort] = useState("az");

  const fetchTechs = async () => {
    // Build query params
    let query = [];
    if (search) query.push(`search=${encodeURIComponent(search)}`);
    if (tags.size > 0) query.push(`tags=${[...tags].join(",")}`);
    if (sort) query.push(`sort=${sort}`);
    const queryString = query.length ? "?" + query.join("&") : "";

    const res = await fetch(`/api/techs${queryString}`);
    const data = await res.json();
    setTechs(data.data);
  };

  useEffect(() => {
    fetchTechs();
  }, [search, tags, sort]);

  return (
    <div className="min-h-screen bg-pr-dark text-white p-6">
      <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pr-neon to-blue-400 bg-clip-text text-transparent animate-pulse drop-shadow-lg mb-4">Parkour Reborn Techs</h1>
      <FiltersBar search={search} setSearch={setSearch} tags={tags} setTags={setTags} sort={sort} setSort={setSort} />
      {loading ? <p>Loading...</p> : <TechList techs={techs} />}
    </div>
  );
}

export default App;
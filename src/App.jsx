import { useEffect, useState } from "react";
import FiltersBar from "./components/FiltersBar";
import TechList from "./components/TechList";
import { fetchTechs } from "./api";

export default function App() {
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState(new Set());
  const [sort, setSort] = useState("");
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    const load = async () => {
      setLoading(true);
      const data = await fetchTechs({
        search,
        sort,
        tags: tags.size ? Array.from(tags).join(",") : undefined
      });
      setTechs(data);
      setLoading(false);
    };
    const id = setTimeout(load, 250); // debounce
    return ()=>clearTimeout(id);
  }, [search, tags, sort]);

  return (
    <div className="min-h-screen bg-pr-dark text-white p-6">
      <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pr-neon to-blue-400 bg-clip-text text-transparent animate-pulse drop-shadow-lg mb-4">Parkour Reborn Techs</h1>
      <FiltersBar search={search} setSearch={setSearch} tags={tags} setTags={setTags} sort={sort} setSort={setSort} />
      {loading ? <p>Loading...</p> : <TechList techs={techs} />}
    </div>
  );
}

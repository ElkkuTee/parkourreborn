import TechCard from "./TechCard";

export default function TechList({ techs }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {techs.map(t => <TechCard key={t.id} tech={t} />)}
    </div>
  );
}

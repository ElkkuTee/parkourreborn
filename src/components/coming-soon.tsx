import { images } from "@/lib/assets";

type ComingSoonProps = {
  title?: string;
};

export default function ComingSoon({ title = 'Coming soon' }: ComingSoonProps) {
  return (
    <section className="coming-soon">
      <span>{title}</span>
      <h2>Release date: Tomorrow</h2>
      <small>twk</small>
      <img src={images.elements.memes.comingson} alt="COMING SON 😭" width={300} height={300}></img>
    </section>
  );
}

import { images } from "@/lib/assets";

type ComingSoonProps = {
  title?: string;
};

export default function ComingSoon({ title = 'Coming soon' }: ComingSoonProps) {
  return (
    <section className="coming-soon">
      <span>{title}</span>
      <h2>Release date: June 4th</h2>
      <small>of 2027</small>
      <img src={images.elements.memes.comingson} alt="COMING SON 😭" width={300} height={300}></img>
    </section>
  );
}

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
      <section className="memes">
        <img src={images.memes.elonstreamsreborn} alt="elonstreamsreborn" width={300} height={300}></img>
      </section>
      <small>For legal reasons, the release date is not actually tomorrow.</small>
    </section>
  );
}

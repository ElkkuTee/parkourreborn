type PageHeroProps = {
  title: string;
  image: string;
};

export default function PageHero({ title, image }: PageHeroProps) {
  return (
    <header className="page-hero">
      <span className="page-hero__image" style={{ backgroundImage: `url(${image})` }} />
      <span className="page-hero__shade" />
      <div className="page-hero__content">
        <h1>{title}</h1>
      </div>
    </header>
  );
}

type PageHeroProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  image: string;
  className?: string;
};

export default function PageHero({ title, eyebrow, description, image, className = '' }: PageHeroProps) {
  return (
    <header className={`page-hero ${className}`}>
      <span className="page-hero__image" style={{backgroundImage: `url(${image})`}} />
      <span className="page-hero__shade" />
      <div className="page-hero__content">
        {eyebrow ? <p>{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <span>{description}</span> : null}
      </div>
    </header>
  );
}

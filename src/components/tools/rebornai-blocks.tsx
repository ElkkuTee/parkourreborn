'use client';

import RichText from '@/components/tools/rebornai-text';
import { images } from '@/lib/assets';
import { kindLabels, parseStep, previewKind, youtubeEmbedUrl } from '@/lib/pages/techlist';
import type { AssistantBlock } from '@/lib/reborn-ai/types';

type BlockProps = {
  block: AssistantBlock;
};

const medals = [
  [images.elements.timetrials.bronze, 'bronze'],
  [images.elements.timetrials.silver, 'silver'],
  [images.elements.timetrials.gold, 'gold'],
  [images.elements.timetrials.platinum, 'platinum'],
] as const;

function Media({ url, title }: { url: string; title?: string }) {
  const embed = youtubeEmbedUrl(url);
  if (embed) return <iframe src={embed} title={title || 'Video'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;

  const kind = previewKind(url);
  if (kind === 'image') return <img src={url} alt={title || ''} loading="lazy" />;
  return <video src={url} controls playsInline preload="metadata" />;
}

function TechBlock({ block }: { block: Extract<AssistantBlock, { type: 'tech' }> }) {
  const steps = block.steps.map(parseStep).filter((step) => !step.add);

  return (
    <div className="ai-card">
      <header className="ai-card__head">
        <span>{kindLabels[block.kind]}</span>
        <strong>{block.name}</strong>
        {block.aliases.length ? <small>{block.aliases.join(', ')}</small> : null}
      </header>

      {steps.length ? (
        <div className="ai-steps">
          {steps.map((step, index) => (
            <span className="ai-step-wrap" key={`${step.label}-${index}`}>
              <span className={`ai-step${step.optional ? ' is-optional' : ''}`}>{step.label}{step.optional ? <b aria-hidden="true">*</b> : null}</span>
              {index < steps.length - 1 ? <span className="ai-step-arrow" aria-hidden="true">&rarr;</span> : null}
            </span>
          ))}
        </div>
      ) : null}

      {block.videoUrl ? <div className="ai-media"><Media url={block.videoUrl} title={block.name} /></div> : null}
      {block.tutorialUrl ? <a className="ai-card__link" href={block.tutorialUrl} target="_blank" rel="noopener noreferrer">Tutorial</a> : null}
    </div>
  );
}

function TrialBlock({ block }: { block: Extract<AssistantBlock, { type: 'time_trial' }> }) {
  const times = [block.bronze, block.silver, block.gold, block.platinum];

  return (
    <div className="ai-card">
      <header className="ai-card__head">
        <span>{block.district}</span>
        <strong>{block.name}</strong>
        <small>{block.difficulty}</small>
      </header>

      <div className="ai-medals">
        {medals.map(([icon, label], index) => (
          <span className="ai-medal" key={label}>
            <span className="ai-medal__icon" style={{ backgroundImage: `url(${icon})` }} aria-hidden="true" />
            <strong>{times[index]}</strong>
          </span>
        ))}
      </div>

      {block.videoUrl ? <div className="ai-media"><Media url={block.videoUrl} title={block.name} /></div> : null}
    </div>
  );
}

function RecordBlock({ block }: { block: Extract<AssistantBlock, { type: 'world_record' }> }) {
  return (
    <div className="ai-card ai-card--wr">
      <header className="ai-card__head">
        <span>World Record</span>
        <strong>{block.trial}</strong>
      </header>

      <div className="ai-wr">
        <span className="ai-wr__icon" style={{ backgroundImage: `url(${images.elements.timetrials.worldrecord})` }} aria-hidden="true" />
        <div>
          <strong>{block.time}</strong>
          <small>{block.player}</small>
        </div>
        {block.wasansScore ? <span className="ai-wr__score">{block.wasansScore}<small>Wasans</small></span> : null}
      </div>

      {block.videoUrl ? <div className="ai-media"><Media url={block.videoUrl} title={`${block.trial} world record`} /></div> : null}
      {block.submissionUrl ? <a className="ai-card__link" href={block.submissionUrl} target="_blank" rel="noopener noreferrer">View submission</a> : null}
    </div>
  );
}

function RecipeBlock({ block }: { block: Extract<AssistantBlock, { type: 'recipe' }> }) {
  return (
    <div className="ai-card">
      <header className="ai-card__head">
        <span>Recipe</span>
        <strong>{block.item}</strong>
      </header>

      <div className="ai-recipe">
        <span className="ai-recipe__row ai-recipe__row--head">
          <span>Item</span>
          <span>Qty</span>
        </span>
        {block.items.map((item, index) => (
          <span className="ai-recipe__row" key={`${item.name}-${index}`}>
            <span>{item.name}</span>
            <span>{item.quantity}</span>
          </span>
        ))}
      </div>

      {block.layout.length ? (
        <div className="ai-layout">
          {block.layout.map((row, index) => <span key={`${row}-${index}`}>{row}</span>)}
        </div>
      ) : null}
    </div>
  );
}

function Block({ block }: BlockProps) {
  if (block.type === 'text') return <div className="ai-text"><RichText value={block.content} /></div>;

  if (block.type === 'link') {
    return (
      <a className="ai-link" href={block.url} target="_blank" rel="noopener noreferrer">
        <strong>{block.title}</strong>
        <small>{block.url}</small>
      </a>
    );
  }

  if (block.type === 'image' || block.type === 'gif') {
    const alt = block.type === 'image' ? block.alt ?? '' : block.title ?? '';

    return (
      <a className="ai-media ai-media--still" href={block.url} target="_blank" rel="noopener noreferrer">
        <img src={block.url} alt={alt} loading="lazy" />
      </a>
    );
  }

  if (block.type === 'video') return <div className="ai-media"><Media url={block.url} title={block.title} /></div>;
  if (block.type === 'tech') return <TechBlock block={block} />;
  if (block.type === 'time_trial') return <TrialBlock block={block} />;
  if (block.type === 'world_record') return <RecordBlock block={block} />;
  return <RecipeBlock block={block} />;
}

export default function Blocks({ blocks }: { blocks: AssistantBlock[] }) {
  if (!blocks.length) return null;

  return (
    <div className="ai-blocks">
      {blocks.map((block, index) => <Block block={block} key={`${block.type}-${index}`} />)}
    </div>
  );
}

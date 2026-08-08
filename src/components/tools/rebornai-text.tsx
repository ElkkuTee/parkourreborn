'use client';

import { cleanReply, splitInline } from '@/lib/reborn-ai/text';

function Line({ value }: { value: string }) {
  return (
    <>
      {splitInline(value).map((part, index) => {
        if (part.style === 'strong') return <strong key={index}>{part.text}</strong>;
        if (part.style === 'em') return <em key={index}>{part.text}</em>;
        if (part.style === 'code') return <code key={index}>{part.text}</code>;
        return <span key={index}>{part.text}</span>;
      })}
    </>
  );
}

export default function RichText({ value }: { value: string }) {
  const paragraphs = cleanReply(value).split(/\n{2,}/).map((text) => text.trim()).filter(Boolean);

  return (
    <>
      {paragraphs.map((text, index) => <p key={index}><Line value={text} /></p>)}
    </>
  );
}

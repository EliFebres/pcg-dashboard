'use client';

import React from 'react';
import DOMPurify from 'dompurify';

interface RichTextDisplayProps {
  html: string;
  className?: string;
}

const RichTextDisplay: React.FC<RichTextDisplayProps> = ({ html, className = '' }) => {
  // Plain-text notes (pre-rich-text) are stored without HTML tags.
  // Detect by checking for a leading '<' — TipTap always wraps content in block tags.
  const isHtml = html.trimStart().startsWith('<');

  if (!isHtml) {
    return (
      <p className={`text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed ${className}`}>
        {html}
      </p>
    );
  }

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 's'],
    ALLOWED_ATTR: [],
  });

  return (
    <div
      className={`text-sm text-zinc-200 leading-relaxed
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
        [&_li]:my-0.5
        [&_li>ul]:mt-1 [&_li>ul]:list-[circle]
        [&_li>ol]:mt-1
        [&_p]:leading-relaxed [&_p+p]:mt-1
        [&_strong]:font-semibold [&_strong]:text-white
        [&_em]:italic
        [&_code]:font-mono [&_code]:text-xs [&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:rounded
        [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-600 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-400
        ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
};

export default RichTextDisplay;

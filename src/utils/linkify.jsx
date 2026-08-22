import React from 'react';

// URL & Korean phone number matching regex
export const LINKIFY_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|0\d{1,2}-?\d{3,4}-?\d{4})/gi;

export function renderWithLinks(text) {
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  let match;

  // Reset regex index
  LINKIFY_RE.lastIndex = 0;

  while ((match = LINKIFY_RE.exec(text)) !== null) {
    const matchedText = match[0];
    const matchIndex = match.index;

    // Push preceding text segment
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    if (matchedText.startsWith('http://') || matchedText.startsWith('https://') || matchedText.startsWith('www.')) {
      const href = matchedText.startsWith('www.') ? `https://${matchedText}` : matchedText;
      parts.push(
        <a
          key={matchIndex}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#3F7A63', textDecoration: 'underline', wordBreak: 'break-all' }}
          onClick={(e) => e.stopPropagation()}
        >
          {matchedText}
        </a>
      );
    } else if (matchedText.startsWith('0')) {
      const tel = matchedText.replace(/[^0-9]/g, '');
      parts.push(
        <a
          key={matchIndex}
          href={`tel:${tel}`}
          style={{ color: '#3F7A63', textDecoration: 'underline', fontWeight: 500 }}
          onClick={(e) => e.stopPropagation()}
        >
          {matchedText}
        </a>
      );
    } else {
      parts.push(matchedText);
    }

    lastIndex = matchIndex + matchedText.length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

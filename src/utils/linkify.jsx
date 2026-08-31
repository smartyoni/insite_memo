import React from 'react';

// URL & Korean phone number matching regex
export const LINKIFY_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|0\d{1,2}-?\d{3,4}-?\d{4})/gi;

export function renderWithLinks(text, searchQuery = '') {
  if (!text) return null;

  const renderHighlightedSegment = (str, keyPrefix) => {
    if (!searchQuery || !searchQuery.trim() || typeof str !== 'string') return str;
    const q = searchQuery.trim();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const segs = str.split(new RegExp(`(${escaped})`, 'gi'));
    return segs.map((seg, idx) =>
      seg.toLowerCase() === q.toLowerCase() ? (
        <mark
          key={`${keyPrefix}_hl_${idx}`}
          style={{
            backgroundColor: '#FDE047',
            color: '#854D0E',
            padding: '0 2px',
            borderRadius: '3px',
            fontWeight: 700
          }}
        >
          {seg}
        </mark>
      ) : (
        seg
      )
    );
  };

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
      const prevStr = text.slice(lastIndex, matchIndex);
      parts.push(renderHighlightedSegment(prevStr, `prev_${lastIndex}`));
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
          {renderHighlightedSegment(matchedText, `link_${matchIndex}`)}
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
          {renderHighlightedSegment(matchedText, `tel_${matchIndex}`)}
        </a>
      );
    } else {
      parts.push(renderHighlightedSegment(matchedText, `text_${matchIndex}`));
    }

    lastIndex = matchIndex + matchedText.length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    const restStr = text.slice(lastIndex);
    parts.push(renderHighlightedSegment(restStr, `rest_${lastIndex}`));
  }

  return parts.length > 0 ? parts : renderHighlightedSegment(text, 'root');
}

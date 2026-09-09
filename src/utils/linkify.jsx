import React from 'react';

// Markdown link [title](url) OR URL & Korean phone number matching regex
export const LINKIFY_RE = /(?:\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s]+|www\.[^\s]+|0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}))/gi;

// Helper to check if a URL is an internal app deep-link
export function isInternalAppLink(url) {
  if (!url) return false;
  if (url.startsWith('#') || url.includes('#tab=') || url.includes('#cat=')) return true;
  try {
    if (typeof window !== 'undefined') {
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin === window.location.origin && (parsed.hash.includes('tab=') || parsed.hash.includes('cat='))) {
        return true;
      }
    }
  } catch (e) {}
  return false;
}

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
    const mdTitle = match[1];
    const mdUrl = match[2];
    const rawMatch = match[3];

    // Push preceding text segment
    if (matchIndex > lastIndex) {
      const prevStr = text.slice(lastIndex, matchIndex);
      parts.push(renderHighlightedSegment(prevStr, `prev_${lastIndex}`));
    }

    if (mdTitle && mdUrl) {
      // Markdown link [title](url) -> Vivid blue text with underline, no emoji
      const isInternal = isInternalAppLink(mdUrl);
      parts.push(
        <a
          key={`md_${matchIndex}`}
          href={mdUrl}
          target={isInternal ? '_self' : '_blank'}
          rel={isInternal ? undefined : 'noopener noreferrer'}
          title={isInternal ? `${mdTitle} (클릭하여 해당 목록으로 이동)` : `${mdTitle} (${mdUrl})`}
          style={{
            color: '#2563EB',
            fontWeight: 600,
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            cursor: 'pointer',
            transition: 'color 0.15s ease'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isInternal) {
              e.preventDefault();
              window.dispatchEvent(
                new CustomEvent('app-navigate-hash', {
                  detail: { url: mdUrl, title: mdTitle }
                })
              );
            }
          }}
        >
          {renderHighlightedSegment(mdTitle, `link_${matchIndex}`)}
        </a>
      );
    } else if (rawMatch) {
      if (rawMatch.startsWith('http://') || rawMatch.startsWith('https://') || rawMatch.startsWith('www.')) {
        const href = rawMatch.startsWith('www.') ? `https://${rawMatch}` : rawMatch;
        const isInternal = isInternalAppLink(href);
        parts.push(
          <a
            key={`raw_${matchIndex}`}
            href={href}
            target={isInternal ? '_self' : '_blank'}
            rel={isInternal ? undefined : 'noopener noreferrer'}
            style={{
              color: '#2563EB',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              fontWeight: 600,
              wordBreak: 'break-all',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isInternal) {
                e.preventDefault();
                window.dispatchEvent(
                  new CustomEvent('app-navigate-hash', {
                    detail: { url: href }
                  })
                );
              }
            }}
          >
            {renderHighlightedSegment(rawMatch, `link_${matchIndex}`)}
          </a>
        );
      } else if (rawMatch.startsWith('0')) {
        const tel = rawMatch.replace(/[^0-9]/g, '');
        parts.push(
          <a
            key={`sms_${matchIndex}`}
            href={`sms:${tel}`}
            title={`${rawMatch} SMS 문자 보내기`}
            style={{ color: '#059669', textDecoration: 'underline', textUnderlineOffset: '3px', fontWeight: 600, cursor: 'pointer' }}
            onClick={(e) => e.stopPropagation()}
          >
            {renderHighlightedSegment(rawMatch, `sms_${matchIndex}`)}
          </a>
        );
      } else {
        parts.push(renderHighlightedSegment(rawMatch, `text_${matchIndex}`));
      }
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

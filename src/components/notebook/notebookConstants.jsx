import React from 'react';
import { styles } from './notebookStyles';

export const autoFormatPhoneNumber = (val) => {
  if (!val) return '';
  const raw = val.replace(/[^0-9]/g, '');
  if (!raw) return '';

  if (raw.startsWith('02')) {
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return `${raw.slice(0, 2)}-${raw.slice(2)}`;
    if (raw.length <= 9) return `${raw.slice(0, 2)}-${raw.slice(2, 5)}-${raw.slice(5)}`;
    return `${raw.slice(0, 2)}-${raw.slice(2, 6)}-${raw.slice(6, 10)}`;
  }

  if (raw.length <= 3) return raw;
  if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
  if (raw.length <= 10) return `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
  return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
};

export const groupFieldsList = (fields) => {
  const groups = [];
  let curGroup = null;
  let curFields = [];

  (fields || []).forEach((f) => {
    const gTitle = f.groupTitle || '';
    if (gTitle !== curGroup) {
      if (curFields.length > 0) {
        groups.push({ title: curGroup, fields: curFields });
      }
      curGroup = gTitle;
      curFields = [f];
    } else {
      curFields.push(f);
    }
  });
  if (curFields.length > 0) {
    groups.push({ title: curGroup, fields: curFields });
  }
  return groups;
};

export const getCanvasBlocks = (fields) => {
  const blocks = [];
  let currentGroupTitle = null;
  let currentGroupFields = [];

  (fields || []).forEach((field, fieldIdx) => {
    const gTitle = field.groupTitle || '';

    // ungrouped fields: each becomes its own standalone block
    if (!gTitle) {
      // flush any open group first
      if (currentGroupFields.length > 0) {
        blocks.push({
          type: currentGroupTitle ? 'group' : 'single',
          groupTitle: currentGroupTitle,
          fields: currentGroupFields
        });
        currentGroupFields = [];
        currentGroupTitle = null;
      }
      blocks.push({
        type: 'single',
        groupTitle: '',
        fields: [{ ...field, originalIdx: fieldIdx }]
      });
      return;
    }

    if (gTitle !== currentGroupTitle) {
      if (currentGroupFields.length > 0) {
        blocks.push({
          type: 'group',
          groupTitle: currentGroupTitle,
          fields: currentGroupFields
        });
      }
      currentGroupTitle = gTitle;
      currentGroupFields = [{ ...field, originalIdx: fieldIdx }];
    } else {
      currentGroupFields.push({ ...field, originalIdx: fieldIdx });
    }
  });

  if (currentGroupFields.length > 0) {
    blocks.push({
      type: currentGroupTitle ? 'group' : 'single',
      groupTitle: currentGroupTitle,
      fields: currentGroupFields
    });
  }

  return blocks;
};

export const DEFAULT_TAGS = [
  { id: 'def_1', name: '계약서작성', bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' },
  { id: 'def_2', name: '잔금', bg: '#FEE2E2', border: '#FCA5A5', color: '#B91C1C' }
];

export const TAG_COLOR_PALETTE = [
  { bg: '#FEF3C7', border: '#FDE047', color: '#B45309', label: '주황' },
  { bg: '#DBEAFE', border: '#93C5FD', color: '#1E40AF', label: '파랑' },
  { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D', label: '초록' },
  { bg: '#F3E8FF', border: '#D8B4FE', color: '#7E22CE', label: '보라' },
  { bg: '#FEE2E2', border: '#FCA5A5', color: '#B91C1C', label: '빨강' },
  { bg: '#FFEDD5', border: '#FDBA74', color: '#C2410C', label: '다홍' },
  { bg: '#E0F2FE', border: '#7DD3FC', color: '#0369A1', label: '하늘' },
  { bg: '#FCE7F3', border: '#F472B6', color: '#BE185D', label: '분홍' },
  { bg: '#F1F5F9', border: '#CBD5E1', color: '#334155', label: '회색' }
];

export function getStoredCustomTags() {
  try {
    const saved = localStorage.getItem('insite_custom_tags');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredCustomTags(tags) {
  try {
    localStorage.setItem('insite_custom_tags', JSON.stringify(tags));
  } catch (e) {}
}

export function getStoredNavLocation() {
  try {
    const saved = localStorage.getItem('insite_last_nav_location');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

export function saveStoredNavLocation(loc) {
  try {
    localStorage.setItem('insite_last_nav_location', JSON.stringify(loc));
  } catch (e) {}
}

export function getStoredCollapsedSections(itemId) {
  if (!itemId) return {};
  try {
    const allSaved = JSON.parse(localStorage.getItem('memo_collapsed_sections') || '{}');
    return allSaved[itemId] || {};
  } catch (e) {
    return {};
  }
}

export function saveStoredCollapsedSections(itemId, sections) {
  if (!itemId) return;
  try {
    const allSaved = JSON.parse(localStorage.getItem('memo_collapsed_sections') || '{}');
    allSaved[itemId] = sections;
    localStorage.setItem('memo_collapsed_sections', JSON.stringify(allSaved));
  } catch (e) {}
}

export function getStoredDetailCollapsedBlocks(itemId, checkId) {
  if (!itemId) return {};
  try {
    const allSaved = JSON.parse(localStorage.getItem('memo_collapsed_detail_blocks') || '{}');
    const key = `${itemId}_${checkId || '__main__'}`;
    return allSaved[key] || {};
  } catch (e) {
    return {};
  }
}

export function saveStoredDetailCollapsedBlocks(itemId, checkId, blocksMap) {
  if (!itemId) return;
  try {
    const allSaved = JSON.parse(localStorage.getItem('memo_collapsed_detail_blocks') || '{}');
    const key = `${itemId}_${checkId || '__main__'}`;
    allSaved[key] = blocksMap;
    localStorage.setItem('memo_collapsed_detail_blocks', JSON.stringify(allSaved));
  } catch (e) {}
}

export function getTagStyle(tagName, customBadgesList = null) {
  if (!tagName) return null;
  const foundDefault = DEFAULT_TAGS.find(t => t.name === tagName);
  if (foundDefault) return foundDefault;

  const customList = customBadgesList || getStoredCustomTags();
  const foundCustom = customList.find(t => t.name === tagName);
  if (foundCustom) return foundCustom;

  // Fallback color palette by string hash
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index];
}
// CalendarView import removed

// Legacy In-box IDs for fallback and migration handling
export const LEGACY_INBOX_IDS = ['inbox', 'blog_inbox', 'clipboard_inbox', 'balance_inbox', 'clip_inbox', 'office_inbox', 'ad_inbox'];
export const FIXED_INBOX_IDS = LEGACY_INBOX_IDS;

// Fixed Trash category definitions
export const TRASH_CATEGORY = { id: 'trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'explorer' };
export const BLOG_TRASH_CATEGORY = { id: 'blog_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'blog' };
export const CLIPBOARD_TRASH_CATEGORY = { id: 'clipboard_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'clipboard' };
export const BALANCE_TRASH_CATEGORY = { id: 'balance_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'balance' };
export const CLIP_TRASH_CATEGORY = { id: 'clip_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'clip' };
export const OFFICE_TRASH_CATEGORY = { id: 'office_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'office' };
export const AD_TRASH_CATEGORY = { id: 'ad_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'ad' };
export const TEMPLATE2_TRASH_CATEGORY = { id: 'template2_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'template2' };
export const EXPERIENCE_TRASH_CATEGORY = { id: 'experience_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'experience' };
export const CUSTOM1_TRASH_CATEGORY = { id: 'custom1_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'custom1' };
export const CUSTOM2_TRASH_CATEGORY = { id: 'custom2_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'custom2' };
export const CUSTOM3_TRASH_CATEGORY = { id: 'custom3_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'custom3' };
export const CUSTOM4_TRASH_CATEGORY = { id: 'custom4_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'custom4' };
export const CUSTOM5_TRASH_CATEGORY = { id: 'custom5_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'custom5' };
export const CUSTOM6_TRASH_CATEGORY = { id: 'custom6_trash', name: '휴지통', order: 99999, isFixed: true, isTrash: true, scope: 'custom6' };

export const FIXED_TRASH_IDS = [
  'trash', 'blog_trash', 'clipboard_trash', 'balance_trash', 'clip_trash',
  'office_trash', 'ad_trash', 'template2_trash', 'experience_trash',
  'custom1_trash', 'custom2_trash', 'custom3_trash', 'custom4_trash', 'custom5_trash', 'custom6_trash'
];

// Fixed Quick-memo category definition (Only in explorer/note tab)
export const QUICK_MEMO_CATEGORY = { id: 'quick_memo', name: '퀵메모', order: -99990, isFixed: true, isQuickMemo: true, scope: 'explorer' };

export const ALL_FIXED_CATEGORY_IDS = [...FIXED_TRASH_IDS, 'quick_memo'];

// Default Main Tabs configuration (15 tabs, 5x3 rows)
export const DEFAULT_MAIN_TABS = [
  { id: 'explorer', label: 'ME' },
  { id: 'blog', label: '블로그' },
  { id: 'office', label: '정보' },
  { id: 'balance', label: '앱개발' },
  { id: 'experience', label: '경험' },
  { id: 'clipboard', label: '계약' },
  { id: 'ad', label: '광고' },
  { id: 'clip', label: '북마크' },
  { id: 'template2', label: '템플릿' },
  { id: 'custom1', label: '새탭 1' },
  { id: 'custom2', label: '새탭 2' },
  { id: 'custom3', label: '새탭 3' },
  { id: 'custom4', label: '새탭 4' },
  { id: 'custom5', label: '새탭 5' },
  { id: 'custom6', label: '새탭 6' }
];

export const MAIN_TABS_STORAGE_KEY = 'explorer_main_tabs_config_v1';

export const getStoredMainTabs = () => {
  if (typeof window === 'undefined') return DEFAULT_MAIN_TABS;
  try {
    const raw = localStorage.getItem(MAIN_TABS_STORAGE_KEY);
    if (!raw) return DEFAULT_MAIN_TABS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_MAIN_TABS;
    const validTabs = parsed.filter(t => t && t.id && DEFAULT_MAIN_TABS.some(d => d.id === t.id));
    const savedIds = new Set(validTabs.map(t => t.id));
    DEFAULT_MAIN_TABS.forEach(d => {
      if (!savedIds.has(d.id)) {
        validTabs.push({ ...d });
      }
    });
    return validTabs;
  } catch (e) {
    return DEFAULT_MAIN_TABS;
  }
};

export const getScopeForTab = (tab) => {
  if (tab === 'blog') return 'blog';
  if (tab === 'clipboard') return 'clipboard';
  if (tab === 'balance') return 'balance';
  if (tab === 'clip') return 'clip';
  if (tab === 'office') return 'office';
  if (tab === 'ad') return 'ad';
  if (tab === 'template2' || tab === 'template') return 'template2';
  if (tab === 'experience') return 'experience';
  if (tab === 'custom1') return 'custom1';
  if (tab === 'custom2') return 'custom2';
  if (tab === 'custom3') return 'custom3';
  if (tab === 'custom4') return 'custom4';
  if (tab === 'custom5') return 'custom5';
  if (tab === 'custom6') return 'custom6';
  return 'explorer';
};

export const getDefaultCategoryIdForTab = (tab, catList = []) => {
  if (tab === 'explorer') return 'quick_memo';
  const scope = getScopeForTab(tab);
  const scopeCategories = (catList || []).filter(c => {
    if (ALL_FIXED_CATEGORY_IDS.includes(c.id) || LEGACY_INBOX_IDS.includes(c.id) || c.isDeleted) return false;
    return c.scope === scope;
  });
  if (scopeCategories.length > 0) {
    const roots = scopeCategories.filter(c => !c.parentId);
    if (roots.length > 0) {
      roots.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko-KR', { numeric: true }));
      return roots[0].id;
    }
    scopeCategories.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko-KR', { numeric: true }));
    return scopeCategories[0].id;
  }
  return '';
};

export const getInboxIdForTab = (tab, catList = []) => getDefaultCategoryIdForTab(tab, catList);

export const getTrashIdForTab = (tab) => {
  if (tab === 'blog') return 'blog_trash';
  if (tab === 'clipboard') return 'clipboard_trash';
  if (tab === 'balance') return 'balance_trash';
  if (tab === 'clip') return 'clip_trash';
  if (tab === 'office') return 'office_trash';
  if (tab === 'ad') return 'ad_trash';
  if (tab === 'template2' || tab === 'template') return 'template2_trash';
  if (tab === 'experience') return 'experience_trash';
  if (tab === 'custom1') return 'custom1_trash';
  if (tab === 'custom2') return 'custom2_trash';
  if (tab === 'custom3') return 'custom3_trash';
  if (tab === 'custom4') return 'custom4_trash';
  if (tab === 'custom5') return 'custom5_trash';
  if (tab === 'custom6') return 'custom6_trash';
  return 'trash';
};

export const getFixedTrashCategoryForTab = (tab) => {
  if (tab === 'blog') return BLOG_TRASH_CATEGORY;
  if (tab === 'clipboard') return CLIPBOARD_TRASH_CATEGORY;
  if (tab === 'balance') return BALANCE_TRASH_CATEGORY;
  if (tab === 'clip') return CLIP_TRASH_CATEGORY;
  if (tab === 'office') return OFFICE_TRASH_CATEGORY;
  if (tab === 'ad') return AD_TRASH_CATEGORY;
  if (tab === 'template2' || tab === 'template') return TEMPLATE2_TRASH_CATEGORY;
  if (tab === 'experience') return EXPERIENCE_TRASH_CATEGORY;
  if (tab === 'custom1') return CUSTOM1_TRASH_CATEGORY;
  if (tab === 'custom2') return CUSTOM2_TRASH_CATEGORY;
  if (tab === 'custom3') return CUSTOM3_TRASH_CATEGORY;
  if (tab === 'custom4') return CUSTOM4_TRASH_CATEGORY;
  if (tab === 'custom5') return CUSTOM5_TRASH_CATEGORY;
  if (tab === 'custom6') return CUSTOM6_TRASH_CATEGORY;
  return TRASH_CATEGORY;
};

// Helper to highlight matching searchQuery in text
export const highlightText = (text, query) => {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} style={styles.searchHighlight}>
        {part}
      </span>
    ) : (
      part
    )
  );
};

// Helper to safely extract milliseconds timestamp from item updated/created time
export function getItemTimestamp(item) {
  if (!item) return 0;
  const ts = item.updatedAt || item.createdAt;
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (ts.seconds) return ts.seconds * 1000;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') return new Date(ts).getTime();
  return 0;
}

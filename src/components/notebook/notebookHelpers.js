import { LEGACY_INBOX_IDS, ALL_FIXED_CATEGORY_IDS } from './notebookConstants';

export const extractAllStrings = (obj, acc = []) => {
  if (obj === null || obj === undefined) return acc;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    acc.push(String(obj));
  } else if (Array.isArray(obj)) {
    obj.forEach(item => extractAllStrings(item, acc));
  } else if (typeof obj === 'object') {
    Object.values(obj).forEach(val => extractAllStrings(val, acc));
  }
  return acc;
};

export const getCategoryPath = (categoryId, categories = [], mainTabs = []) => {
  const scopeMap = {
    explorer: 'ME',
    blog: '블로그',
    clipboard: '계약',
    balance: '앱개발',
    clip: '북마크',
    office: '정보',
    ad: '광고',
    template2: '템플릿',
    experience: '경험',
    custom1: '새탭 1',
    custom2: '새탭 2',
    custom3: '새탭 3',
    custom4: '새탭 4',
    custom5: '새탭 5',
    custom6: '새탭 6'
  };
  (mainTabs || []).forEach(t => {
    if (t.id && t.label) {
      scopeMap[t.id] = t.label;
    }
  });
  const meLabel = scopeMap.explorer || 'ME';
  if (categoryId === 'quick_memo') {
    return `${meLabel} > 퀵메모`;
  }
  if (LEGACY_INBOX_IDS.includes(categoryId)) {
    return 'In-box';
  }
  const found = categories.find(c => c.id === categoryId);
  if (!found) return '기타';

  const pathSegments = [found.name];
  let curr = found;
  const visited = new Set([found.id]);
  while (curr && curr.parentId) {
    const parent = categories.find(c => c.id === curr.parentId);
    if (!parent || visited.has(parent.id)) break;
    visited.add(parent.id);
    pathSegments.unshift(parent.name);
    curr = parent;
  }
  const scopeName = scopeMap[found.scope || 'explorer'] || meLabel;
  return `${scopeName} > ${pathSegments.join(' > ')}`;
};

export const buildCategoryTree = (catList) => {
  const nodeMap = new Map();
  catList.forEach(c => nodeMap.set(c.id, { ...c, children: [] }));

  const roots = [];
  nodeMap.forEach(node => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortChildren = (nodes) => {
    nodes.sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 9999;
      const orderB = typeof b.order === 'number' ? b.order : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || '').localeCompare(b.name || '', 'ko-KR', { numeric: true });
    });
    nodes.forEach(n => sortChildren(n.children));
  };
  sortChildren(roots);
  return roots;
};

export const getHierarchicalCategoryOptions = (categories = [], scope, excludeId = null, groupIdFilter = null) => {
  const options = [];
  const scopeCats = categories.filter(c => {
    if (c.isDeleted) return false;
    const catScope = c.scope || 'explorer';
    if (catScope !== scope) return false;
    if (groupIdFilter) {
      if (groupIdFilter === 'UNASSIGNED') {
        if (c.groupId) return false;
      } else {
        if (c.groupId !== groupIdFilter) return false;
      }
    }
    return true;
  });

  let excludedIds = new Set();
  if (excludeId) {
    excludedIds.add(excludeId);
    const getDescendants = (pid) => {
      scopeCats.filter(c => c.parentId === pid).forEach(child => {
        excludedIds.add(child.id);
        getDescendants(child.id);
      });
    };
    getDescendants(excludeId);
  }

  const validCats = scopeCats.filter(c => !excludedIds.has(c.id));
  const tree = buildCategoryTree(validCats);

  const flatten = (nodes, depth = 0) => {
    nodes.forEach(node => {
      const prefix = depth > 0 ? `${'\u00A0\u00A0'.repeat(depth)}└ ` : '';
      options.push({
        id: node.id,
        name: `${prefix}${node.name}`,
        rawName: node.name,
        depth
      });
      if (node.children && node.children.length > 0) {
        flatten(node.children, depth + 1);
      }
    });
  };
  flatten(tree);
  return options;
};

export const getCategoryDescendantIds = (rootId, categories = []) => {
  const descendantIds = new Set();
  const getChildren = (pid) => {
    const children = categories.filter(c => c.parentId === pid && !c.isDeleted);
    children.forEach(child => {
      descendantIds.add(child.id);
      getChildren(child.id);
    });
  };
  getChildren(rootId);
  return Array.from(descendantIds);
};

export const isCategoryDescendant = (ancestorId, potentialDescendantId, categories = []) => {
  if (!ancestorId || !potentialDescendantId) return false;
  if (ancestorId === potentialDescendantId) return true;
  let curr = categories.find(c => c.id === potentialDescendantId);
  const visited = new Set();
  while (curr && curr.parentId) {
    if (curr.parentId === ancestorId) return true;
    if (visited.has(curr.id)) break;
    visited.add(curr.id);
    curr = categories.find(c => c.id === curr.parentId);
  }
  return false;
};

export const canMoveCategory = (sourceId, targetParentId, categories = []) => {
  if (!sourceId) return false;
  if (ALL_FIXED_CATEGORY_IDS.includes(sourceId)) return false;
  if (targetParentId === null) return true;
  if (ALL_FIXED_CATEGORY_IDS.includes(targetParentId)) return false;
  if (sourceId === targetParentId) return false;
  if (isCategoryDescendant(sourceId, targetParentId, categories)) return false;
  return true;
};

export const getCategoryFullPath = (cat, categories = [], categoryGroups = [], mainTabs = [], activeMainTab = 'explorer') => {
  if (!cat) return '';
  if (cat.id === 'quick_memo') {
    const tabLabel = mainTabs.find((t) => t.id === 'explorer')?.label || 'ME';
    return `${tabLabel} > 퀵메모`;
  }
  const scope = cat.scope || activeMainTab || 'explorer';
  const tabLabel = mainTabs.find((t) => t.id === scope)?.label || scope;

  const group = cat.groupId ? categoryGroups.find((g) => g.id === cat.groupId) : null;
  const groupName = group ? group.name : null;

  const segments = [cat.name];
  let curr = cat;
  const visited = new Set([cat.id]);
  while (curr && curr.parentId) {
    const parent = categories.find((c) => c.id === curr.parentId);
    if (!parent || visited.has(parent.id)) break;
    visited.add(parent.id);
    segments.unshift(parent.name);
    curr = parent;
  }

  const parts = [tabLabel];
  if (groupName) parts.push(groupName);
  parts.push(...segments);
  return parts.join(' > ');
};

export const getItemFullPath = (it, categories = [], categoryGroups = [], mainTabs = [], activeMainTab = 'explorer') => {
  if (!it) return '';
  const cat = it.categoryId === 'quick_memo'
    ? { id: 'quick_memo', name: '퀵메모', scope: 'explorer' }
    : categories.find((c) => c.id === it.categoryId);
  const catPath = getCategoryFullPath(cat, categories, categoryGroups, mainTabs, activeMainTab) || '기타';
  return `${catPath} > ${it.title || '제목 없음'}`;
};

export const getMatchedSnippet = (item, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) return null;
  const q = searchQuery.trim().toLowerCase();

  const formatSnippet = (str, label) => {
    if (!str || typeof str !== 'string') return null;
    const idx = str.toLowerCase().indexOf(q);
    if (idx === -1) return null;
    const start = Math.max(0, idx - 18);
    const end = Math.min(str.length, idx + q.length + 22);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < str.length ? '...' : '';
    return {
      snippetText: prefix + str.substring(start, end) + suffix,
      label
    };
  };

  const bodySnip = formatSnippet(item.body, '본문');
  if (bodySnip) return bodySnip;

  const subBodySnip = formatSnippet(item.subBody, '보충노트');
  if (subBodySnip) return subBodySnip;

  if (item.checklists) {
    const listStrings = extractAllStrings(item.checklists);
    for (let s of listStrings) {
      const snip = formatSnippet(s, '체크리스트');
      if (snip) return snip;
    }
  }

  if (item.templateValues) {
    const tplStrings = extractAllStrings(item.templateValues);
    for (let s of tplStrings) {
      const snip = formatSnippet(s, '템플릿');
      if (snip) return snip;
    }
  }

  return null;
};

export const checkItemMatches = (item, searchLower) => {
  if (!searchLower) return true;

  if ((item.title || '').toLowerCase().includes(searchLower)) return true;
  if ((item.body || '').toLowerCase().includes(searchLower)) return true;
  if ((item.subBody || '').toLowerCase().includes(searchLower)) return true;

  if (item.tags && Array.isArray(item.tags)) {
    const tagMatch = item.tags.some((t) => (typeof t === 'string' ? t.toLowerCase() : '').includes(searchLower));
    if (tagMatch) return true;
  }

  if (item.checklists && Array.isArray(item.checklists)) {
    const checklistTexts = extractAllStrings(item.checklists).join(' ').toLowerCase();
    if (checklistTexts.includes(searchLower)) return true;
  }

  if (item.templateValues && typeof item.templateValues === 'object') {
    const templateTexts = extractAllStrings(item.templateValues).join(' ').toLowerCase();
    if (templateTexts.includes(searchLower)) return true;
  }

  return false;
};

export const getItemMatchBadges = (item, searchLower) => {
  const badges = [];
  if (!searchLower) return badges;

  if ((item.title || '').toLowerCase().includes(searchLower)) {
    badges.push({ label: '제목', bg: '#FEF3C7', color: '#B45309' });
  }

  if ((item.body || '').toLowerCase().includes(searchLower)) {
    badges.push({ label: '본문', bg: '#E0F2FE', color: '#0369A1' });
  }

  const subBodyMatch = (item.subBody || '').toLowerCase().includes(searchLower);
  const checklistMatch = item.checklists && extractAllStrings(item.checklists).join(' ').toLowerCase().includes(searchLower);
  if (subBodyMatch || checklistMatch) {
    badges.push({ label: '체크리스트', bg: '#DCFCE7', color: '#15803D' });
  }

  const templateMatch = item.templateValues && extractAllStrings(item.templateValues).join(' ').toLowerCase().includes(searchLower);
  if (templateMatch) {
    badges.push({ label: '템플릿', bg: '#F3E8FF', color: '#7E22CE' });
  }

  return badges;
};

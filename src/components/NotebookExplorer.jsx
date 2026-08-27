import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Folder,
  FileText,
  ChevronRight,
  Save,
  RotateCcw,
  ArrowLeft,
  Inbox,
  Zap,
  Bookmark,
  CheckSquare,
  Square,
  ListChecks,
  Calendar as CalendarIcon,
  Clock,
  Tag,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { renderWithLinks } from '../utils/linkify';

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
import CalendarView from './CalendarView';

// Fixed In-box category definition
const INBOX_CATEGORY = { id: 'inbox', name: 'In-box', order: -99999, isFixed: true };

// Helper to safely extract milliseconds timestamp from item updated/created time
function getItemTimestamp(item) {
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

export default function NotebookExplorer() {
  // Main View Mode Tab state ('explorer' | 'calendar')
  const [activeMainTab, setActiveMainTab] = useState('explorer');

  // Data states
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('inbox');
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Item List Sort Order State (Default: 'asc' for ascending order)
  const [itemSortOrder, setItemSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Combine fixed In-box category at top, sort remaining categories in ascending order (가나다순)
  const allCategories = [
    INBOX_CATEGORY,
    ...categories
      .filter((c) => c.id !== 'inbox')
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko-KR', { numeric: true, sensitivity: 'base' }))
  ];

  // Mobile responsiveness & navigation state (Threshold 860px for tablets & mobile)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 860);
  const [mobileView, setMobileView] = useState('categories'); // 'categories' | 'items' | 'detail'
  const [mobileSubTab, setMobileSubTab] = useState('main'); // 'main' (상세내용) | 'sub' (보충노트)
  const [showExitToast, setShowExitToast] = useState(false);

  const lastBackPressRef = useRef(0);
  const exitToastTimerRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  // Category inline editing states
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  // Item inline editing states (Pane 2)
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemTitle, setEditingItemTitle] = useState('');
  const [deletingItemId, setDeletingItemId] = useState(null);

  // Detail View (Pane 3) states - Split 2-pane Layout
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftCategoryId, setDraftCategoryId] = useState('inbox');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftSubBody, setDraftSubBody] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [navigatedFromCalendar, setNavigatedFromCalendar] = useState(false);

  // Checklist local states
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCheckDueDate, setNewCheckDueDate] = useState('');
  const [newCheckIsAllDay, setNewCheckIsAllDay] = useState(true);
  const [newCheckDueTime, setNewCheckDueTime] = useState('09:00');

  const [editingCheckId, setEditingCheckId] = useState(null);
  const [editingCheckText, setEditingCheckText] = useState('');
  const [editingCheckDueDate, setEditingCheckDueDate] = useState('');
  const [editingCheckIsAllDay, setEditingCheckIsAllDay] = useState(true);
  const [editingCheckDueTime, setEditingCheckDueTime] = useState('09:00');
  const [editingCheckTag, setEditingCheckTag] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');

  // Persistent Custom Badges & Management State
  const [customBadges, setCustomBadges] = useState(getStoredCustomTags);
  const [showAddBadgeModal, setShowAddBadgeModal] = useState(false);
  const [showManageBadgesModal, setShowManageBadgesModal] = useState(false);

  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeColorIdx, setNewBadgeColorIdx] = useState(0);

  const [editingBadgeId, setEditingBadgeId] = useState(null);
  const [editingBadgeName, setEditingBadgeName] = useState('');
  const [editingBadgeColorIdx, setEditingBadgeColorIdx] = useState(0);

  const allBadges = [...DEFAULT_TAGS, ...customBadges];

  const handleAddCustomBadge = async () => {
    const trimmed = newBadgeName.trim();
    if (!trimmed) return;
    const exists = allBadges.some(t => t.name === trimmed);
    if (exists) {
      setEditingCheckTag(trimmed);
      setShowAddBadgeModal(false);
      setNewBadgeName('');
      return;
    }

    const colorStyle = TAG_COLOR_PALETTE[newBadgeColorIdx % TAG_COLOR_PALETTE.length];
    const newBadge = {
      id: 'c_' + Date.now().toString(),
      name: trimmed,
      bg: colorStyle.bg,
      border: colorStyle.border,
      color: colorStyle.color
    };
    const updated = [...customBadges, newBadge];
    setCustomBadges(updated);
    saveStoredCustomTags(updated);
    try {
      await setDoc(doc(db, 'settings', 'custom_tags'), { tags: updated });
    } catch (err) {
      console.error('Error saving custom badge to Firestore:', err);
    }
    setEditingCheckTag(trimmed);
    setNewBadgeName('');
    setShowAddBadgeModal(false);
  };

  const handleUpdateCustomBadge = async (badgeId) => {
    const trimmed = editingBadgeName.trim();
    if (!trimmed) return;
    const colorStyle = TAG_COLOR_PALETTE[editingBadgeColorIdx % TAG_COLOR_PALETTE.length];
    const updated = customBadges.map(b =>
      b.id === badgeId
        ? { ...b, name: trimmed, bg: colorStyle.bg, border: colorStyle.border, color: colorStyle.color }
        : b
    );
    setCustomBadges(updated);
    saveStoredCustomTags(updated);
    try {
      await setDoc(doc(db, 'settings', 'custom_tags'), { tags: updated });
    } catch (err) {
      console.error('Error updating custom badge in Firestore:', err);
    }
    setEditingBadgeId(null);
  };

  const handleDeleteCustomBadge = async (badgeId) => {
    const updated = customBadges.filter(b => b.id !== badgeId);
    setCustomBadges(updated);
    saveStoredCustomTags(updated);
    try {
      await setDoc(doc(db, 'settings', 'custom_tags'), { tags: updated });
    } catch (err) {
      console.error('Error deleting custom badge in Firestore:', err);
    }
  };



  // Global Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const openDeleteModal = (title, message, onConfirm) => {
    setDeleteModalState({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const closeDeleteModal = () => {
    setDeleteModalState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteModalState.onConfirm) {
      try {
        await deleteModalState.onConfirm();
      } catch (err) {
        console.error('Delete execution error:', err);
      }
    }
    closeDeleteModal();
  };

  const toastTimerRef = useRef(null);

  // Resize listener for mobile responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 860;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Touch Swipe Handlers for Mobile Tab Switching
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!isMobile || touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartXRef.current;
    const diffY = touchEndY - touchStartYRef.current;

    // Ensure horizontal swipe is dominant over vertical scroll
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      if (diffX < 0) {
        // Swiped Left -> Switch to 'sub' (보충노트)
        setMobileSubTab('sub');
      } else {
        // Swiped Right -> Switch to 'main' (상세내용)
        setMobileSubTab('main');
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Hardware/Browser Back button handling (popstate)
  useEffect(() => {
    window.history.replaceState({ view: 'categories' }, '');

    const handlePopState = (e) => {
      const stateView = e.state?.view;

      if (stateView === 'detail') {
        setMobileView('detail');
      } else if (stateView === 'items') {
        setMobileView('items');
      } else {
        setMobileView('categories');

        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          try {
            window.close();
          } catch (err) {
            console.log('App exited');
          }
        } else {
          lastBackPressRef.current = now;
          window.history.pushState({ view: 'categories' }, '');

          setShowExitToast(true);
          if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
          exitToastTimerRef.current = setTimeout(() => {
            setShowExitToast(false);
          }, 2000);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation Helpers
  const navigateToItems = (catId) => {
    setSelectedCategoryId(catId);
    setActiveMainTab('explorer');
    if (isMobile) {
      setMobileView('items');
      window.history.pushState({ view: 'items' }, '');
    }
  };

  const navigateToDetail = (itemId) => {
    setSelectedItemId(itemId);
    setMobileSubTab('main');
    if (isMobile) {
      setMobileView('detail');
      window.history.pushState({ view: 'detail' }, '');
    }
  };

  const navigateBack = () => {
    window.history.back();
  };

  // 1. Subscribe to Categories
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const catList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setCategories(catList);
    }, (err) => {
      console.error("Firestore categories snapshot error:", err);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Items (Default order: ascending)
  useEffect(() => {
    const q = query(collection(db, 'items'), orderBy('updatedAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setItems(itemList);
    }, (err) => {
      console.error("Firestore items snapshot error:", err);
    });
    return () => unsubscribe();
  }, []);

  // 3. Subscribe to Custom Badges (Tags) in Firestore
  useEffect(() => {
    const customTagsDocRef = doc(db, 'settings', 'custom_tags');
    const unsubscribe = onSnapshot(customTagsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.tags)) {
          setCustomBadges(data.tags);
          saveStoredCustomTags(data.tags);
        }
      } else {
        const localTags = getStoredCustomTags();
        if (localTags && localTags.length > 0) {
          setDoc(customTagsDocRef, { tags: localTags }).catch(console.error);
        }
      }
    }, (err) => {
      console.error("Firestore custom_tags snapshot error:", err);
    });
    return () => unsubscribe();
  }, []);

  // 4. Auto sync items tags into customBadges if not already present
  useEffect(() => {
    if (!items || items.length === 0) return;

    let hasNewTag = false;
    const currentCustomTags = [...customBadges];
    const knownTagNames = new Set([...DEFAULT_TAGS.map(t => t.name), ...currentCustomTags.map(t => t.name)]);

    items.forEach((item) => {
      const checkAndAddTag = (tagName) => {
        if (tagName && typeof tagName === 'string' && tagName.trim().length > 0) {
          const trimmed = tagName.trim();
          if (!knownTagNames.has(trimmed)) {
            knownTagNames.add(trimmed);
            let hash = 0;
            for (let i = 0; i < trimmed.length; i++) {
              hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
            }
            const colorIdx = Math.abs(hash) % TAG_COLOR_PALETTE.length;
            const colorStyle = TAG_COLOR_PALETTE[colorIdx];
            currentCustomTags.push({
              id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              name: trimmed,
              bg: colorStyle.bg,
              border: colorStyle.border,
              color: colorStyle.color
            });
            hasNewTag = true;
          }
        }
      };

      checkAndAddTag(item.tag);
      if (item.checklists && Array.isArray(item.checklists)) {
        item.checklists.forEach(c => checkAndAddTag(c.tag));
      }
    });

    if (hasNewTag) {
      setCustomBadges(currentCustomTags);
      saveStoredCustomTags(currentCustomTags);
      setDoc(doc(db, 'settings', 'custom_tags'), { tags: currentCustomTags }).catch(console.error);
    }
  }, [items, customBadges]);

  // Filter & Sort items by selected category (Default: ascending order by title / 가나다순)
  const filteredItems = items
    .filter((item) => item.categoryId === selectedCategoryId)
    .sort((a, b) => {
      const titleA = (a.title || '').trim();
      const titleB = (b.title || '').trim();
      const comp = titleA.localeCompare(titleB, 'ko-KR', { numeric: true, sensitivity: 'base' });
      if (comp !== 0) {
        return itemSortOrder === 'asc' ? comp : -comp;
      }
      const tA = getItemTimestamp(a);
      const tB = getItemTimestamp(b);
      return itemSortOrder === 'asc' ? tA - tB : tB - tA;
    });

  // Auto-select first item when category changes if current selected item not in category
  useEffect(() => {
    if (filteredItems.length > 0) {
      const exists = filteredItems.some((item) => item.id === selectedItemId);
      if (!exists) {
        setSelectedItemId(filteredItems[0].id);
      }
    } else {
      setSelectedItemId(null);
    }
  }, [selectedCategoryId, filteredItems.length]);

  // Get active selected item & category objects
  const activeItem = items.find((item) => item.id === selectedItemId);
  const activeCategory = allCategories.find((cat) => cat.id === selectedCategoryId);

  // Compute active item checklists (with legacy subBody fallback)
  const currentChecklists = activeItem?.checklists
    ? activeItem.checklists
    : activeItem?.subBody
      ? activeItem.subBody.split('\n').filter((l) => l.trim().length > 0).map((line, idx) => ({
          id: `legacy_${idx}`,
          text: line,
          completed: false
        }))
      : [];

  const completedCount = currentChecklists.filter((c) => c.completed).length;
  const totalCount = currentChecklists.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Checklist Handlers
  const handleToggleChecklist = async (checkId) => {
    if (!activeItem) return;
    const updated = currentChecklists.map((c) =>
      c.id === checkId ? { ...c, completed: !c.completed } : c
    );
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error toggling checklist:', err);
    }
  };

  const handleAddChecklist = async () => {
    if (!activeItem || !newChecklistText.trim()) return;
    const newItem = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      text: newChecklistText.trim(),
      completed: false,
      dueDate: newCheckDueDate || null,
      isAllDay: newCheckIsAllDay,
      dueTime: newCheckIsAllDay ? null : (newCheckDueTime || '09:00')
    };
    const updated = [...currentChecklists, newItem];
    setNewChecklistText('');
    setNewCheckDueDate('');
    setNewCheckIsAllDay(true);
    setNewCheckDueTime('09:00');
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error adding checklist:', err);
    }
  };

  const handleSaveEditChecklist = async (checkId) => {
    if (!activeItem || !editingCheckText.trim()) return;
    const finalTag = editingCheckTag === 'custom' ? customTagInput.trim() : editingCheckTag;
    const updated = currentChecklists.map((c) =>
      c.id === checkId
        ? {
            ...c,
            text: editingCheckText.trim(),
            dueDate: editingCheckDueDate || null,
            isAllDay: editingCheckIsAllDay,
            dueTime: editingCheckIsAllDay ? null : (editingCheckDueTime || '09:00'),
            tag: finalTag || null
          }
        : c
    );
    setEditingCheckId(null);
    setEditingCheckText('');
    setEditingCheckDueDate('');
    setEditingCheckIsAllDay(true);
    setEditingCheckDueTime('09:00');
    setEditingCheckTag('');
    setCustomTagInput('');
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating checklist:', err);
    }
  };

  const handleDeleteChecklist = async (checkId) => {
    if (!activeItem) return;
    const updated = currentChecklists.filter((c) => c.id !== checkId);
    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error deleting checklist:', err);
    }
  };

  // Sync draft state when active item changes
  useEffect(() => {
    if (activeItem) {
      setDraftTitle(activeItem.title || '');
      setDraftBody(activeItem.body || '');
      setDraftSubBody(activeItem.subBody || '');
      setDraftCategoryId(activeItem.categoryId || 'inbox');
    } else {
      setDraftTitle('');
      setDraftBody('');
      setDraftSubBody('');
      setDraftCategoryId('inbox');
    }
    setIsEditMode(false);
  }, [selectedItemId]);

  // ESC key handler for cancelling delete modal & detail edit mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (deleteModalState.isOpen) {
          closeDeleteModal();
        } else if (isEditMode) {
          handleCancelDetailEdit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteModalState.isOpen, isEditMode, activeItem]);

  // ---------------- Category Handlers ----------------
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setIsAddingCategory(false);
      return;
    }
    try {
      const newRef = doc(collection(db, 'categories'));
      await setDoc(newRef, {
        name: newCategoryName.trim(),
        order: categories.length,
        createdAt: serverTimestamp()
      });
      navigateToItems(newRef.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const handleUpdateCategoryName = async (catId) => {
    if (catId === 'inbox') return;
    if (!editingCategoryName.trim()) {
      setEditingCategoryId(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'categories', catId), {
        name: editingCategoryName.trim()
      });
      setEditingCategoryId(null);
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (catId === 'inbox') return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'categories', catId));
      const childItems = items.filter((item) => item.categoryId === catId);
      childItems.forEach((item) => {
        batch.delete(doc(db, 'items', item.id));
      });
      await batch.commit();

      setDeletingCategoryId(null);
      if (selectedCategoryId === catId) {
        setSelectedCategoryId('inbox');
      }
    } catch (err) {
      console.error('Error deleting category and child items:', err);
    }
  };

  // ---------------- Quick Add Note (Fast Entry to In-box) ----------------
  const handleQuickAddNote = async () => {
    try {
      const newRef = doc(collection(db, 'items'));
      await setDoc(newRef, {
        categoryId: 'inbox',
        title: '새 빠른 메모',
        body: '',
        subBody: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSelectedCategoryId('inbox');
      navigateToDetail(newRef.id);
      setDraftCategoryId('inbox');
      setDraftTitle('새 빠른 메모');
      setDraftBody('');
      setDraftSubBody('');
      setIsEditMode(true);
    } catch (err) {
      console.error('Error adding quick note:', err);
    }
  };

  // ---------------- Item Handlers ----------------
  const handleAddItem = async () => {
    const targetCatId = selectedCategoryId || 'inbox';
    try {
      const newRef = doc(collection(db, 'items'));
      await setDoc(newRef, {
        categoryId: targetCatId,
        title: '새 메모',
        body: '',
        subBody: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      navigateToDetail(newRef.id);
      setDraftCategoryId(targetCatId);
      setDraftTitle('새 메모');
      setDraftBody('');
      setDraftSubBody('');
      setIsEditMode(true);
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const handleUpdateItemTitle = async (itemId) => {
    if (!editingItemTitle.trim()) {
      setEditingItemId(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'items', itemId), {
        title: editingItemTitle.trim(),
        updatedAt: serverTimestamp()
      });
      setEditingItemId(null);
    } catch (err) {
      console.error('Error updating item title:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'items', itemId));
      setDeletingItemId(null);
      if (selectedItemId === itemId) {
        const remaining = filteredItems.filter((i) => i.id !== itemId);
        setSelectedItemId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // ---------------- Detail View Handlers ----------------
  const handleSaveDetail = async () => {
    if (!selectedItemId) return;
    try {
      await updateDoc(doc(db, 'items', selectedItemId), {
        title: draftTitle,
        body: draftBody,
        subBody: draftSubBody,
        categoryId: draftCategoryId,
        updatedAt: serverTimestamp()
      });
      if (draftCategoryId !== selectedCategoryId) {
        setSelectedCategoryId(draftCategoryId);
      }
      setIsEditMode(false);
      setShowSavedToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setShowSavedToast(false);
      }, 1800);
    } catch (err) {
      console.error('Error saving detail:', err);
    }
  };

  const handleCancelDetailEdit = () => {
    if (activeItem) {
      setDraftTitle(activeItem.title || '');
      setDraftBody(activeItem.body || '');
      setDraftSubBody(activeItem.subBody || '');
      setDraftCategoryId(activeItem.categoryId || 'inbox');
    }
    setIsEditMode(false);
  };

  // ---------------- Render ----------------
  return (
    <div style={styles.appContainer}>
      {/* Pane 1: Category Sidebar (Pastel Blue, 280px or 100% on Mobile) */}
      {(!isMobile || mobileView === 'categories') && (
        <div style={{
          ...styles.pane1,
          width: isMobile ? '100%' : '280px',
          minWidth: isMobile ? '100%' : '280px'
        }}>
          {/* Main Mode Tab Switcher */}
          <div style={styles.mainModeBar}>
            <button
              onClick={() => {
                setActiveMainTab('explorer');
                setNavigatedFromCalendar(false);
              }}
              style={{
                ...styles.mainModeTabBtn,
                backgroundColor: activeMainTab === 'explorer' ? '#2563EB' : 'transparent',
                color: activeMainTab === 'explorer' ? '#FFFFFF' : '#4A607A',
                fontWeight: activeMainTab === 'explorer' ? 700 : 500
              }}
            >
              <FileText size={14} />
              <span>메모 탐색기</span>
            </button>
            <button
              onClick={() => {
                setActiveMainTab('calendar');
                setNavigatedFromCalendar(false);
                if (isMobile) setMobileView('detail');
              }}
              style={{
                ...styles.mainModeTabBtn,
                backgroundColor: activeMainTab === 'calendar' ? '#2563EB' : 'transparent',
                color: activeMainTab === 'calendar' ? '#FFFFFF' : '#4A607A',
                fontWeight: activeMainTab === 'calendar' ? 700 : 500
              }}
            >
              <CalendarIcon size={14} />
              <span>캘린더</span>
            </button>
          </div>

          <div style={styles.pane1Header}>
            <span style={styles.pane1Title}>카테고리</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handleQuickAddNote}
                style={styles.quickAddBtn}
                title="빠른 메모 생성 (In-box에 자동 저장)"
              >
                <Zap size={13} fill="#2563EB" color="#2563EB" />
                <span>빠른입력</span>
              </button>
              <button
                onClick={() => setIsAddingCategory(true)}
                style={styles.iconBtnDark}
                title="카테고리 추가"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div style={styles.paneContent}>
            {isAddingCategory && (
              <div style={styles.inlineInputRowDark}>
                <input
                  autoFocus
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCategory();
                    if (e.key === 'Escape') setIsAddingCategory(false);
                  }}
                  onBlur={handleAddCategory}
                  placeholder="카테고리명..."
                  style={styles.inputDark}
                />
              </div>
            )}

            {allCategories.map((cat) => {
              const isSelected = cat.id === selectedCategoryId;
              const isEditing = cat.id === editingCategoryId;
              const isDeleting = cat.id === deletingCategoryId;
              const isFixed = cat.isFixed;
              const count = cat.id === 'inbox'
                ? items.filter((item) => !item.categoryId || item.categoryId === 'inbox').length
                : items.filter((item) => item.categoryId === cat.id).length;

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    if (!isEditing && !isDeleting) navigateToItems(cat.id);
                  }}
                  style={{
                    ...styles.catRow,
                    backgroundColor: isSelected ? '#D8E6F5' : 'transparent',
                    color: isSelected ? '#1E3A5F' : '#4A607A',
                    fontWeight: isSelected ? 600 : 400
                  }}
                >
                  {isFixed ? (
                    <Inbox size={16} color={isSelected ? '#2563EB' : '#7C95B1'} style={{ flexShrink: 0 }} />
                  ) : (
                    <Folder size={16} color={isSelected ? '#2563EB' : '#7C95B1'} style={{ flexShrink: 0 }} />
                  )}

                  {isEditing ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateCategoryName(cat.id);
                        if (e.key === 'Escape') setEditingCategoryId(null);
                      }}
                      onBlur={() => handleUpdateCategoryName(cat.id)}
                      style={styles.inputDarkInline}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.name}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: isSelected ? '#2563EB' : '#7C95B1',
                        fontWeight: isSelected ? 700 : 500,
                        flexShrink: 0
                      }}>
                        ({count})
                      </span>
                    </div>
                  )}

                  {!isFixed && (
                    <div style={styles.actionGroup}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategoryId(cat.id);
                          setEditingCategoryName(cat.name);
                        }}
                        style={styles.actionBtnDark}
                        title="이름 변경"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(
                            '카테고리 삭제',
                            `'${cat.name}' 카테고리를 삭제하시겠습니까?\n카테고리 안의 모든 메모도 함께 삭제됩니다.`,
                            () => handleDeleteCategory(cat.id)
                          );
                        }}
                        style={styles.actionBtnDark}
                        title="삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeMainTab === 'calendar' ? (
        <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {isMobile && (
            <div style={{ padding: '8px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #CBD5E1' }}>
              <button
                onClick={() => {
                  setMobileView('categories');
                }}
                style={styles.mobileBackBtn}
              >
                <ArrowLeft size={16} /> 카테고리 / 메뉴
              </button>
            </div>
          )}
          <CalendarView
            items={items}
            categories={allCategories}
            onNavigateToDetail={(itemId, isChecklist) => {
              navigateToDetail(itemId);
              setActiveMainTab('explorer');
              setNavigatedFromCalendar(true);
              if (isChecklist) {
                setMobileSubTab('sub');
              }
            }}
            openDeleteModal={openDeleteModal}
          />
        </div>
      ) : (
        <>
          {/* Pane 2: Note Item List (Light, 280px or 100% on Mobile) */}
      {(!isMobile || mobileView === 'items') && (
        <div style={{
          ...styles.pane2,
          width: isMobile ? '100%' : '280px',
          minWidth: isMobile ? '100%' : '280px'
        }}>
          <div style={styles.pane2Header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isMobile && (
                <button
                  onClick={navigateBack}
                  style={styles.mobileBackBtn}
                  title="카테고리로 이동"
                >
                  <ArrowLeft size={18} />
                  <span>카테고리</span>
                </button>
              )}
              <span style={styles.pane2Title}>
                {activeCategory ? activeCategory.name : '목록'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setItemSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                style={{
                  ...styles.iconBtnLight,
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '11px',
                  color: '#4B5563'
                }}
                title={itemSortOrder === 'asc' ? '현재: 오름차순 (클릭 시 내림차순)' : '현재: 내림차순 (클릭 시 오름차순)'}
              >
                {itemSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                <span>{itemSortOrder === 'asc' ? '오름차순' : '내림차순'}</span>
              </button>
              <button
                onClick={handleAddItem}
                style={styles.iconBtnLight}
                title="메모 추가"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div style={styles.paneContent}>
            {filteredItems.length === 0 ? (
              <div style={styles.emptyStateText}>
                등록된 메모가 없습니다.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === selectedItemId;
                const isEditing = item.id === editingItemId;
                const isDeleting = item.id === deletingItemId;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!isEditing && !isDeleting) navigateToDetail(item.id);
                    }}
                    style={{
                      ...styles.itemCard,
                      backgroundColor: isSelected ? '#F0F7F4' : '#FFFFFF',
                      borderColor: isSelected ? '#3F7A63' : '#ECEBE7'
                    }}
                  >
                    <div style={styles.itemCardHeader}>
                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingItemTitle}
                          onChange={(e) => setEditingItemTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateItemTitle(item.id);
                            if (e.key === 'Escape') setEditingItemId(null);
                          }}
                          onBlur={() => handleUpdateItemTitle(item.id)}
                          style={styles.inputLightInline}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span style={{
                          ...styles.itemTitle,
                          color: isSelected ? '#22262A' : '#3C3F42'
                        }}>
                          {item.title || '제목 없음'}
                        </span>
                      )}

                      {/* Hover Actions */}
                      <div style={styles.actionGroupLight}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItemId(item.id);
                            setEditingItemTitle(item.title || '');
                          }}
                          style={styles.actionBtnLight}
                          title="제목 변경"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(
                              '메모 삭제',
                              `'${item.title || '제목 없음'}' 메모를 정말 삭제하시겠습니까?`,
                              () => handleDeleteItem(item.id)
                            );
                          }}
                          style={styles.actionBtnLight}
                          title="삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Pane 3: Detail Workspace (Flex 1 or 100% on Mobile) */}
      {(!isMobile || mobileView === 'detail') && (
        <div style={styles.pane3}>
          {activeItem ? (
            <>
              {/* Mobile Sub-Tab Bar (Prominent Tab Switching Bar) */}
              {isMobile && (
                <div style={styles.mobileTabBar}>
                  <button
                    onClick={() => setMobileSubTab('main')}
                    style={{
                      ...styles.mobileTabBtn,
                      backgroundColor: mobileSubTab === 'main' ? '#2563EB' : '#FFFFFF',
                      color: mobileSubTab === 'main' ? '#FFFFFF' : '#475569',
                      borderColor: mobileSubTab === 'main' ? '#2563EB' : '#CBD5E1'
                    }}
                  >
                    📄 상세내용
                  </button>
                  <button
                    onClick={() => setMobileSubTab('sub')}
                    style={{
                      ...styles.mobileTabBtn,
                      backgroundColor: mobileSubTab === 'sub' ? '#2563EB' : '#FFFFFF',
                      color: mobileSubTab === 'sub' ? '#FFFFFF' : '#475569',
                      borderColor: mobileSubTab === 'sub' ? '#2563EB' : '#CBD5E1'
                    }}
                  >
                    ☑️ 체크리스트 {activeItem.subBody ? '•' : ''}
                  </button>
                </div>
              )}

              {/* Content Body - Split 2-pane Workspace (Touch Swipe enabled) */}
              <div
                style={styles.pane3Body}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {isEditMode ? (
                  <div style={styles.splitEditContainer}>
                    {/* Split Edit Textarea Fields (Desktop: 2 Cards side-by-side, Mobile: 1 Full Card by SubTab) */}
                    <div style={styles.splitEditFields}>
                      {(!isMobile || mobileSubTab === 'main') && (
                        <div style={styles.editPaneMainCard}>
                          {/* Top Control Bar: Category Selector + Cancel/Save Buttons */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '6px',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid #F1F5F9'
                          }}>
                            <div style={styles.headerCategorySelector}>
                              <span style={styles.headerCategoryLabel}>이동:</span>
                              <select
                                value={draftCategoryId}
                                onChange={(e) => setDraftCategoryId(e.target.value)}
                                style={styles.headerCategorySelect}
                              >
                                {allCategories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <button
                              onClick={handleCancelDetailEdit}
                              style={styles.btnSecondary}
                            >
                              <RotateCcw size={13} />
                              취소
                            </button>
                            <button
                              onClick={handleSaveDetail}
                              style={styles.btnPrimary}
                            >
                              <Save size={13} />
                              저장
                            </button>
                          </div>

                          {/* Standalone Full-Width Title Input Box */}
                          <input
                            type="text"
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            style={{ ...styles.editTitleInput, width: '100%', marginBottom: '10px' }}
                          />

                          <textarea
                            value={draftBody}
                            onChange={(e) => setDraftBody(e.target.value)}
                            placeholder="메모 기본 내용을 입력하세요... (URL 및 전화번호는 자동 링크로 변환됩니다)"
                            style={styles.editBodyTextarea}
                          />
                        </div>
                      )}

                      {(!isMobile || mobileSubTab === 'sub') && (
                        <div style={styles.rightPaneCard}>
                          {/* Input Form for new multiline checklist item */}
                          <div style={styles.checklistInputContainer}>
                            <div style={styles.checklistInputGroup}>
                              <textarea
                                rows={2}
                                value={newChecklistText}
                                onChange={(e) => setNewChecklistText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) {
                                    e.preventDefault();
                                    handleAddChecklist();
                                  }
                                }}
                                placeholder="새 체크리스트 항목 입력... (Ctrl+Enter 항목 추가)"
                                style={styles.checklistTextarea}
                              />
                              <button
                                onClick={handleAddChecklist}
                                style={{
                                  ...styles.checklistAddBtn,
                                  opacity: newChecklistText.trim() ? 1 : 0.6,
                                  cursor: newChecklistText.trim() ? 'pointer' : 'not-allowed'
                                }}
                                disabled={!newChecklistText.trim()}
                                title="체크리스트 추가"
                              >
                                <Plus size={15} />
                                <span>추가</span>
                              </button>
                            </div>
                          </div>

                          {/* Checklist Items List */}
                          <div style={styles.checklistListContainer}>
                            {currentChecklists.length === 0 ? (
                              <div style={styles.checklistEmptyText}>
                                등록된 체크리스트 항목이 없습니다. 위 입력창에서 항목을 추가해보세요!
                              </div>
                            ) : (
                              currentChecklists.map((checkItem) => {
                                const isEditing = editingCheckId === checkItem.id;

                                return (
                                  <div
                                    key={checkItem.id}
                                    style={{
                                      ...styles.checklistItemRow,
                                      backgroundColor: checkItem.completed ? '#F8FAFC' : '#FFFFFF',
                                      borderColor: isEditing ? '#3B82F6' : (checkItem.completed ? '#E2E8F0' : '#CBD5E1')
                                    }}
                                  >
                                    {isEditing ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                                        <textarea
                                          rows={2}
                                          value={editingCheckText}
                                          onChange={(e) => setEditingCheckText(e.target.value)}
                                          style={styles.checklistEditTextarea}
                                          autoFocus
                                        />

                                        {/* 1-Line Integrated Control Bar: Date + All-Day + Badge Dropdown */}
                                        <div style={styles.scheduleOptionBar}>
                                          {/* Date Picker */}
                                          <div style={styles.scheduleField}>
                                            <CalendarIcon size={13} color="#64748B" />
                                            <input
                                              type="date"
                                              value={editingCheckDueDate}
                                              onChange={(e) => setEditingCheckDueDate(e.target.value)}
                                              style={styles.scheduleDateInput}
                                            />
                                          </div>

                                          {/* All-Day Checkbox / Time Input (Only when date is set) */}
                                          {editingCheckDueDate && (
                                            <>
                                              <label style={styles.allDayCheckLabel}>
                                                <input
                                                  type="checkbox"
                                                  checked={editingCheckIsAllDay}
                                                  onChange={(e) => setEditingCheckIsAllDay(e.target.checked)}
                                                />
                                                <span>종일</span>
                                              </label>
                                              {!editingCheckIsAllDay && (
                                                <div style={styles.scheduleField}>
                                                  <Clock size={13} color="#64748B" />
                                                  <input
                                                    type="time"
                                                    value={editingCheckDueTime}
                                                    onChange={(e) => setEditingCheckDueTime(e.target.value)}
                                                    style={styles.scheduleTimeInput}
                                                  />
                                                </div>
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingCheckDueDate('');
                                                  setEditingCheckIsAllDay(true);
                                                }}
                                                style={styles.scheduleClearBtn}
                                                title="일정 삭제"
                                              >
                                                <X size={12} />
                                              </button>
                                            </>
                                          )}

                                          {/* Badge Dropdown */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: editingCheckDueDate ? 0 : 'auto' }}>
                                            <Tag size={13} color="#64748B" />
                                            <select
                                              value={editingCheckTag || ''}
                                              onChange={(e) => setEditingCheckTag(e.target.value)}
                                              style={styles.badgeDropdownSelect}
                                            >
                                              <option value="">배지 없음</option>
                                              {allBadges.map((b) => (
                                                <option key={b.id || b.name} value={b.name}>
                                                  {b.name}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>

                                        {/* Action Buttons Row: Left [Manage], Right [Cancel, Save] */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                          <button
                                            type="button"
                                            onClick={() => setShowManageBadgesModal(true)}
                                            style={styles.btnSmallManage}
                                            title="배지 수정 및 삭제 관리"
                                          >
                                            ⚙️ 관리
                                          </button>

                                          <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                              type="button"
                                              onClick={() => setEditingCheckId(null)}
                                              style={styles.btnSmallCancel}
                                            >
                                              <X size={13} /> 취소
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleSaveEditChecklist(checkItem.id)}
                                              style={styles.btnSmallSave}
                                            >
                                              <Check size={13} /> 저장
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '6px' }}>
                                        {/* Top Content Row: Checkbox + Pure Text */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
                                          <button
                                            onClick={() => handleToggleChecklist(checkItem.id)}
                                            style={styles.checkboxBtn}
                                            title={checkItem.completed ? '미완료로 변경' : '완료로 변경'}
                                          >
                                            {checkItem.completed ? (
                                              <CheckSquare size={18} color="#2563EB" />
                                            ) : (
                                              <Square size={18} color="#94A3B8" />
                                            )}
                                          </button>
                                          <span
                                            style={{
                                              ...styles.checkitemText,
                                              flex: 1,
                                              minWidth: 0,
                                              textDecoration: checkItem.completed ? 'line-through' : 'none',
                                              color: checkItem.completed ? '#94A3B8' : '#1E293B',
                                              fontWeight: checkItem.completed ? 400 : 500,
                                              paddingTop: '1px'
                                            }}
                                          >
                                            {renderWithLinks(checkItem.text)}
                                          </span>
                                        </div>

                                        {/* Bottom Status Bar: Badge + Schedule (Left), Edit + Delete (Right) */}
                                        <div style={styles.checkitemStatusBar}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
                                            {checkItem.tag && (() => {
                                              const tagStyle = getTagStyle(checkItem.tag);
                                              return (
                                                <span
                                                  style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    padding: '1px 6px',
                                                    borderRadius: '4px',
                                                    backgroundColor: tagStyle.bg,
                                                    color: tagStyle.color,
                                                    border: `1px solid ${tagStyle.border}`
                                                  }}
                                                >
                                                  {checkItem.tag}
                                                </span>
                                              );
                                            })()}

                                            {checkItem.dueDate && (
                                              <div style={styles.itemScheduleBadge}>
                                                {checkItem.isAllDay !== false ? (
                                                  <span>📅 {checkItem.dueDate} (종일)</span>
                                                ) : (
                                                  <span>⏰ {checkItem.dueDate} {checkItem.dueTime || '09:00'}</span>
                                                )}
                                              </div>
                                            )}
                                          </div>

                                          <div style={styles.checkitemActions}>
                                            <button
                                              onClick={() => {
                                                setEditingCheckId(checkItem.id);
                                                setEditingCheckText(checkItem.text);
                                                setEditingCheckDueDate(checkItem.dueDate || '');
                                                setEditingCheckIsAllDay(checkItem.isAllDay !== false);
                                                setEditingCheckDueTime(checkItem.dueTime || '09:00');
                                                setEditingCheckTag(checkItem.tag || '');
                                              }}
                                              style={styles.actionBtnLight}
                                              title="수정"
                                            >
                                              <Edit2 size={13} />
                                            </button>
                                            <button
                                              onClick={() => {
                                                const preview = checkItem.text.length > 35 ? checkItem.text.slice(0, 35) + '...' : checkItem.text;
                                                openDeleteModal(
                                                  '체크리스트 항목 삭제',
                                                  `'${preview}' 항목을 정말 삭제하시겠습니까?`,
                                                  () => handleDeleteChecklist(checkItem.id)
                                                );
                                              }}
                                              style={styles.actionBtnLight}
                                              title="삭제"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={styles.splitReadContainer}>
                    {/* Left Card: Primary Note Content */}
                    {(!isMobile || mobileSubTab === 'main') && (
                      <div style={styles.leftPaneCard}>
                        {/* Title Header Line with Right-aligned Edit Button */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginBottom: '14px',
                          paddingBottom: '10px',
                          borderBottom: '1px solid #F1F5F9'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            {navigatedFromCalendar ? (
                              <button
                                onClick={() => {
                                  setActiveMainTab('calendar');
                                  setNavigatedFromCalendar(false);
                                }}
                                style={{
                                  backgroundColor: '#2563EB',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '5px 10px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
                                  flexShrink: 0
                                }}
                                title="캘린더 화면으로 돌아가기"
                              >
                                <ArrowLeft size={14} />
                                <span>캘린더</span>
                              </button>
                            ) : (
                              isMobile && (
                                <button
                                  onClick={navigateBack}
                                  style={styles.mobileBackBtn}
                                  title="목록으로 이동"
                                >
                                  <ArrowLeft size={16} />
                                  <span>목록</span>
                                </button>
                              )
                            )}
                            <h1 style={{ ...styles.readTitle, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {activeItem.title}
                            </h1>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {showSavedToast && (
                              <span style={styles.toastBadge}>
                                ✓ 저장됨
                              </span>
                            )}
                            <button
                              onClick={() => setIsEditMode(true)}
                              style={styles.btnPrimary}
                            >
                              <Edit2 size={13} />
                              수정
                            </button>
                          </div>
                        </div>

                        <div style={styles.readBody}>
                          {renderWithLinks(activeItem.body)}
                        </div>
                      </div>
                    )}

                    {/* Right Card: Standalone Checklist Card */}
                    {(!isMobile || mobileSubTab === 'sub') && (
                      <div style={styles.rightPaneCard}>
                        {/* Input Form for new multiline checklist item */}
                        <div style={styles.checklistInputContainer}>
                          <div style={styles.checklistInputGroup}>
                            <textarea
                              rows={2}
                              value={newChecklistText}
                              onChange={(e) => setNewChecklistText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                  e.preventDefault();
                                  handleAddChecklist();
                                }
                              }}
                              placeholder="새 체크리스트 항목 입력... (Ctrl+Enter 항목 추가)"
                              style={styles.checklistTextarea}
                            />
                            <button
                              onClick={handleAddChecklist}
                              style={{
                                ...styles.checklistAddBtn,
                                opacity: newChecklistText.trim() ? 1 : 0.6,
                                cursor: newChecklistText.trim() ? 'pointer' : 'not-allowed'
                              }}
                              disabled={!newChecklistText.trim()}
                              title="체크리스트 추가"
                            >
                              <Plus size={15} />
                              <span>추가</span>
                            </button>
                          </div>
                        </div>

                        {/* Checklist Items List */}
                        <div style={styles.checklistListContainer}>
                          {currentChecklists.length === 0 ? (
                            <div style={styles.checklistEmptyText}>
                              등록된 체크리스트 항목이 없습니다. 위 입력창에서 항목을 추가해보세요!
                            </div>
                          ) : (
                            currentChecklists.map((checkItem) => {
                              const isEditing = editingCheckId === checkItem.id;

                              return (
                                <div
                                  key={checkItem.id}
                                  style={{
                                    ...styles.checklistItemRow,
                                    backgroundColor: checkItem.completed ? '#F8FAFC' : '#FFFFFF',
                                    borderColor: isEditing ? '#3B82F6' : (checkItem.completed ? '#E2E8F0' : '#CBD5E1')
                                  }}
                                >
                                  {isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                                      <textarea
                                        rows={2}
                                        value={editingCheckText}
                                        onChange={(e) => setEditingCheckText(e.target.value)}
                                        style={styles.checklistEditTextarea}
                                        autoFocus
                                      />

                                      {/* 1-Line Integrated Control Bar: Date + All-Day + Badge Dropdown */}
                                      <div style={styles.scheduleOptionBar}>
                                        {/* Date Picker */}
                                        <div style={styles.scheduleField}>
                                          <CalendarIcon size={13} color="#64748B" />
                                          <input
                                            type="date"
                                            value={editingCheckDueDate}
                                            onChange={(e) => setEditingCheckDueDate(e.target.value)}
                                            style={styles.scheduleDateInput}
                                          />
                                        </div>

                                        {/* All-Day Checkbox / Time Input (Only when date is set) */}
                                        {editingCheckDueDate && (
                                          <>
                                            <label style={styles.allDayCheckLabel}>
                                              <input
                                                type="checkbox"
                                                checked={editingCheckIsAllDay}
                                                onChange={(e) => setEditingCheckIsAllDay(e.target.checked)}
                                              />
                                              <span>종일</span>
                                            </label>
                                            {!editingCheckIsAllDay && (
                                              <div style={styles.scheduleField}>
                                                <Clock size={13} color="#64748B" />
                                                <input
                                                  type="time"
                                                  value={editingCheckDueTime}
                                                  onChange={(e) => setEditingCheckDueTime(e.target.value)}
                                                  style={styles.scheduleTimeInput}
                                                />
                                              </div>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingCheckDueDate('');
                                                setEditingCheckIsAllDay(true);
                                              }}
                                              style={styles.scheduleClearBtn}
                                              title="일정 삭제"
                                            >
                                              <X size={12} />
                                            </button>
                                          </>
                                        )}

                                        {/* Badge Dropdown */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: editingCheckDueDate ? 0 : 'auto' }}>
                                          <Tag size={13} color="#64748B" />
                                          <select
                                            value={editingCheckTag || ''}
                                            onChange={(e) => setEditingCheckTag(e.target.value)}
                                            style={styles.badgeDropdownSelect}
                                          >
                                            <option value="">배지 없음</option>
                                            {allBadges.map((b) => (
                                              <option key={b.id || b.name} value={b.name}>
                                                {b.name}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>

                                      {/* Action Buttons Row: Left [Manage], Right [Cancel, Save] */}
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                        <button
                                          type="button"
                                          onClick={() => setShowManageBadgesModal(true)}
                                          style={styles.btnSmallManage}
                                          title="배지 수정 및 삭제 관리"
                                        >
                                          ⚙️ 관리
                                        </button>

                                        <div style={{ display: 'flex', gap: '6px' }}>
                                          <button
                                            type="button"
                                            onClick={() => setEditingCheckId(null)}
                                            style={styles.btnSmallCancel}
                                          >
                                            <X size={13} /> 취소
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleSaveEditChecklist(checkItem.id)}
                                            style={styles.btnSmallSave}
                                          >
                                            <Check size={13} /> 저장
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '6px' }}>
                                      {/* Top Content Row: Checkbox + Pure Text */}
                                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
                                        <button
                                          onClick={() => handleToggleChecklist(checkItem.id)}
                                          style={styles.checkboxBtn}
                                          title={checkItem.completed ? '미완료로 변경' : '완료로 변경'}
                                        >
                                          {checkItem.completed ? (
                                            <CheckSquare size={18} color="#2563EB" />
                                          ) : (
                                            <Square size={18} color="#94A3B8" />
                                          )}
                                        </button>
                                        <span
                                          style={{
                                            ...styles.checkitemText,
                                            flex: 1,
                                            minWidth: 0,
                                            textDecoration: checkItem.completed ? 'line-through' : 'none',
                                            color: checkItem.completed ? '#94A3B8' : '#1E293B',
                                            fontWeight: checkItem.completed ? 400 : 500,
                                            paddingTop: '1px'
                                          }}
                                        >
                                          {renderWithLinks(checkItem.text)}
                                        </span>
                                      </div>

                                      {/* Bottom Status Bar: Badge + Schedule (Left), Edit + Delete (Right) */}
                                      <div style={styles.checkitemStatusBar}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
                                          {checkItem.tag && (() => {
                                            const tagStyle = getTagStyle(checkItem.tag);
                                            return (
                                              <span
                                                style={{
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  fontSize: '11px',
                                                  fontWeight: 700,
                                                  padding: '1px 6px',
                                                  borderRadius: '4px',
                                                  backgroundColor: tagStyle.bg,
                                                  color: tagStyle.color,
                                                  border: `1px solid ${tagStyle.border}`
                                                }}
                                              >
                                                {checkItem.tag}
                                              </span>
                                            );
                                          })()}

                                          {checkItem.dueDate && (
                                            <div style={styles.itemScheduleBadge}>
                                              {checkItem.isAllDay !== false ? (
                                                <span>📅 {checkItem.dueDate} (종일)</span>
                                              ) : (
                                                <span>⏰ {checkItem.dueDate} {checkItem.dueTime || '09:00'}</span>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        <div style={styles.checkitemActions}>
                                          <button
                                            onClick={() => {
                                              setEditingCheckId(checkItem.id);
                                              setEditingCheckText(checkItem.text);
                                              setEditingCheckDueDate(checkItem.dueDate || '');
                                              setEditingCheckIsAllDay(checkItem.isAllDay !== false);
                                              setEditingCheckDueTime(checkItem.dueTime || '09:00');
                                              setEditingCheckTag(checkItem.tag || '');
                                            }}
                                            style={styles.actionBtnLight}
                                            title="수정"
                                          >
                                            <Edit2 size={13} />
                                          </button>
                                          <button
                                            onClick={() => {
                                              const preview = checkItem.text.length > 35 ? checkItem.text.slice(0, 35) + '...' : checkItem.text;
                                              openDeleteModal(
                                                '체크리스트 항목 삭제',
                                                `'${preview}' 항목을 정말 삭제하시겠습니까?`,
                                                () => handleDeleteChecklist(checkItem.id)
                                              );
                                            }}
                                            style={styles.actionBtnLight}
                                            title="삭제"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={styles.pane3Empty}>
              {isMobile && (
                <button
                  onClick={navigateBack}
                  style={{ ...styles.mobileBackBtn, marginBottom: '20px' }}
                >
                  <ArrowLeft size={18} />
                  <span>목록으로 돌아가기</span>
                </button>
              )}
              <FileText size={48} color="#D0D4DC" style={{ marginBottom: '12px' }} />
              <p style={{ color: '#8A909A', fontSize: '15px' }}>
                목록에서 메모를 선택하거나 새 메모를 작성하세요.
              </p>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Add Custom Badge Modal */}
      {showAddBadgeModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddBadgeModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>➕ 새 배지 만들기</h3>
              <button onClick={() => setShowAddBadgeModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  배지 이름
                </label>
                <input
                  type="text"
                  placeholder="예: 중도금, 현장방문, 서류검토"
                  value={newBadgeName}
                  onChange={(e) => setNewBadgeName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  배지 색상 선택
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {TAG_COLOR_PALETTE.map((pal, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewBadgeColorIdx(idx)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: newBadgeColorIdx === idx ? `2px solid ${pal.color}` : `1px solid ${pal.border}`,
                        backgroundColor: pal.bg,
                        color: pal.color,
                        cursor: 'pointer',
                        boxShadow: newBadgeColorIdx === idx ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none'
                      }}
                    >
                      {pal.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {newBadgeName.trim() && (() => {
                const pal = TAG_COLOR_PALETTE[newBadgeColorIdx];
                return (
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', marginRight: '6px' }}>미리보기:</span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: pal.bg,
                        color: pal.color,
                        border: `1px solid ${pal.border}`
                      }}
                    >
                      {newBadgeName.trim()}
                    </span>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleAddCustomBadge}
                  style={styles.btnSmallSave}
                >
                  <Check size={14} /> 배지 생성
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBadgeModal(false)}
                  style={styles.btnSmallCancel}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Badges Modal */}
      {showManageBadgesModal && (
        <div style={styles.modalOverlay} onClick={() => setShowManageBadgesModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>⚙️ 배지 수정 및 삭제</h3>
              <button onClick={() => setShowManageBadgesModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto', padding: '10px 0' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>기본 배지 (수정 불가)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {DEFAULT_TAGS.map((t) => (
                  <span
                    key={t.id}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: t.bg,
                      color: t.color,
                      border: `1px solid ${t.border}`
                    }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>

              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginTop: '6px' }}>사용자 정의 배지</div>
              {customBadges.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94A3B8', padding: '10px 0' }}>
                  직접 만든 배지가 없습니다. [+ 새 배지 만들기]로 추가해보세요!
                </div>
              ) : (
                customBadges.map((b) => {
                  const isEditingThis = editingBadgeId === b.id;
                  return (
                    <div
                      key={b.id}
                      style={{
                        display: 'flex',
                        flexDirection: isEditingThis ? 'column' : 'row',
                        alignItems: isEditingThis ? 'stretch' : 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        gap: '8px'
                      }}
                    >
                      {isEditingThis ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input
                            type="text"
                            value={editingBadgeName}
                            onChange={(e) => setEditingBadgeName(e.target.value)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              border: '1px solid #CBD5E1',
                              borderRadius: '4px'
                            }}
                          />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {TAG_COLOR_PALETTE.map((pal, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setEditingBadgeColorIdx(idx)}
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  borderRadius: '3px',
                                  border: editingBadgeColorIdx === idx ? `2px solid ${pal.color}` : `1px solid ${pal.border}`,
                                  backgroundColor: pal.bg,
                                  color: pal.color,
                                  cursor: 'pointer'
                                }}
                              >
                                {pal.label}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleUpdateCustomBadge(b.id)}
                              style={styles.btnSmallSave}
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingBadgeId(null)}
                              style={styles.btnSmallCancel}
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: b.bg,
                              color: b.color,
                              border: `1px solid ${b.border}`
                            }}
                          >
                            {b.name}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => {
                                setEditingBadgeId(b.id);
                                setEditingBadgeName(b.name);
                                const foundIdx = TAG_COLOR_PALETTE.findIndex(p => p.color === b.color);
                                setEditingBadgeColorIdx(foundIdx >= 0 ? foundIdx : 0);
                              }}
                              style={styles.actionBtnLight}
                              title="수정"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => {
                                openDeleteModal(
                                  '배지 삭제',
                                  `'${b.name}' 배지를 삭제하시겠습니까?`,
                                  () => handleDeleteCustomBadge(b.id)
                                );
                              }}
                              style={styles.actionBtnLight}
                              title="삭제"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Custom Delete Confirmation Modal */}
      {deleteModalState.isOpen && (
        <div style={styles.modalOverlay} onClick={closeDeleteModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalDangerIconWrapper}>
                  <Trash2 size={18} color="#DC2626" />
                </div>
                <h3 style={styles.modalTitle}>{deleteModalState.title || '삭제 확인'}</h3>
              </div>
              <button onClick={closeDeleteModal} style={styles.modalCloseBtn} title="닫기">
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={styles.modalMessage}>{deleteModalState.message}</p>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closeDeleteModal} style={styles.btnModalCancel}>
                취소
              </button>
              <button onClick={handleConfirmDelete} style={styles.btnModalDelete}>
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Toast Notification for Mobile double back press */}
      {showExitToast && (
        <div style={styles.exitToast}>
          한번 더 누르면 앱이 종료됩니다.
        </div>
      )}
    </div>
  );
}

// ---------------- Style Tokens & Layout CSS Objects ----------------
const styles = {
  appContainer: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#FAFAF8',
    overflow: 'hidden',
    userSelect: 'none',
    position: 'relative'
  },

  // Pane 1: Category (Pastel Blue, 280px)
  pane1: {
    height: '100%',
    backgroundColor: '#EBF3FA',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #D4E3F3'
  },
  pane1Header: {
    height: '52px',
    padding: '0 12px 0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #D4E3F3',
    backgroundColor: '#E2ECF7'
  },
  pane1Title: {
    color: '#2B5278',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.5px'
  },
  quickAddBtn: {
    backgroundColor: '#D8E6F5',
    color: '#1E3A5F',
    border: '1px solid #BFD7F2',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s ease'
  },
  iconBtnDark: {
    background: 'none',
    border: 'none',
    color: '#4A729A',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s, background-color 0.15s'
  },

  paneContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px'
  },

  inlineInputRowDark: {
    padding: '4px 8px',
    marginBottom: '6px'
  },
  inputDark: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    border: '1px solid #3B82F6',
    borderRadius: '4px',
    padding: '6px 10px',
    color: '#1E293B',
    fontSize: '13px',
    outline: 'none'
  },
  inputDarkInline: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    border: '1px solid #3B82F6',
    borderRadius: '3px',
    padding: '2px 6px',
    color: '#1E293B',
    fontSize: '13px',
    outline: 'none'
  },

  catRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '3px',
    fontSize: '14px',
    position: 'relative'
  },
  rowLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  actionBtnDark: {
    background: 'none',
    border: 'none',
    color: '#7C95B1',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '3px'
  },
  actionBtnConfirm: {
    background: 'rgba(37, 99, 235, 0.15)',
    border: 'none',
    cursor: 'pointer',
    padding: '3px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center'
  },
  actionBtnCancel: {
    background: 'rgba(229, 115, 115, 0.2)',
    border: 'none',
    cursor: 'pointer',
    padding: '3px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center'
  },

  // Pane 2: Notes List (Light, 280px)
  pane2: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #ECEBE7'
  },
  pane2Header: {
    height: '52px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #ECEBE7',
    backgroundColor: '#FAF9F6'
  },
  pane2Title: {
    color: '#22262A',
    fontSize: '14px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  iconBtnLight: {
    background: 'none',
    border: 'none',
    color: '#3C3F42',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  mobileBackBtn: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    fontWeight: 600,
    padding: '4px 6px',
    borderRadius: '4px'
  },

  emptyStateText: {
    color: '#A0A6B2',
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '40px'
  },

  itemCard: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ECEBE7',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  itemCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1
  },
  inputLightInline: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    border: '1px solid #3F7A63',
    borderRadius: '3px',
    padding: '2px 6px',
    color: '#22262A',
    fontSize: '13px',
    outline: 'none'
  },
  actionGroupLight: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  actionBtnLight: {
    background: 'none',
    border: 'none',
    color: '#8A909A',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '3px'
  },
  itemPreview: {
    fontSize: '12px',
    color: '#7E8592',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },

  // Pane 3: Detail Workspace (Flex 1)
  pane3: {
    flex: 1,
    height: '100%',
    backgroundColor: '#FAFAF8',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  pane3Header: {
    height: '46px',
    padding: '0 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #ECEBE7',
    backgroundColor: '#FFFFFF'
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#6C727E'
  },

  btnPrimary: {
    backgroundColor: '#3F7A63',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.15s'
  },
  btnSecondary: {
    backgroundColor: '#EFEFEA',
    color: '#3C3F42',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  toastBadge: {
    backgroundColor: 'rgba(63, 122, 99, 0.12)',
    color: '#3F7A63',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600
  },

  mobileTabBar: {
    display: 'flex',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #CBD5E1',
    padding: '4px 8px',
    gap: '6px'
  },
  mobileTabBtn: {
    flex: 1,
    padding: '7px 0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },

  pane3Body: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 12px'
  },
  pane3Empty: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAF8'
  },

  // Split Read & Edit Layouts
  splitReadContainer: {
    display: 'flex',
    gap: '10px',
    width: '100%',
    minHeight: '100%',
    alignItems: 'stretch'
  },
  leftPaneCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '14px 16px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
  },
  rightPaneCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '14px 16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column'
  },
  subNoteHeader: {
    paddingBottom: '8px',
    marginBottom: '10px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  subNoteTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1E293B',
    display: 'flex',
    alignItems: 'center'
  },
  subNoteBody: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#334155',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    flex: 1
  },
  subNoteEmptyText: {
    color: '#94A3B8',
    fontSize: '13px',
    lineHeight: 1.5
  },

  readTitle: {
    fontSize: '19px',
    fontWeight: 700,
    color: '#22262A',
    marginBottom: '12px',
    lineHeight: 1.3
  },
  readBody: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#3C3F42',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },

  splitEditContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    height: '100%',
    width: '100%'
  },
  splitEditFields: {
    display: 'flex',
    gap: '10px',
    flex: 1,
    minHeight: '420px'
  },
  editPaneMainCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
  },
  editPaneSubCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#475569'
  },

  headerCategorySelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F1F5F9',
    padding: '3px 6px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1'
  },
  headerCategoryLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569'
  },
  headerCategorySelect: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #94A3B8',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#1E293B',
    outline: 'none',
    cursor: 'pointer'
  },

  editTitleInput: {
    width: '100%',
    fontSize: '18px',
    fontWeight: 700,
    padding: '8px 12px',
    border: '1px solid #DCE0E6',
    borderRadius: '6px',
    outline: 'none',
    color: '#22262A',
    backgroundColor: '#FFFFFF'
  },
  editBodyTextarea: {
    width: '100%',
    minHeight: '360px',
    flex: 1,
    fontSize: '14px',
    lineHeight: 1.6,
    padding: '10px 12px',
    border: '1px solid #DCE0E6',
    borderRadius: '6px',
    outline: 'none',
    color: '#22262A',
    backgroundColor: '#FFFFFF',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  editSubBodyTextarea: {
    width: '100%',
    minHeight: '360px',
    flex: 1,
    fontSize: '14px',
    lineHeight: 1.6,
    padding: '10px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    outline: 'none',
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    resize: 'vertical',
    fontFamily: 'inherit'
  },

  // Checklist Card Styles
  checklistHeader: {
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  checklistCountBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    padding: '2px 8px',
    borderRadius: '12px',
    border: '1px solid #BFDBFE'
  },
  progressBarTrack: {
    height: '4px',
    backgroundColor: '#E2E8F0',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressBarFill: {
    height: '100%',
    transition: 'width 0.25s ease, background-color 0.25s ease'
  },
  checklistInputGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    alignItems: 'stretch'
  },
  checklistTextarea: {
    flex: 1,
    fontSize: '13px',
    padding: '6px 10px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.4,
    backgroundColor: '#FFFFFF'
  },
  checklistAddBtn: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '0 12px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0
  },
  checklistListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
    flex: 1,
    paddingRight: '2px'
  },
  checklistItemRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '6px',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid',
    transition: 'background-color 0.15s ease, border-color 0.15s ease'
  },
  checkitemStatusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    paddingTop: '6px',
    borderTop: '1px dashed #E2E8F0',
    width: '100%',
    minHeight: '22px'
  },
  checkboxBtn: {
    background: 'none',
    border: 'none',
    padding: '2px 0 0 0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: '#2563EB',
    flexShrink: 0
  },
  checkitemText: {
    fontSize: '13.5px',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    display: 'inline'
  },
  checklistEditTextarea: {
    width: '100%',
    fontSize: '13px',
    padding: '6px 8px',
    border: '1px solid #2563EB',
    borderRadius: '4px',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.4,
    resize: 'vertical'
  },
  btnSmallSave: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '3px'
  },
  btnSmallCancel: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: '1px solid #CBD5E1',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '3px'
  },
  btnSmallManage: {
    backgroundColor: '#FFFFFF',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s ease'
  },
  badgeDropdownSelect: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
    outline: 'none',
    cursor: 'pointer',
    maxWidth: '130px'
  },
  checkitemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    flexShrink: 0
  },
  checklistEmptyText: {
    color: '#94A3B8',
    fontSize: '13px',
    lineHeight: 1.5,
    padding: '12px 0'
  },

  // Global Delete Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    padding: '20px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  modalDangerIconWrapper: {
    backgroundColor: '#FEE2E2',
    borderRadius: '50%',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1E293B',
    margin: 0
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBody: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#475569'
  },
  modalMessage: {
    margin: 0,
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap'
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '8px',
    borderTop: '1px solid #F1F5F9'
  },
  btnModalCancel: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s'
  },
  btnModalDelete: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    boxShadow: '0 1px 3px rgba(220, 38, 38, 0.3)'
  },

  // Main Mode Bar Styles
  mainModeBar: {
    display: 'flex',
    padding: '8px',
    gap: '6px',
    backgroundColor: '#DCE7F3',
    borderBottom: '1px solid #C4D9EE'
  },
  mainModeTabBtn: {
    flex: 1,
    padding: '7px 0',
    borderRadius: '6px',
    fontSize: '12px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s ease'
  },

  // Checklist Schedule Option Styles
  checklistInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '10px'
  },
  scheduleOptionBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    flexWrap: 'wrap'
  },
  scheduleField: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FFFFFF',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #CBD5E1'
  },
  scheduleDateInput: {
    border: 'none',
    fontSize: '12px',
    color: '#334155',
    fontWeight: 600,
    outline: 'none',
    backgroundColor: 'transparent'
  },
  scheduleTimeInput: {
    border: 'none',
    fontSize: '12px',
    color: '#334155',
    fontWeight: 600,
    outline: 'none',
    backgroundColor: 'transparent'
  },
  allDayCheckLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer'
  },
  scheduleClearBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto'
  },
  itemScheduleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    padding: '1px 6px',
    borderRadius: '4px',
    marginTop: 0,
    border: '1px solid #BFDBFE'
  },

  exitToast: {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    color: '#FFFFFF',
    padding: '10px 20px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
    zIndex: 9999,
    pointerEvents: 'none'
  }
};

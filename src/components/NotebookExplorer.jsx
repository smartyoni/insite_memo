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
  Bookmark
} from 'lucide-react';
import { renderWithLinks } from '../utils/linkify';

// Fixed In-box category definition
const INBOX_CATEGORY = { id: 'inbox', name: 'In-box', order: -99999, isFixed: true };

export default function NotebookExplorer() {
  // Data states
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('inbox');
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Combine fixed In-box category at the very top
  const allCategories = [
    INBOX_CATEGORY,
    ...categories.filter((c) => c.id !== 'inbox')
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

  // 2. Subscribe to Items
  useEffect(() => {
    const q = query(collection(db, 'items'), orderBy('updatedAt', 'desc'));
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

  // Filter items by selected category
  const filteredItems = items.filter((item) => item.categoryId === selectedCategoryId);

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

  // ESC key handler for cancelling detail edit mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isEditMode) {
        handleCancelDetailEdit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, activeItem]);

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
                    <span style={styles.rowLabel}>{cat.name}</span>
                  )}

                  {!isFixed && (
                    <div style={styles.actionGroup}>
                      {isDeleting ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                            style={styles.actionBtnConfirm}
                            title="확인 삭제"
                          >
                            <Check size={14} color="#2563EB" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeletingCategoryId(null); }}
                            style={styles.actionBtnCancel}
                            title="취소"
                          >
                            <X size={14} color="#E57373" />
                          </button>
                        </>
                      ) : (
                        <>
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
                              setDeletingCategoryId(cat.id);
                            }}
                            style={styles.actionBtnDark}
                            title="삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            <button
              onClick={handleAddItem}
              style={styles.iconBtnLight}
              title="메모 추가"
            >
              <Plus size={18} />
            </button>
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
                const previewText = item.body ? item.body.slice(0, 40) : '(내용 없음)';

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
                        {isDeleting ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                              style={styles.actionBtnConfirm}
                              title="확인 삭제"
                            >
                              <Check size={14} color="#3F7A63" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeletingItemId(null); }}
                              style={styles.actionBtnCancel}
                              title="취소"
                            >
                              <X size={14} color="#E57373" />
                            </button>
                          </>
                        ) : (
                          <>
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
                                setDeletingItemId(item.id);
                              }}
                              style={styles.actionBtnLight}
                              title="삭제"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={styles.itemPreview}>
                      {previewText}
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
              {/* Header / Breadcrumb & Action Toolbar */}
              <div style={styles.pane3Header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isMobile && (
                    <button
                      onClick={navigateBack}
                      style={styles.mobileBackBtn}
                      title="목록으로 이동"
                    >
                      <ArrowLeft size={18} />
                      <span>목록</span>
                    </button>
                  )}
                  <div style={styles.breadcrumb}>
                    <span>{allCategories.find(c => c.id === activeItem.categoryId)?.name || 'In-box'}</span>
                    <ChevronRight size={14} color="#A0A6B2" style={{ margin: '0 4px' }} />
                    <span style={{ color: '#22262A', fontWeight: 600 }}>{activeItem.title}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {showSavedToast && (
                    <span style={styles.toastBadge}>
                      ✓ 저장됨
                    </span>
                  )}

                  {isEditMode ? (
                    <>
                      {/* Header Category Selector */}
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
                        <RotateCcw size={14} />
                        취소
                      </button>
                      <button
                        onClick={handleSaveDetail}
                        style={styles.btnPrimary}
                      >
                        <Save size={14} />
                        저장
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditMode(true)}
                      style={styles.btnPrimary}
                    >
                      <Edit2 size={14} />
                      수정
                    </button>
                  )}
                </div>
              </div>

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
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="제목을 입력하세요"
                      style={styles.editTitleInput}
                    />

                    {/* Split Edit Textarea Fields (Desktop: 2 Cards side-by-side, Mobile: 1 Full Card by SubTab) */}
                    <div style={styles.splitEditFields}>
                      {(!isMobile || mobileSubTab === 'main') && (
                        <div style={styles.editPaneMainCard}>
                          <label style={styles.fieldLabel}>📄 상세내용 편집화면</label>
                          <textarea
                            value={draftBody}
                            onChange={(e) => setDraftBody(e.target.value)}
                            placeholder="메모 기본 내용을 입력하세요... (URL 및 전화번호는 자동 링크로 변환됩니다)"
                            style={styles.editBodyTextarea}
                          />
                        </div>
                      )}

                      {(!isMobile || mobileSubTab === 'sub') && (
                        <div style={styles.editPaneSubCard}>
                          <label style={{ ...styles.fieldLabel, color: '#1E293B' }}>☑️ 체크리스트</label>
                          <textarea
                            value={draftSubBody}
                            onChange={(e) => setDraftSubBody(e.target.value)}
                            placeholder="체크리스트 항목, 추가 참고 링크, 보충 설명을 작성하세요..."
                            style={styles.editSubBodyTextarea}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={styles.splitReadContainer}>
                    {/* Left Card: Primary Note Content */}
                    {(!isMobile || mobileSubTab === 'main') && (
                      <div style={styles.leftPaneCard}>
                        <h1 style={styles.readTitle}>{activeItem.title}</h1>
                        <div style={styles.readBody}>
                          {renderWithLinks(activeItem.body)}
                        </div>
                      </div>
                    )}

                    {/* Right Card: Standalone Checklist Card */}
                    {(!isMobile || mobileSubTab === 'sub') && (
                      <div style={styles.rightPaneCard}>
                        <div style={styles.subNoteHeader}>
                          <span style={styles.subNoteTitle}>
                            <Bookmark size={16} color="#2563EB" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                            체크리스트
                          </span>
                        </div>
                        <div style={styles.subNoteBody}>
                          {activeItem.subBody ? (
                            renderWithLinks(activeItem.subBody)
                          ) : (
                            <span style={styles.subNoteEmptyText}>
                              등록된 체크리스트가 없습니다. 상단의 [수정] 버튼을 눌러 체크리스트 항목이나 보충 정보를 작성해보세요.
                            </span>
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
    marginBottom: '6px'
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

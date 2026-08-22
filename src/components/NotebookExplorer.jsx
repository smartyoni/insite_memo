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
  ArrowLeft
} from 'lucide-react';
import { renderWithLinks } from '../utils/linkify';

export default function NotebookExplorer() {
  // Data states
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Mobile responsiveness & navigation state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileView, setMobileView] = useState('categories'); // 'categories' | 'items' | 'detail'
  const [showExitToast, setShowExitToast] = useState(false);

  const lastBackPressRef = useRef(0);
  const exitToastTimerRef = useRef(null);

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

  // Detail View (Pane 3) states
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  const toastTimerRef = useRef(null);

  // Resize listener for mobile responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hardware/Browser Back button handling (popstate)
  useEffect(() => {
    // Initial history state setup
    window.history.replaceState({ view: 'categories' }, '');

    const handlePopState = (e) => {
      const stateView = e.state?.view;

      if (stateView === 'detail') {
        setMobileView('detail');
      } else if (stateView === 'items') {
        setMobileView('items');
      } else {
        // We are at root 'categories' level
        setMobileView('categories');

        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          // Double back press within 2 seconds -> Exit app / close
          try {
            window.close();
          } catch (err) {
            console.log('App exited');
          }
        } else {
          lastBackPressRef.current = now;
          // Push state to prevent immediate browser exit on first back press
          window.history.pushState({ view: 'categories' }, '');

          // Show "한번 더 누르면 앱이 종료됩니다." toast
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
    if (isMobile) {
      setMobileView('detail');
      window.history.pushState({ view: 'detail' }, '');
    }
  };

  const navigateBack = () => {
    window.history.back();
  };

  // 1. Subscribe to Categories (Top-level collection)
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const catList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setCategories(catList);

      // Auto-select first category if none selected
      if (catList.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(catList[0].id);
      }
    }, (err) => {
      console.error("Firestore categories snapshot error:", err);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Items (Top-level collection)
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

  // Get active selected item object
  const activeItem = items.find((item) => item.id === selectedItemId);
  const activeCategory = categories.find((cat) => cat.id === selectedCategoryId);

  // Sync draft state when active item changes or edit mode toggles
  useEffect(() => {
    if (activeItem) {
      setDraftTitle(activeItem.title || '');
      setDraftBody(activeItem.body || '');
    } else {
      setDraftTitle('');
      setDraftBody('');
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
    try {
      const batch = writeBatch(db);
      // Delete category doc
      batch.delete(doc(db, 'categories', catId));
      // Delete all child items belonging to this category
      const childItems = items.filter((item) => item.categoryId === catId);
      childItems.forEach((item) => {
        batch.delete(doc(db, 'items', item.id));
      });
      await batch.commit();

      setDeletingCategoryId(null);
      if (selectedCategoryId === catId) {
        const remaining = categories.filter((c) => c.id !== catId);
        setSelectedCategoryId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Error deleting category and child items:', err);
    }
  };

  // ---------------- Item Handlers ----------------
  const handleAddItem = async () => {
    if (!selectedCategoryId) return;
    try {
      const newRef = doc(collection(db, 'items'));
      await setDoc(newRef, {
        categoryId: selectedCategoryId,
        title: '새 메모',
        body: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      navigateToDetail(newRef.id);
      setDraftTitle('새 메모');
      setDraftBody('');
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
        updatedAt: serverTimestamp()
      });
      setIsEditMode(false);
      // Show 1.8 second "저장됨" toast notification
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
            <button
              onClick={() => setIsAddingCategory(true)}
              style={styles.iconBtnDark}
              title="카테고리 추가"
            >
              <Plus size={18} />
            </button>
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

            {categories.map((cat) => {
              const isSelected = cat.id === selectedCategoryId;
              const isEditing = cat.id === editingCategoryId;
              const isDeleting = cat.id === deletingCategoryId;

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
                  <Folder size={16} color={isSelected ? '#2563EB' : '#7C95B1'} style={{ flexShrink: 0 }} />

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

                  {/* Hover / Confirm Actions */}
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
              disabled={!selectedCategoryId}
              style={{
                ...styles.iconBtnLight,
                opacity: selectedCategoryId ? 1 : 0.4,
                cursor: selectedCategoryId ? 'pointer' : 'not-allowed'
              }}
              title="메모 추가"
            >
              <Plus size={18} />
            </button>
          </div>

          <div style={styles.paneContent}>
            {filteredItems.length === 0 ? (
              <div style={styles.emptyStateText}>
                {selectedCategoryId ? '등록된 메모가 없습니다.' : '카테고리를 선택하세요.'}
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
                    <span>{activeCategory?.name || '카테고리'}</span>
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

              {/* Content Body */}
              <div style={styles.pane3Body}>
                {isEditMode ? (
                  <div style={styles.editForm}>
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="제목을 입력하세요"
                      style={styles.editTitleInput}
                    />
                    <textarea
                      value={draftBody}
                      onChange={(e) => setDraftBody(e.target.value)}
                      placeholder="메모 내용을 입력하세요... (URL과 전화번호는 자동 링크로 변환됩니다)"
                      style={styles.editBodyTextarea}
                    />
                  </div>
                ) : (
                  <div style={styles.readView}>
                    <h1 style={styles.readTitle}>{activeItem.title}</h1>
                    <div style={styles.readBody}>
                      {renderWithLinks(activeItem.body)}
                    </div>
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
    padding: '0 16px',
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
    height: '52px',
    padding: '0 20px',
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
    padding: '7px 14px',
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
    padding: '7px 14px',
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
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600
  },

  pane3Body: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 20px'
  },
  pane3Empty: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAF8'
  },

  readView: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  readTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#22262A',
    marginBottom: '20px',
    lineHeight: 1.3
  },
  readBody: {
    fontSize: '15px',
    lineHeight: 1.7,
    color: '#3C3F42',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },

  editForm: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    height: '100%'
  },
  editTitleInput: {
    width: '100%',
    fontSize: '20px',
    fontWeight: 700,
    padding: '10px 14px',
    border: '1px solid #DCE0E6',
    borderRadius: '8px',
    outline: 'none',
    color: '#22262A',
    backgroundColor: '#FFFFFF'
  },
  editBodyTextarea: {
    width: '100%',
    minHeight: '400px',
    flex: 1,
    fontSize: '15px',
    lineHeight: 1.7,
    padding: '14px',
    border: '1px solid #DCE0E6',
    borderRadius: '8px',
    outline: 'none',
    color: '#3C3F42',
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

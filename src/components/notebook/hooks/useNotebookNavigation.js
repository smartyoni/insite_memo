import { useState, useEffect, useRef } from 'react';
import {
  ALL_FIXED_CATEGORY_IDS,
  LEGACY_INBOX_IDS,
  getScopeForTab,
  getDefaultCategoryIdForTab,
  saveStoredNavLocation,
} from '../notebookConstants';

export function useNotebookNavigation({
  initialNavLoc,
  activeMainTab,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedItemId,
  setSelectedItemId,
  selectedChecklistId,
  isAddingItem,
  setIsAddingItem,
  setNewItemTitle,
  itemInputRef,
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 860);
  const [mobileView, setMobileView] = useState(() => initialNavLoc?.mobileView || 'categories');
  const [mobileSubTab, setMobileSubTab] = useState(() => initialNavLoc?.mobileSubTab || 'main');
  const [showExitToast, setShowExitToast] = useState(false);

  const lastBackPressRef = useRef(0);
  const exitToastTimerRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

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

  // Automatically ensure history guard entry exists whenever mobileView becomes 'categories'
  useEffect(() => {
    if (!isMobile) return;
    if (mobileView === 'categories') {
      if (window.history.state?.view !== 'categories') {
        window.history.pushState({ view: 'categories' }, '');
      }
    }
  }, [isMobile, mobileView, activeMainTab]);

  // Hardware/Browser Back button handling (popstate)
  useEffect(() => {
    const initView = initialNavLoc?.mobileView || 'categories';
    if (initView !== 'categories') {
      window.history.replaceState({ view: 'categories' }, '');
      if (initView === 'items') {
        window.history.pushState({ view: 'items' }, '');
      } else if (initView === 'detail') {
        window.history.pushState({ view: 'items' }, '');
        window.history.pushState({ view: 'detail' }, '');
      }
    } else {
      if (window.history.state?.view !== 'categories') {
        window.history.pushState({ view: 'categories' }, '');
      }
    }

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
          window.history.back();
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
    setIsAddingItem(false);
    setNewItemTitle('');
    if (isMobile) {
      setMobileView('items');
      window.history.pushState({ view: 'items' }, '');
    }
  };

  useEffect(() => {
    if (isAddingItem && itemInputRef?.current) {
      itemInputRef.current.focus();
    }
  }, [isAddingItem, itemInputRef]);

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

  // Ensure valid selectedCategoryId when categories or tab change
  useEffect(() => {
    if (categories.length === 0) return;
    const isFixed = ALL_FIXED_CATEGORY_IDS.includes(selectedCategoryId);
    const currentTabScope = getScopeForTab(activeMainTab);
    const isValid = isFixed || categories.some(
      (c) => c.id === selectedCategoryId && (currentTabScope === 'explorer' ? (!c.scope || c.scope === 'explorer') : c.scope === currentTabScope)
    );
    if (!isValid || LEGACY_INBOX_IDS.includes(selectedCategoryId)) {
      const defId = getDefaultCategoryIdForTab(activeMainTab, categories);
      if (defId) {
        setSelectedCategoryId(defId);
      }
    }
  }, [categories, activeMainTab, selectedCategoryId, setSelectedCategoryId]);

  // Automatically save current navigation location to localStorage
  useEffect(() => {
    saveStoredNavLocation({
      activeMainTab,
      selectedCategoryId,
      selectedItemId,
      selectedChecklistId,
      mobileView,
      mobileSubTab,
    });
  }, [activeMainTab, selectedCategoryId, selectedItemId, selectedChecklistId, mobileView, mobileSubTab]);

  return {
    isMobile,
    setIsMobile,
    mobileView,
    setMobileView,
    mobileSubTab,
    setMobileSubTab,
    showExitToast,
    handleTouchStart,
    handleTouchEnd,
    navigateToItems,
    navigateToDetail,
    navigateBack,
  };
}

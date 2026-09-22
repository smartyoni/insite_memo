import React from 'react';

export function useWorkLocationHistory({
  activeMainTab,
  setActiveMainTab,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedItemId,
  setSelectedItemId,
  activeItem,
  items = [],
  isMobile,
  mobileView,
  setMobileView,
  navHistory = [],
  setNavHistory,
  isNavigatingBackRef
}) {
  const recordWorkLocation = (overrideLoc = null) => {
    const tab = overrideLoc?.tab || activeMainTab;
    const catId = overrideLoc?.catId || selectedCategoryId;
    const itemId = overrideLoc?.itemId || selectedItemId;
    const targetItem = items.find((i) => i.id === itemId) || activeItem;
    const itemTitle = overrideLoc?.itemTitle || targetItem?.title || (catId === 'quick_memo' ? '퀵메모' : '작업 메모');
    const mobView = isMobile ? (overrideLoc?.mobileView || mobileView || 'detail') : null;

    if (!catId && !itemId) return;

    const newLoc = {
      tab,
      catId,
      itemId,
      itemTitle,
      mobileView: mobView,
      timestamp: Date.now()
    };

    setNavHistory((prevStack) => {
      if (prevStack.length > 0) {
        const last = prevStack[prevStack.length - 1];
        if (last.tab === newLoc.tab && last.catId === newLoc.catId && last.itemId === newLoc.itemId) {
          const updated = [...prevStack];
          updated[updated.length - 1] = newLoc;
          return updated;
        }
      }
      const nextStack = [...prevStack, newLoc];
      return nextStack.length > 30 ? nextStack.slice(nextStack.length - 30) : nextStack;
    });
  };

  const previousWorkTarget = React.useMemo(() => {
    if (navHistory.length === 0) return null;
    const last = navHistory[navHistory.length - 1];
    const isCurrent =
      last.tab === activeMainTab &&
      last.catId === selectedCategoryId &&
      last.itemId === selectedItemId;

    if (isCurrent) {
      return navHistory.length > 1 ? navHistory[navHistory.length - 2] : null;
    }
    return last;
  }, [navHistory, activeMainTab, selectedCategoryId, selectedItemId]);

  const handleReturnPrevious = () => {
    if (!previousWorkTarget) return;

    setNavHistory((prevStack) => {
      if (prevStack.length === 0) return prevStack;

      let nextStack = [...prevStack];
      let targetLoc = nextStack[nextStack.length - 1];

      const isCurrent =
        targetLoc.tab === activeMainTab &&
        targetLoc.catId === selectedCategoryId &&
        targetLoc.itemId === selectedItemId;

      if (isCurrent) {
        nextStack.pop(); // 현재 작업 위치 제거
        if (nextStack.length === 0) return [];
        targetLoc = nextStack[nextStack.length - 1];
      }

      nextStack.pop(); // 복귀할 대상 위치 제거

      if (isNavigatingBackRef) isNavigatingBackRef.current = true;
      if (targetLoc.tab && targetLoc.tab !== activeMainTab) {
        setActiveMainTab(targetLoc.tab);
      }
      if (targetLoc.catId) {
        setSelectedCategoryId(targetLoc.catId);
      }
      setSelectedItemId(targetLoc.itemId || null);

      if (isMobile) {
        if (targetLoc.mobileView) {
          setMobileView(targetLoc.mobileView);
        } else if (targetLoc.itemId) {
          setMobileView('detail');
        } else {
          setMobileView('items');
        }
      }

      return nextStack;
    });
  };

  return {
    recordWorkLocation,
    previousWorkTarget,
    handleReturnPrevious
  };
}

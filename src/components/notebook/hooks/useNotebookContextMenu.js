import { useState, useEffect } from 'react';
import {
  getCategoryFullPath as getCategoryFullPathFn,
  getItemFullPath as getItemFullPathFn
} from '../notebookHelpers';

export function useNotebookContextMenu({
  categories = [],
  categoryGroups = [],
  mainTabs = [],
  activeMainTab,
  setActiveMainTab,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedItemId,
  setSelectedItemId,
  items = [],
  setCopyToastText,
  copyToastTimerRef
}) {
  const [categoryContextMenu, setCategoryContextMenu] = useState(null); // { x, y, category }
  const [itemContextMenu, setItemContextMenu] = useState(null); // { x, y, item }
  const [returnLocation, setReturnLocation] = useState(null); // { tab, categoryId, categoryName, itemId }

  const getCategoryFullPath = (cat) => getCategoryFullPathFn(cat, categories, categoryGroups, mainTabs, activeMainTab);
  const getItemFullPath = (it) => getItemFullPathFn(it, categories, categoryGroups, mainTabs, activeMainTab);

  const copyTextToClipboard = async (text, toastMsg) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      if (setCopyToastText) setCopyToastText(toastMsg || '✓ 복사되었습니다.');
      if (copyToastTimerRef && copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
      if (copyToastTimerRef) {
        copyToastTimerRef.current = setTimeout(() => {
          if (setCopyToastText) setCopyToastText('');
        }, 2000);
      }
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  const handleCategoryContextMenu = (e, cat) => {
    e.preventDefault();
    e.stopPropagation();
    const clickX = e.clientX;
    const clickY = e.clientY;
    const menuWidth = 180;
    const menuHeight = 85;
    const adjustedX = (clickX + menuWidth > window.innerWidth) ? Math.max(10, window.innerWidth - menuWidth - 10) : clickX;
    const adjustedY = (clickY + menuHeight > window.innerHeight) ? Math.max(10, window.innerHeight - menuHeight - 10) : clickY;

    setCategoryContextMenu({
      x: adjustedX,
      y: adjustedY,
      category: cat
    });
  };

  const handleCopyCategoryPath = async (cat) => {
    if (!cat) return;
    setCategoryContextMenu(null);
    const pathStr = getCategoryFullPath(cat);
    await copyTextToClipboard(pathStr, `✓ '${pathStr}' 경로가 복사되었습니다.`);
  };

  const handleCopyCategoryLink = async (cat) => {
    if (!cat) return;
    setCategoryContextMenu(null);
    const catId = cat.id;
    const catName = cat.name || (catId === 'quick_memo' ? '퀵메모' : '목록');
    const scope = cat.scope || activeMainTab || 'explorer';

    const origin = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const linkUrl = `${origin}#tab=${encodeURIComponent(scope)}&cat=${encodeURIComponent(catId)}`;
    const markdownLink = `[${catName}](${linkUrl})`;

    await copyTextToClipboard(markdownLink, `✓ '${catName}' 목록 주소가 복사되었습니다.`);
  };

  const handleItemContextMenu = (e, it) => {
    e.preventDefault();
    e.stopPropagation();
    const clickX = e.clientX;
    const clickY = e.clientY;
    const menuWidth = 190;
    const menuHeight = 85;
    const adjustedX = (clickX + menuWidth > window.innerWidth) ? Math.max(10, window.innerWidth - menuWidth - 10) : clickX;
    const adjustedY = (clickY + menuHeight > window.innerHeight) ? Math.max(10, window.innerHeight - menuHeight - 10) : clickY;

    setItemContextMenu({
      x: adjustedX,
      y: adjustedY,
      item: it
    });
  };

  const handleCopyItemPath = async (it) => {
    if (!it) return;
    setItemContextMenu(null);
    const pathStr = getItemFullPath(it);
    await copyTextToClipboard(pathStr, `✓ '${pathStr}' 경로가 복사되었습니다.`);
  };

  const handleCopyItemLink = async (it) => {
    if (!it) return;
    setItemContextMenu(null);
    const title = it.title || '메모';
    const origin = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const scope = it.scope || activeMainTab || 'explorer';
    const linkUrl = `${origin}#tab=${encodeURIComponent(scope)}&cat=${encodeURIComponent(it.categoryId || 'quick_memo')}&item=${encodeURIComponent(it.id)}`;
    const markdownLink = `[${title}](${linkUrl})`;

    await copyTextToClipboard(markdownLink, `✓ '${title}' 메모 주소가 복사되었습니다.`);
  };

  const handleReturnToPreviousLocation = () => {
    if (!returnLocation) return;
    if (returnLocation.tab && returnLocation.tab !== activeMainTab && setActiveMainTab) {
      setActiveMainTab(returnLocation.tab);
    }
    if (returnLocation.categoryId && setSelectedCategoryId) {
      setSelectedCategoryId(returnLocation.categoryId);
    }
    if (returnLocation.itemId && setSelectedItemId) {
      setSelectedItemId(returnLocation.itemId);
    }
    setReturnLocation(null);
  };

  // Listen to deep-link hash navigation from [title](url) clicks
  useEffect(() => {
    const handleAppNavigateHash = (e) => {
      const { url } = e.detail || {};
      if (!url) return;

      try {
        const hashIdx = url.indexOf('#');
        const hashStr = hashIdx !== -1 ? url.slice(hashIdx + 1) : url;
        const params = new URLSearchParams(hashStr);
        const targetTab = params.get('tab');
        const targetCat = params.get('cat');

        if (targetCat) {
          // Save current return location
          const currentCat = categories.find((c) => c.id === selectedCategoryId);
          const currentItem = items.find((i) => i.id === selectedItemId);
          const fromLabel = currentItem?.title
            ? `메모: ${currentItem.title.slice(0, 15)}`
            : (selectedCategoryId === 'quick_memo' ? '퀵메모' : (currentCat?.name || '이전 작업'));

          setReturnLocation({
            tab: activeMainTab,
            categoryId: selectedCategoryId,
            categoryName: fromLabel,
            itemId: selectedItemId
          });

          if (targetTab && targetTab !== activeMainTab && setActiveMainTab) {
            setActiveMainTab(targetTab);
          }
          if (setSelectedCategoryId) setSelectedCategoryId(targetCat);
          if (setSelectedItemId) setSelectedItemId(null);

          const fullHash = `#tab=${targetTab || activeMainTab}&cat=${targetCat}`;
          if (window.location.hash !== fullHash) {
            window.history.pushState(null, '', fullHash);
          }
        }
      } catch (err) {
        console.error('Error handling deep-link navigation:', err);
      }
    };

    window.addEventListener('app-navigate-hash', handleAppNavigateHash);
    return () => {
      window.removeEventListener('app-navigate-hash', handleAppNavigateHash);
    };
  }, [activeMainTab, selectedCategoryId, selectedItemId, categories, items]);

  // Browser back/forward button support for URL hash
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined' || !window.location.hash) return;
      try {
        const hashStr = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
        const params = new URLSearchParams(hashStr);
        const targetTab = params.get('tab');
        const targetCat = params.get('cat');
        if (targetCat) {
          if (targetTab && setActiveMainTab) setActiveMainTab(targetTab);
          if (setSelectedCategoryId) setSelectedCategoryId(targetCat);
          if (setSelectedItemId) setSelectedItemId(null);
        }
      } catch (e) {}
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Close category & item context menus on global click
  useEffect(() => {
    if (!categoryContextMenu && !itemContextMenu) return;
    const handleCloseContextMenu = () => {
      setCategoryContextMenu(null);
      setItemContextMenu(null);
    };
    window.addEventListener('click', handleCloseContextMenu);
    window.addEventListener('contextmenu', handleCloseContextMenu);
    return () => {
      window.removeEventListener('click', handleCloseContextMenu);
      window.removeEventListener('contextmenu', handleCloseContextMenu);
    };
  }, [categoryContextMenu, itemContextMenu]);

  return {
    categoryContextMenu,
    setCategoryContextMenu,
    itemContextMenu,
    setItemContextMenu,
    returnLocation,
    setReturnLocation,
    copyTextToClipboard,
    handleCategoryContextMenu,
    handleCopyCategoryPath,
    handleCopyCategoryLink,
    handleItemContextMenu,
    handleCopyItemPath,
    handleCopyItemLink,
    handleReturnToPreviousLocation
  };
}

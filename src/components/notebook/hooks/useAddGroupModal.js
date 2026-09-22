import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export function useAddGroupModal({
  activeItem,
  recordWorkLocation,
  baseChecklists,
  updateCollapsedSections,
  isEditMode,
  setDraftChecklists,
  setSelectedChecklistId,
  setChecklistDetailDraft,
  setChecklistDetailBlocks,
  setEditingCheckId,
  setEditingCheckText,
  setEditingCheckTag,
  setCustomTagInput,
  isMobile,
  setMobileSubTab,
  setItems,
  db,
}) {
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState('');
  const [groupModalPos, setGroupModalPos] = useState(null);

  const handleOpenAddGroupModal = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const modalWidth = 260;
    let right = window.innerWidth - rect.right;
    if (right < 10) right = 10;
    if (rect.right - modalWidth < 10) right = Math.max(10, window.innerWidth - 270);
    setGroupModalPos({ top: rect.bottom + 6, right });
    setNewGroupNameInput('');
    setShowAddGroupModal(true);
  };

  const handleCreateGroupFromModal = async () => {
    if (!activeItem || !newGroupNameInput.trim()) return;
    if (typeof recordWorkLocation === 'function') {
      recordWorkLocation();
    }
    const sectionName = newGroupNameInput.trim();
    const newSectionId = 'sec_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6);
    const newSection = {
      id: newSectionId,
      isSection: true,
      type: 'section',
      text: sectionName,
    };
    const firstItemId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6);
    const firstItem = {
      id: firstItemId,
      text: '',
      completed: false,
      detail: '',
      detailBlocks: [],
    };
    const updated = [...(baseChecklists || []), newSection, firstItem];
    setShowAddGroupModal(false);
    setNewGroupNameInput('');

    if (typeof updateCollapsedSections === 'function') {
      updateCollapsedSections((prev) => ({ ...prev, [newSectionId]: false }));
    }

    if (isEditMode) {
      setDraftChecklists(updated);
    }
    setSelectedChecklistId(firstItemId);
    setChecklistDetailDraft('');
    setChecklistDetailBlocks([]);
    setEditingCheckId(firstItemId);
    setEditingCheckText('');
    setEditingCheckTag('');
    setCustomTagInput('');
    if (isMobile) {
      setMobileSubTab('main');
    }

    // 로컬 낙관적 업데이트
    setItems((prevItems) => prevItems.map((it) => (it.id === activeItem.id ? { ...it, checklists: updated } : it)));

    try {
      await updateDoc(doc(db, 'items', activeItem.id), {
        checklists: updated,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error adding checklist section:', err);
    }
  };

  return {
    showAddGroupModal,
    setShowAddGroupModal,
    newGroupNameInput,
    setNewGroupNameInput,
    groupModalPos,
    setGroupModalPos,
    handleOpenAddGroupModal,
    handleCreateGroupFromModal,
  };
}

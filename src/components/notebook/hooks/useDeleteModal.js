import { useState, useRef, useEffect } from 'react';

export function useDeleteModal() {
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const deleteConfirmBtnRef = useRef(null);
  const isDeletingRef = useRef(false);

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
    if (isDeletingRef.current) return;
    if (deleteModalState.onConfirm) {
      isDeletingRef.current = true;
      const confirmFn = deleteModalState.onConfirm;
      closeDeleteModal();
      try {
        await confirmFn();
      } catch (err) {
        console.error('Delete execution error:', err);
      } finally {
        isDeletingRef.current = false;
      }
    } else {
      closeDeleteModal();
    }
  };

  // 모달 오픈 시 기본 선택(삭제 버튼)에 포커스
  useEffect(() => {
    if (deleteModalState.isOpen) {
      const timer = setTimeout(() => {
        deleteConfirmBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [deleteModalState.isOpen]);

  return {
    deleteModalState,
    setDeleteModalState,
    deleteConfirmBtnRef,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete
  };
}

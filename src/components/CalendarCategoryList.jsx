import React, { useState } from 'react';
import { Plus, Check, Edit2, Trash2, Tag, Calendar, Layers } from 'lucide-react';

export default function CalendarCategoryList({
  categories = [],
  selectedCategoryId = 'all',
  onSelectCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  events = []
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');

  // 범주별 일정 개수 계산
  const getEventCount = (catId) => {
    if (catId === 'all') {
      return events.filter(e => !e.isDeleted).length;
    }
    return events.filter(e => !e.isDeleted && e.categoryId === catId).length;
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setIsAdding(false);
      return;
    }
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newCategory = {
      id: 'cat_' + Date.now(),
      name: newCatName.trim(),
      color: randomColor,
      isDefault: false,
      isDeleted: false,
      order: categories.length
    };

    onAddCategory(newCategory);
    setNewCatName('');
    setIsAdding(false);
  };

  const handleStartEdit = (cat, e) => {
    e.stopPropagation();
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleSaveEdit = (catId, e) => {
    e.stopPropagation();
    if (editingCatName.trim()) {
      onUpdateCategory(catId, { name: editingCatName.trim() });
    }
    setEditingCatId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F8FAFC' }}>
      {/* 2열 상단 헤더 */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={16} color="#3B82F6" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>일정 범주</span>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1D4ED8',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="새 범주 추가"
        >
          <Plus size={13} />
          <span>범주 추가</span>
        </button>
      </div>

      {/* 범주 목록 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {/* '전체 일정' 옵션 */}
        <div
          onClick={() => onSelectCategory('all')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderRadius: '8px',
            marginBottom: '4px',
            cursor: 'pointer',
            backgroundColor: selectedCategoryId === 'all' ? '#E0E7FF' : 'transparent',
            color: selectedCategoryId === 'all' ? '#3730A3' : '#334155',
            fontWeight: selectedCategoryId === 'all' ? 700 : 500,
            fontSize: '13px',
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => {
            if (selectedCategoryId !== 'all') e.currentTarget.style.backgroundColor = '#F1F5F9';
          }}
          onMouseLeave={(e) => {
            if (selectedCategoryId !== 'all') e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} color={selectedCategoryId === 'all' ? '#4F46E5' : '#64748B'} />
            <span>전체 일정</span>
          </div>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '10px',
              backgroundColor: selectedCategoryId === 'all' ? '#C7D2FE' : '#E2E8F0',
              color: selectedCategoryId === 'all' ? '#312E81' : '#64748B'
            }}
          >
            {getEventCount('all')}
          </span>
        </div>

        {/* 개별 범주 리스트: 전체 일정 바로 아래에 [할일] 범주 고정 */}
        {(() => {
          const validCats = categories.filter((c) => !c.isDeleted);
          const todoCat = validCats.find((c) => c.id === 'cat_todo') || { id: 'cat_todo', name: '할일', color: '#3B82F6', isDefault: true, order: 0 };
          const otherCats = validCats.filter((c) => c.id !== 'cat_todo');
          const orderedCategories = [todoCat, ...otherCats];

          return orderedCategories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const isEditing = editingCatId === cat.id;
            const count = getEventCount(cat.id);

          return (
            <div
              key={cat.id}
              onClick={() => !isEditing && onSelectCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: '8px',
                marginBottom: '4px',
                cursor: isEditing ? 'default' : 'pointer',
                backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                border: `1px solid ${isSelected ? '#93C5FD' : '#E2E8F0'}`,
                color: isSelected ? '#1D4ED8' : '#334155',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '13px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !isEditing) e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !isEditing) e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: cat.color || '#3B82F6',
                    flexShrink: 0
                  }}
                />
                {isEditing ? (
                  <input
                    type="text"
                    value={editingCatName}
                    onChange={(e) => setEditingCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(cat.id, e);
                      if (e.key === 'Escape') setEditingCatId(null);
                    }}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '2px 6px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '1px solid #3B82F6',
                      outline: 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.name}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={(e) => handleSaveEdit(cat.id, e)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#059669',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                    title="저장"
                  >
                    <Check size={14} />
                  </button>
                ) : (
                  <>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? '#DBEAFE' : '#F1F5F9',
                        color: isSelected ? '#1E40AF' : '#64748B',
                        marginRight: '2px'
                      }}
                    >
                      {count}
                    </span>
                    {!cat.isDefault && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(cat, e)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          title="수정"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`'${cat.name}' 범주를 삭제하시겠습니까?`)) {
                              onDeleteCategory(cat.id);
                            }
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          title="삭제"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        });
        })()}

        {/* 새 범주 추가 입력창 */}
        {isAdding && (
          <form
            onSubmit={handleCreateCategory}
            style={{
              marginTop: '6px',
              padding: '8px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #3B82F6',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)'
            }}
          >
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="새 범주명 입력..."
              autoFocus
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                borderRadius: '5px',
                border: '1px solid #CBD5E1',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewCatName('');
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#64748B',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                type="submit"
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                추가
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

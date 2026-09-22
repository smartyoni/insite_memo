import React, { useState } from 'react';
import { Layout, X, Search, ChevronRight, ChevronDown, FileText } from 'lucide-react';

export default function Template2Modal({
  isOpen,
  onClose,
  categories = [],
  items = [],
  templates = [],
  templates2 = [],
  getHierarchicalCategoryOptions,
  onApplyTemplate
}) {
  const [template2SearchKeyword, setTemplate2SearchKeyword] = useState('');
  const [template2ApplyMode, setTemplate2ApplyMode] = useState('replace');
  const [collapsedTplCatIds, setCollapsedTplCatIds] = useState({});

  if (!isOpen) return null;

  return (
        <div
          onClick={() => onClose()}
          style={{
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
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '580px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #F1F5F9',
                backgroundColor: '#FAF5FF'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ backgroundColor: '#7C3AED', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layout size={18} color="#FFFFFF" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E1B4B' }}>
                    템플릿 적용
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6B7280' }}>
                    미리 구성해 둔 템플릿 서식(체크리스트 및 세부 항목)을 현재 메모에 적용합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search and Apply Mode Option Bar */}
            <div style={{ padding: '14px 20px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={template2SearchKeyword}
                  onChange={(e) => setTemplate2SearchKeyword(e.target.value)}
                  placeholder="템플릿명 또는 카테고리 검색..."
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 32px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#7C3AED'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
                />
                {template2SearchKeyword && (
                  <button
                    type="button"
                    onClick={() => setTemplate2SearchKeyword('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="검색어 지우기"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Mode Selection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>적용 방식:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#1E293B', cursor: 'pointer', fontWeight: template2ApplyMode === 'replace' ? 700 : 500 }}>
                  <input
                    type="radio"
                    name="template2Mode"
                    value="replace"
                    checked={template2ApplyMode === 'replace'}
                    onChange={() => setTemplate2ApplyMode('replace')}
                    style={{ accentColor: '#7C3AED', cursor: 'pointer' }}
                  />
                  기존 내용 대체 (권장)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#1E293B', cursor: 'pointer', fontWeight: template2ApplyMode === 'append' ? 700 : 500 }}>
                  <input
                    type="radio"
                    name="template2Mode"
                    value="append"
                    checked={template2ApplyMode === 'append'}
                    onChange={() => setTemplate2ApplyMode('append')}
                    style={{ accentColor: '#7C3AED', cursor: 'pointer' }}
                  />
                  기존 내용 뒤에 추가
                </label>
              </div>
            </div>

            {/* Hierarchical Template Items by Category */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(() => {
                const q = (template2SearchKeyword || '').trim().toLowerCase();

                // 1. Template2 scope categories in hierarchy
                const hierarchicalCats = getHierarchicalCategoryOptions('template2');
                const tpl2CategoryIds = new Set(categories.filter(c => c.scope === 'template2' && c.id !== 'template2_trash').map(c => c.id));
                const tpl2Items = items.filter(it => tpl2CategoryIds.has(it.categoryId) && (it.categoryId !== 'template2_trash') && !it.isDeleted);

                // Group templates by category
                const groups = [];

                hierarchicalCats.forEach(cat => {
                  let matchedItems = tpl2Items.filter(it => it.categoryId === cat.id);
                  if (q) {
                    matchedItems = matchedItems.filter(it => 
                      (it.title || '').toLowerCase().includes(q) ||
                      (cat.name || '').toLowerCase().includes(q)
                    );
                  }
                  if (matchedItems.length > 0) {
                    groups.push({
                      id: cat.id,
                      name: cat.name,
                      displayName: cat.displayName || cat.name,
                      level: cat.level || 0,
                      items: matchedItems
                    });
                  }
                });

                // Unassigned items if any
                const assignedItemIds = new Set(groups.flatMap(g => g.items.map(it => it.id)));
                let unassignedItems = tpl2Items.filter(it => !assignedItemIds.has(it.id));
                if (q) {
                  unassignedItems = unassignedItems.filter(it => (it.title || '').toLowerCase().includes(q));
                }
                if (unassignedItems.length > 0) {
                  groups.push({
                    id: '__unassigned__',
                    name: '기타 미분류 템플릿',
                    displayName: '📁 기타 미분류 템플릿',
                    level: 0,
                    items: unassignedItems
                  });
                }

                // Presets if any
                let presetItems = templates2 || [];
                if (q) {
                  presetItems = presetItems.filter(t => 
                    (t.title || '').toLowerCase().includes(q) || '템플릿 프리셋'.includes(q)
                  );
                }
                if (presetItems.length > 0) {
                  groups.push({
                    id: '__presets__',
                    name: '템플릿 프리셋',
                    displayName: '⭐ 템플릿 프리셋',
                    level: 0,
                    items: presetItems
                  });
                }

                if (groups.length === 0) {
                  return (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                      {q ? (
                        <>검색어 <strong>"{template2SearchKeyword}"</strong>와 일치하는 템플릿이 없습니다.</>
                      ) : (
                        <>
                          등록된 템플릿이 없습니다.<br />
                          상단 탭의 <strong>[템플릿]</strong> 메뉴에서 카테고리를 만들고 템플릿 메모를 먼저 작성해보세요.
                        </>
                      )}
                    </div>
                  );
                }

                return groups.map((grp) => {
                  const isCollapsed = !!collapsedTplCatIds[grp.id];

                  return (
                    <div
                      key={grp.id}
                      style={{
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        overflow: 'hidden',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
                      }}
                    >
                      {/* Category Group Header (Clickable Accordion) */}
                      <div
                        onClick={() => {
                          setCollapsedTplCatIds(prev => ({
                            ...prev,
                            [grp.id]: !prev[grp.id]
                          }));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 14px',
                          backgroundColor: '#F8FAFC',
                          cursor: 'pointer',
                          userSelect: 'none',
                          borderBottom: isCollapsed ? 'none' : '1px solid #E2E8F0',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                        title="카테고리 접기 / 펼치기"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span style={{ color: '#64748B', display: 'flex', alignItems: 'center' }}>
                            {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                          </span>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#334155',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {grp.displayName}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#64748B',
                          backgroundColor: '#E2E8F0',
                          padding: '1px 7px',
                          borderRadius: '10px',
                          flexShrink: 0
                        }}>
                          {grp.items.length}개
                        </span>
                      </div>

                      {/* Template Item Rows under this category */}
                      {!isCollapsed && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {grp.items.map((tpl, itemIdx) => (
                            <div
                              key={tpl.id}
                              onClick={() => onApplyTemplate(tpl, template2ApplyMode)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                borderBottom: itemIdx < grp.items.length - 1 ? '1px solid #F1F5F9' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                backgroundColor: '#FFFFFF'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#FAF5FF';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                <FileText size={15} color="#7C3AED" style={{ flexShrink: 0 }} />
                                <span style={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#1E293B',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {tpl.title || '제목 없는 템플릿'}
                                </span>
                              </div>
                              <button
                                type="button"
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '5px',
                                  border: '1px solid #C4B5FD',
                                  backgroundColor: '#F5F3FF',
                                  color: '#7C3AED',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#7C3AED';
                                  e.currentTarget.style.color = '#FFFFFF';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#F5F3FF';
                                  e.currentTarget.style.color = '#7C3AED';
                                }}
                              >
                                적용
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '12px 20px',
                backgroundColor: '#F8FAFC',
                borderTop: '1px solid #E2E8F0'
              }}
            >
              <button
                type="button"
                onClick={() => onClose()}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
  );
}

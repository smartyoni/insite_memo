import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  X,
  Check,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  Clock,
  Tag,
  ListChecks
} from 'lucide-react';
import { renderWithLinks } from '../utils/linkify';

// Colorful badge background colors like Google Calendar
const CHIP_COLORS = [
  { bg: '#E0F2FE', border: '#7DD3FC', text: '#0369A1' }, // Sky
  { bg: '#DCFCE7', border: '#86EFAC', text: '#15803D' }, // Emerald
  { bg: '#FEE2E2', border: '#FCA5A5', text: '#B91C1C' }, // Rose
  { bg: '#FEF3C7', border: '#FDE047', text: '#B45309' }, // Amber
  { bg: '#F3E8FF', border: '#D8B4FE', text: '#7E22CE' }, // Purple
  { bg: '#E0E7FF', border: '#A5B4FC', text: '#4338CA' }  // Indigo
];

function getChipColor(idStr) {
  let hash = 0;
  for (let i = 0; i < (idStr || '').length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CHIP_COLORS.length;
  return CHIP_COLORS[index];
}

// Format Date object to YYYY-MM-DD
function formatDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CalendarView({
  items = [],
  categories = [],
  onNavigateToDetail,
  openDeleteModal
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'

  // Modal for adding/editing event
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null); // null = new event
  const [eventDate, setEventDate] = useState(formatDateKey(new Date()));
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategoryId, setEventCategoryId] = useState('inbox');
  const [eventBody, setEventBody] = useState('');
  const [eventChecklists, setEventChecklists] = useState([]);
  const [newCheckText, setNewCheckText] = useState('');

  // Year & Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open modal to add event for a specific date
  const handleOpenAddModal = (dateStr) => {
    setSelectedEventId(null);
    setEventDate(dateStr);
    setEventTitle('');
    setEventCategoryId(categories[0]?.id || 'inbox');
    setEventBody('');
    setEventChecklists([]);
    setNewCheckText('');
    setShowEventModal(true);
  };

  // Open modal to edit existing event
  const handleOpenEditModal = (item, e) => {
    if (e) e.stopPropagation();
    setSelectedEventId(item.id);
    setEventDate(getItemDateKey(item));
    setEventTitle(item.title || '');
    setEventCategoryId(item.categoryId || 'inbox');
    setEventBody(item.body || '');
    setEventChecklists(item.checklists || []);
    setNewCheckText('');
    setShowEventModal(true);
  };

  // Extract YYYY-MM-DD from item (custom date field or createdAt fallback)
  function getItemDateKey(item) {
    if (item.date) return item.date;
    if (item.createdAt && item.createdAt.toDate) {
      return formatDateKey(item.createdAt.toDate());
    }
    return formatDateKey(new Date());
  }

  // Save event (Create or Update)
  const handleSaveEvent = async () => {
    if (!eventTitle.trim()) return;

    try {
      if (selectedEventId) {
        // Update existing item
        await updateDoc(doc(db, 'items', selectedEventId), {
          title: eventTitle.trim(),
          date: eventDate,
          categoryId: eventCategoryId,
          body: eventBody,
          checklists: eventChecklists,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new item
        const newRef = doc(collection(db, 'items'));
        await setDoc(newRef, {
          title: eventTitle.trim(),
          date: eventDate,
          categoryId: eventCategoryId,
          body: eventBody,
          checklists: eventChecklists,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setShowEventModal(false);
    } catch (err) {
      console.error('Error saving calendar event:', err);
    }
  };

  // Checklist helper in modal
  const handleAddCheckInModal = () => {
    if (!newCheckText.trim()) return;
    const newItem = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      text: newCheckText.trim(),
      completed: false
    };
    setEventChecklists([...eventChecklists, newItem]);
    setNewCheckText('');
  };

  const handleToggleCheckInModal = (id) => {
    setEventChecklists(
      eventChecklists.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  const handleDeleteCheckInModal = (id) => {
    setEventChecklists(eventChecklists.filter((c) => c.id !== id));
  };

  // Generate Calendar Grid Days
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells = [];

  // Previous month padding days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
    calendarCells.push({
      date: prevDate,
      dateKey: formatDateKey(prevDate),
      isCurrentMonth: false,
      dayNum: daysInPrevMonth - i
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    calendarCells.push({
      date: curDate,
      dateKey: formatDateKey(curDate),
      isCurrentMonth: true,
      dayNum: d
    });
  }

  // Next month padding days to complete 35 or 42 grid cells
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    calendarCells.push({
      date: nextDate,
      dateKey: formatDateKey(nextDate),
      isCurrentMonth: false,
      dayNum: i
    });
  }

  // Group items by dateKey
  const itemsByDate = {};
  items.forEach((item) => {
    const key = getItemDateKey(item);
    if (!itemsByDate[key]) itemsByDate[key] = [];
    itemsByDate[key].push(item);
  });

  const todayKey = formatDateKey(new Date());

  return (
    <div style={styles.container}>
      {/* Google Calendar Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <div style={styles.brandGroup}>
            <CalendarIcon size={22} color="#2563EB" />
            <span style={styles.brandTitle}>구글 캘린더</span>
          </div>

          <button onClick={handleToday} style={styles.todayBtn}>
            오늘
          </button>

          <div style={styles.navGroup}>
            <button onClick={handlePrevMonth} style={styles.navBtn} title="이전 달">
              <ChevronLeft size={18} />
            </button>
            <button onClick={handleNextMonth} style={styles.navBtn} title="다음 달">
              <ChevronRight size={18} />
            </button>
          </div>

          <span style={styles.monthTitle}>
            {year}년 {month + 1}월
          </span>
        </div>

        <div style={styles.toolbarRight}>
          <div style={styles.viewModeGroup}>
            <button
              onClick={() => setViewMode('month')}
              style={{
                ...styles.viewModeBtn,
                backgroundColor: viewMode === 'month' ? '#2563EB' : 'transparent',
                color: viewMode === 'month' ? '#FFFFFF' : '#475569'
              }}
            >
              월간
            </button>
            <button
              onClick={() => setViewMode('week')}
              style={{
                ...styles.viewModeBtn,
                backgroundColor: viewMode === 'week' ? '#2563EB' : 'transparent',
                color: viewMode === 'week' ? '#FFFFFF' : '#475569'
              }}
            >
              주간
            </button>
          </div>

          <button
            onClick={() => handleOpenAddModal(todayKey)}
            style={styles.createBtn}
            title="새 일정 / 메모 생성"
          >
            <Plus size={16} />
            <span>만들기</span>
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div style={styles.weekHeaderGrid}>
        {['일', '월', '화', '수', '목', '금', '토'].map((dayName, idx) => (
          <div
            key={dayName}
            style={{
              ...styles.weekHeaderCell,
              color: idx === 0 ? '#EF4444' : idx === 6 ? '#2563EB' : '#64748B'
            }}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Month Grid Cells */}
      <div style={styles.monthGrid}>
        {calendarCells.map((cell, idx) => {
          const isToday = cell.dateKey === todayKey;
          const dayItems = itemsByDate[cell.dateKey] || [];
          const isSunday = idx % 7 === 0;
          const isSaturday = idx % 7 === 6;

          return (
            <div
              key={cell.dateKey + '_' + idx}
              onClick={() => handleOpenAddModal(cell.dateKey)}
              style={{
                ...styles.cell,
                backgroundColor: cell.isCurrentMonth ? '#FFFFFF' : '#F8FAFC'
              }}
            >
              {/* Date Number Header */}
              <div style={styles.cellHeader}>
                <span
                  style={{
                    ...styles.dayNumBadge,
                    backgroundColor: isToday ? '#2563EB' : 'transparent',
                    color: isToday
                      ? '#FFFFFF'
                      : !cell.isCurrentMonth
                      ? '#CBD5E1'
                      : isSunday
                      ? '#EF4444'
                      : isSaturday
                      ? '#2563EB'
                      : '#1E293B'
                  }}
                >
                  {cell.dayNum}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAddModal(cell.dateKey);
                  }}
                  style={styles.cellAddBtn}
                  title="일정 추가"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Event Chips */}
              <div style={styles.chipsContainer}>
                {dayItems.slice(0, 4).map((item) => {
                  const color = getChipColor(item.id);
                  const hasChecklist = item.checklists && item.checklists.length > 0;
                  const doneChecklist = hasChecklist
                    ? item.checklists.filter((c) => c.completed).length
                    : 0;

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => handleOpenEditModal(item, e)}
                      style={{
                        ...styles.eventChip,
                        backgroundColor: color.bg,
                        borderColor: color.border,
                        color: color.text
                      }}
                      title={item.title}
                    >
                      <span style={styles.chipText}>
                        {hasChecklist && '☑️ '}
                        {item.title || '제목 없음'}
                      </span>

                      {hasChecklist && (
                        <span style={styles.chipCheckCount}>
                          ({doneChecklist}/{item.checklists.length})
                        </span>
                      )}
                    </div>
                  );
                })}

                {dayItems.length > 4 && (
                  <div style={styles.moreChipsBadge}>
                    +{dayItems.length - 4}개 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Google Calendar Event Add/Edit Modal */}
      {showEventModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEventModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {selectedEventId ? '일정 / 메모 수정' : '새 일정 / 메모 작성'}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Event Title */}
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="제목을 입력하세요 (예: 미팅, 계약건 검토)"
                style={styles.modalTitleInput}
                autoFocus
              />

              {/* Date & Category Selection Row */}
              <div style={styles.metaRow}>
                <div style={styles.metaField}>
                  <Clock size={15} color="#64748B" />
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    style={styles.dateInput}
                  />
                </div>

                <div style={styles.metaField}>
                  <Tag size={15} color="#64748B" />
                  <select
                    value={eventCategoryId}
                    onChange={(e) => setEventCategoryId(e.target.value)}
                    style={styles.categorySelect}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Main Body Textarea */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>📄 메모 상세 내용</label>
                <textarea
                  rows={4}
                  value={eventBody}
                  onChange={(e) => setEventBody(e.target.value)}
                  placeholder="일정이나 메모 상세 설명을 입력하세요..."
                  style={styles.modalTextarea}
                />
              </div>

              {/* Checklist Section */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>☑️ 체크리스트</label>

                <div style={styles.modalCheckInputGroup}>
                  <input
                    type="text"
                    value={newCheckText}
                    onChange={(e) => setNewCheckText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCheckInModal();
                      }
                    }}
                    placeholder="새 체크 항목 입력 후 Enter"
                    style={styles.modalCheckInput}
                  />
                  <button
                    type="button"
                    onClick={handleAddCheckInModal}
                    style={styles.modalCheckAddBtn}
                  >
                    <Plus size={14} /> 추가
                  </button>
                </div>

                {eventChecklists.length > 0 && (
                  <div style={styles.modalCheckList}>
                    {eventChecklists.map((c) => (
                      <div key={c.id} style={styles.modalCheckRow}>
                        <button
                          type="button"
                          onClick={() => handleToggleCheckInModal(c.id)}
                          style={styles.checkboxBtn}
                        >
                          {c.completed ? (
                            <CheckSquare size={16} color="#2563EB" />
                          ) : (
                            <Square size={16} color="#94A3B8" />
                          )}
                        </button>
                        <span
                          style={{
                            ...styles.modalCheckText,
                            textDecoration: c.completed ? 'line-through' : 'none',
                            color: c.completed ? '#94A3B8' : '#1E293B'
                          }}
                        >
                          {c.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCheckInModal(c.id)}
                          style={styles.modalCheckDelBtn}
                        >
                          <X size={14} color="#94A3B8" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={styles.modalFooter}>
              {selectedEventId && (
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    if (openDeleteModal) {
                      openDeleteModal(
                        '일정/메모 삭제',
                        `'${eventTitle}' 일정을 정말 삭제하시겠습니까?`,
                        async () => {
                          await deleteDoc(doc(db, 'items', selectedEventId));
                        }
                      );
                    }
                  }}
                  style={styles.btnDanger}
                >
                  <Trash2 size={14} /> 삭제
                </button>
              )}

              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  style={styles.btnCancel}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvent}
                  style={styles.btnSave}
                  disabled={!eventTitle.trim()}
                >
                  <Check size={14} /> 저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Google Calendar CSS Styles ----------------
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden'
  },
  toolbar: {
    height: '56px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF'
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#1E293B'
  },
  todayBtn: {
    backgroundColor: '#F1F5F9',
    color: '#334155',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  navGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px'
  },
  navBtn: {
    background: 'none',
    border: 'none',
    color: '#475569',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.15s'
  },
  monthTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1E293B'
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  viewModeGroup: {
    display: 'flex',
    backgroundColor: '#F1F5F9',
    borderRadius: '6px',
    padding: '2px',
    border: '1px solid #E2E8F0'
  },
  viewModeBtn: {
    border: 'none',
    borderRadius: '4px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  createBtn: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '20px',
    padding: '7px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
    transition: 'all 0.15s ease'
  },

  weekHeaderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0'
  },
  weekHeaderCell: {
    textAlign: 'center',
    padding: '8px 0',
    fontSize: '12px',
    fontWeight: 700
  },

  monthGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gridTemplateRows: 'repeat(6, 1fr)',
    backgroundColor: '#E2E8F0',
    gap: '1px',
    overflowY: 'auto'
  },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    padding: '4px 6px',
    cursor: 'pointer',
    minHeight: 0,
    overflow: 'hidden',
    transition: 'background-color 0.1s ease'
  },
  cellHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4px'
  },
  dayNumBadge: {
    fontSize: '12px',
    fontWeight: 700,
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cellAddBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6
  },
  chipsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflowY: 'hidden',
    flex: 1
  },
  eventChip: {
    borderRadius: '4px',
    borderLeft: '3px solid',
    padding: '2px 5px',
    fontSize: '11px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
  },
  chipText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  chipCheckCount: {
    fontSize: '10px',
    opacity: 0.8
  },
  moreChipsBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#64748B',
    paddingLeft: '4px',
    marginTop: '2px'
  },

  // Modal Styles
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
    maxWidth: '520px',
    maxHeight: '90vh',
    padding: '20px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflowY: 'auto'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
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
    padding: '4px'
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  modalTitleInput: {
    width: '100%',
    fontSize: '18px',
    fontWeight: 700,
    padding: '8px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    outline: 'none',
    color: '#1E293B'
  },
  metaRow: {
    display: 'flex',
    gap: '12px'
  },
  metaField: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    padding: '6px 10px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px'
  },
  dateInput: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1E293B',
    outline: 'none',
    width: '100%'
  },
  categorySelect: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1E293B',
    outline: 'none',
    width: '100%',
    cursor: 'pointer'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569'
  },
  modalTextarea: {
    width: '100%',
    fontSize: '13px',
    lineHeight: 1.5,
    padding: '8px 10px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  modalCheckInputGroup: {
    display: 'flex',
    gap: '6px'
  },
  modalCheckInput: {
    flex: 1,
    fontSize: '13px',
    padding: '6px 10px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    outline: 'none'
  },
  modalCheckAddBtn: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '0 10px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  modalCheckList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '140px',
    overflowY: 'auto'
  },
  modalCheckRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 6px',
    backgroundColor: '#F8FAFC',
    borderRadius: '4px'
  },
  checkboxBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 0
  },
  modalCheckText: {
    flex: 1,
    fontSize: '13px'
  },
  modalCheckDelBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px'
  },

  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid #F1F5F9'
  },
  btnDanger: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    border: '1px solid #FCA5A5',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  btnCancel: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  btnSave: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }
};

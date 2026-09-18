import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Tag } from 'lucide-react';

export default function CreateEventModal({
  isOpen,
  onClose,
  initialTitle = '',
  initialBlocks = [],
  categories = [],
  sourceMemo = null,
  onSaveEvent
}) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle || '');
      const defaultCat = categories.find(c => c.name === '할일') || categories[0];
      setCategoryId(defaultCat?.id || 'cat_todo');
      
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      setIsAllDay(true);
      setStartTime('09:00');
      setEndTime('10:00');
    }
  }, [isOpen, initialTitle, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('일정 제목을 입력해 주세요.');
      return;
    }
    if (!date) {
      alert('날짜를 지정해 주세요.');
      return;
    }

    const newEvent = {
      id: 'event_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      categoryId: categoryId || 'cat_todo',
      startDate: date,
      endDate: date,
      isAllDay,
      startTime: isAllDay ? '' : startTime,
      endTime: isAllDay ? '' : endTime,
      blocks: Array.isArray(initialBlocks) && initialBlocks.length > 0 ? initialBlocks : [],
      sourceMemo: sourceMemo || null,
      createdAt: new Date().toISOString(),
      isDeleted: false
    };

    onSaveEvent(newEvent);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={18} color="#2563EB" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>
              일정 만들기
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#64748B',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 모달 폼 본문 */}
        <form onSubmit={handleSubmit} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 일정 제목 */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
              일정 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목을 입력하세요"
              autoFocus
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                color: '#1E293B',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 범주(일의 종류) 선택 */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
              <Tag size={13} />
              <span>일정 범주</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                color: '#1E293B',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box'
              }}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 날짜 선택 */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
              <CalendarIcon size={13} />
              <span>날짜</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                color: '#1E293B',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 종일 여부 및 시간 */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>종일 일정</span>
            </label>

            {!isAllDay && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748B', marginBottom: '3px' }}>시작 시간</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <span style={{ marginTop: '16px', color: '#94A3B8' }}>~</span>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748B', marginBottom: '3px' }}>종료 시간</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 하위 블록 포함 안내 (있는 경우) */}
          {Array.isArray(initialBlocks) && initialBlocks.length > 0 && (
            <div style={{ fontSize: '11px', color: '#059669', backgroundColor: '#ECFDF5', padding: '6px 10px', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
              ✓ 해당 항목의 하위 내용(체크리스트/세부 항목 {initialBlocks.length}개)이 일정에 함께 연동됩니다.
            </div>
          )}

          {/* 모달 하단 액션 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)'
              }}
            >
              일정 만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

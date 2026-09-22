import React from 'react';
import {
  Calendar as CalendarIcon,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { styles } from './notebookStyles';
import CalendarView from '../CalendarView';
import { DetailBlocksManager } from '../DetailBlocks';

function CalendarDetailPane(props) {
  const {
    isMobile,
    setMobileView,
    calendarEvents,
    selectedCalendarEventId,
    setSelectedCalendarEventId,
    calendarCategories,
    selectedCalendarCategoryId,
    categories,
    items,
    selectedCategoryId,
    searchQuery,
    renderMobileFooter,
    setCreateEventModalState,
    handleDeleteCalendarEvent,
    handleOpenEditEventModal,
    handleNavigateToEventSource,
    handleSaveCalendarEventBlocks,
    editingBlockId,
    setEditingBlockId,
    handleOpenMoveBlockModal,
    handleCopyBlockToClipboard,
    handleCopyBlockAsPlainText,
    handleCopyItemToClipboard,
    detailClipboard,
    handlePasteItemFromClipboard,
    detailCollapsedBlockIds,
    updateDetailCollapsedBlockIds,
    handleOpenCreateEventFromBlock,
    openDeleteModal
  } = props;

  const selectedEvent = calendarEvents.find((e) => e.id === selectedCalendarEventId && !e.isDeleted);
  const isMobileDetailActive = isMobile && Boolean(selectedEvent);

  return (
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%', width: '100%', overflow: 'hidden' }}>
                      {/* Left Pane: Calendar (Month / 3-Days / Day) */}
                      {(!isMobile || !isMobileDetailActive) && (
                        <div style={{ flex: 1, minWidth: 0, height: '100%', borderRight: isMobile ? 'none' : '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                          <CalendarView
                            events={calendarEvents}
                            categories={calendarCategories}
                            selectedCategoryId={selectedCalendarCategoryId}
                            selectedEventId={selectedCalendarEventId}
                            onSelectEvent={(event) => setSelectedCalendarEventId(event.id)}
                            onOpenCreateModal={(date) => {
                              setCreateEventModalState({
                                isOpen: true,
                                initialTitle: '',
                                initialBlocks: [],
                                date: date || '',
                                sourceMemo: null
                              });
                            }}
                            onDeleteEvent={handleDeleteCalendarEvent}
                            onEditEvent={handleOpenEditEventModal}
                            onNavigateToSource={handleNavigateToEventSource}
                          />
                          {/* Mobile Back to Category Items Button (일정 목록 / 달력 화면일 때) */}
                          {isMobile && !isMobileDetailActive && renderMobileFooter(
                            <div style={{ padding: '8px 12px', backgroundColor: '#F8FAFC', borderTop: '1px solid #CBD5E1', display: 'flex', alignItems: 'center' }}>
                              <button
                                onClick={() => setMobileView('items')}
                                style={styles.mobileBackBtn}
                              >
                                <ArrowLeft size={16} /> 범주 목록으로
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Right Pane: Selected Event's Sub-items / Checklist (Matching Existing Workspace Structure) */}
                      {(!isMobile || isMobileDetailActive) && (
                        <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
                          {!selectedEvent ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', color: '#94A3B8', textAlign: 'center' }}>
                              <CalendarIcon size={44} color="#CBD5E1" style={{ marginBottom: '14px' }} />
                              <div style={{ fontSize: '15px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>
                                선택된 일정이 없습니다
                              </div>
                              <div style={{ fontSize: '13px', color: '#94A3B8', maxWidth: '280px' }}>
                                좌측 캘린더에서 일정을 클릭하면 해당 일정의 하위 내용(체크리스트)이 이곳에 표시됩니다.
                              </div>
                            </div>
                          ) : (
                            (() => {
                              const cat = calendarCategories.find((c) => c.id === selectedEvent.categoryId);
                              const catColor = cat?.color || '#3B82F6';
                              const catName = cat?.name || '할일';

                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                  {/* Selected Event Header */}
                                  <div
                                    style={{
                                      padding: '12px 16px',
                                      borderBottom: '1px solid #E2E8F0',
                                      backgroundColor: '#F8FAFC',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      flexWrap: 'wrap',
                                      gap: '8px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                      {isMobile && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedCalendarEventId(null)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid #CBD5E1',
                                            backgroundColor: '#FFFFFF',
                                            color: '#334155',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            flexShrink: 0
                                          }}
                                          title="일정 목록으로 돌아가기"
                                        >
                                          <ArrowLeft size={14} />
                                          <span>목록</span>
                                        </button>
                                      )}
                                      <span
                                        style={{
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          color: '#FFFFFF',
                                          backgroundColor: catColor,
                                          padding: '2px 8px',
                                          borderRadius: '5px',
                                          flexShrink: 0
                                        }}
                                      >
                                        {catName}
                                      </span>
                                      <h3
                                        style={{
                                          margin: 0,
                                          fontSize: '15px',
                                          fontWeight: 700,
                                          color: '#1E293B',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {selectedEvent.title}
                                      </h3>
                                      <span style={{ fontSize: '12px', color: '#64748B', flexShrink: 0 }}>
                                        ({selectedEvent.isAllDay ? '종일' : `${selectedEvent.startTime} ~ ${selectedEvent.endTime}`})
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`'${selectedEvent.title}' 일정을 일정에서 해제하시겠습니까?`)) {
                                            handleDeleteCalendarEvent(selectedEvent.id);
                                          }
                                        }}
                                        style={{
                                          padding: '4px 8px',
                                          borderRadius: '6px',
                                          border: '1px solid #FCA5A5',
                                          backgroundColor: '#FEF2F2',
                                          color: '#DC2626',
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                      >
                                        <Trash2 size={12} />
                                        <span>일정에서 해제</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Event Sub-blocks Manager (Using DetailBlocksManager identically) */}
                                  <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                                    <DetailBlocksManager
                                      blocks={Array.isArray(selectedEvent.blocks) ? selectedEvent.blocks : []}
                                      onChangeAndSave={(newBlocks) => handleSaveCalendarEventBlocks(selectedEvent.id, newBlocks)}
                                      searchQuery=""
                                      editingBlockId={editingBlockId}
                                      setEditingBlockId={setEditingBlockId}
                                      openDeleteModal={openDeleteModal}
                                      onOpenMoveModal={handleOpenMoveBlockModal}
                                      onCopyBlock={handleCopyBlockToClipboard}
                                      onCopyBlockAsText={handleCopyBlockAsPlainText}
                                      onCopyItem={handleCopyItemToClipboard}
                                      detailClipboard={detailClipboard}
                                      onPasteItemToChecklist={handlePasteItemFromClipboard}
                                      collapsedBlockIds={detailCollapsedBlockIds}
                                      setCollapsedBlockIds={updateDetailCollapsedBlockIds}
                                      isMobile={isMobile}
                                      onCreateEvent={handleOpenCreateEventFromBlock}
                                    />
                                  </div>

                                  {/* Mobile Back to Calendar Items Button (상세 뷰일 때 일정 목록으로 복귀) */}
                                  {isMobile && renderMobileFooter(
                                    <div style={{ padding: '8px 12px', backgroundColor: '#F8FAFC', borderTop: '1px solid #CBD5E1', display: 'flex', alignItems: 'center' }}>
                                      <button
                                        onClick={() => setSelectedCalendarEventId(null)}
                                        style={styles.mobileBackBtn}
                                      >
                                        <ArrowLeft size={16} /> 일정 목록으로
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}
                    </div>
  );
}

export default React.memo(CalendarDetailPane);

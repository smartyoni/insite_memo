import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Type,
  Phone,
  CheckSquare,
  Save,
  FileText,
  Edit3
} from 'lucide-react';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function TemplateManagerModal({ isOpen, onClose, templates, onTemplateSaved, onTemplateDeleted }) {
  const [editingTemplateId, setEditingTemplateId] = useState(null); // null means list view, 'NEW' for creating, or templateId
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleCreateNew = () => {
    setEditingTemplateId('NEW');
    setTitle('');
    setFields([
      { id: `field_${Date.now()}_1`, type: 'text', label: '항목 1', placeholder: '내용을 입력하세요' }
    ]);
  };

  const handleSelectTemplateToEdit = (tpl) => {
    setEditingTemplateId(tpl.id);
    setTitle(tpl.title || '');
    setFields(tpl.fields ? JSON.parse(JSON.stringify(tpl.fields)) : []);
  };

  const handleAddField = (type) => {
    const newId = `field_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let defaultLabel = '새 항목';
    let defaultPlaceholder = '';
    let extraProps = {};

    if (type === 'text') {
      defaultLabel = '텍스트 항목';
      defaultPlaceholder = '내용을 입력하세요';
    } else if (type === 'phone') {
      defaultLabel = '전화번호';
      defaultPlaceholder = '010-0000-0000';
    } else if (type === 'checklist') {
      defaultLabel = '체크리스트';
      extraProps = { defaultItems: ['항목 1', '항목 2'] };
    }

    setFields([
      ...fields,
      {
        id: newId,
        type,
        label: defaultLabel,
        placeholder: defaultPlaceholder,
        ...extraProps
      }
    ]);
  };

  const handleUpdateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const handleUpdateChecklistItem = (fieldIndex, itemIndex, value) => {
    const updated = [...fields];
    if (!updated[fieldIndex].defaultItems) updated[fieldIndex].defaultItems = [];
    updated[fieldIndex].defaultItems[itemIndex] = value;
    setFields(updated);
  };

  const handleAddChecklistItem = (fieldIndex) => {
    const updated = [...fields];
    if (!updated[fieldIndex].defaultItems) updated[fieldIndex].defaultItems = [];
    updated[fieldIndex].defaultItems.push(`항목 ${updated[fieldIndex].defaultItems.length + 1}`);
    setFields(updated);
  };

  const handleRemoveChecklistItem = (fieldIndex, itemIndex) => {
    const updated = [...fields];
    if (updated[fieldIndex].defaultItems) {
      updated[fieldIndex].defaultItems.splice(itemIndex, 1);
    }
    setFields(updated);
  };

  const handleRemoveField = (index) => {
    const updated = [...fields];
    updated.splice(index, 1);
    setFields(updated);
  };

  const handleMoveField = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updated = [...fields];
    const target = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = target;
    setFields(updated);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('템플릿 이름을 입력해 주세요.');
      return;
    }
    if (fields.length === 0) {
      alert('최소 1개 이상의 요소를 추가해 주세요.');
      return;
    }

    setSaving(true);
    try {
      const docId = editingTemplateId === 'NEW' ? `tpl_${Date.now()}` : editingTemplateId;
      const tplData = {
        id: docId,
        title: title.trim(),
        fields: fields,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'templates', docId), tplData);
      onTemplateSaved && onTemplateSaved(tplData);
      setEditingTemplateId(null);
    } catch (err) {
      console.error('템플릿 저장 오류:', err);
      alert('템플릿 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 이 템플릿을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'templates', id));
      if (editingTemplateId === id) {
        setEditingTemplateId(null);
      }
      onTemplateDeleted && onTemplateDeleted(id);
    } catch (err) {
      console.error('템플릿 삭제 오류:', err);
      alert('템플릿 삭제에 실패했습니다.');
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#2563EB" />
            <h3 style={styles.headerTitle}>템플릿 생성 및 관리</h3>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={styles.body}>
          {editingTemplateId === null ? (
            /* List View & Create Option */
            <div style={styles.listContainer}>
              <div style={styles.listHeader}>
                <span style={{ fontSize: '14px', color: '#475569', fontWeight: 600 }}>
                  등록된 템플릿 ({templates.length}개)
                </span>
                <button onClick={handleCreateNew} style={styles.btnPrimary}>
                  <Plus size={16} />
                  새 템플릿 만들기
                </button>
              </div>

              {templates.length === 0 ? (
                <div style={styles.emptyBox}>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>
                    등록된 템플릿이 없습니다.
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '12px' }}>
                    자주 사용하는 양식(텍스트, 전화번호, 체크리스트 등)을 만들어 빠르게 메모를 작성해 보세요.
                  </p>
                </div>
              ) : (
                <div style={styles.tplGrid}>
                  {templates.map((tpl) => (
                    <div key={tpl.id} style={styles.tplCard}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: '#1E293B' }}>
                          {tpl.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                          구성 요소 {tpl.fields?.length || 0}개 (
                          {tpl.fields?.map((f) => f.label).join(', ')})
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleSelectTemplateToEdit(tpl)}
                          style={styles.iconBtn}
                          title="수정"
                        >
                          <Edit3 size={15} color="#3B82F6" />
                        </button>
                        <button
                          onClick={() => handleDelete(tpl.id)}
                          style={styles.iconBtn}
                          title="삭제"
                        >
                          <Trash2 size={15} color="#EF4444" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Form Builder View */
            <div style={styles.builderContainer}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <button
                  onClick={() => setEditingTemplateId(null)}
                  style={styles.btnSecondary}
                >
                  ← 목록으로 돌아가기
                </button>
                <span style={{ fontSize: '13px', color: '#64748B' }}>
                  {editingTemplateId === 'NEW' ? '새 템플릿 작성' : '템플릿 수정'}
                </span>
              </div>

              {/* Template Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.fieldLabel}>템플릿 이름</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 고객 상담 일지, 주간 업무 보고, 여행 준비물"
                  style={styles.inputTitle}
                />
              </div>

              {/* Add Field Toolbar */}
              <div style={styles.toolbar}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  요소 추가:
                </span>
                <button
                  onClick={() => handleAddField('text')}
                  style={styles.toolBtn}
                >
                  <Type size={14} color="#2563EB" />
                  텍스트 박스
                </button>
                <button
                  onClick={() => handleAddField('phone')}
                  style={styles.toolBtn}
                >
                  <Phone size={14} color="#10B981" />
                  전화번호 박스
                </button>
                <button
                  onClick={() => handleAddField('checklist')}
                  style={styles.toolBtn}
                >
                  <CheckSquare size={14} color="#F59E0B" />
                  체크리스트 박스
                </button>
              </div>

              {/* Fields List */}
              <div style={styles.fieldsList}>
                {fields.length === 0 ? (
                  <div style={styles.emptyFields}>
                    상단의 <strong>[요소 추가]</strong> 버튼을 눌러 텍스트, 전화번호, 체크리스트 항목을 배치해 보세요.
                  </div>
                ) : (
                  fields.map((field, idx) => (
                    <div key={field.id} style={styles.fieldCard}>
                      <div style={styles.fieldHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {field.type === 'text' && <Type size={16} color="#2563EB" />}
                          {field.type === 'phone' && <Phone size={16} color="#10B981" />}
                          {field.type === 'checklist' && <CheckSquare size={16} color="#F59E0B" />}
                          <span style={styles.fieldTypeBadge}>
                            {field.type === 'text' && '텍스트 입력'}
                            {field.type === 'phone' && '전화번호 입력'}
                            {field.type === 'checklist' && '체크리스트'}
                          </span>
                        </div>

                        {/* Controls: Up/Down/Delete */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveField(idx, -1)}
                            style={{ ...styles.iconBtn, opacity: idx === 0 ? 0.3 : 1 }}
                          >
                            <MoveUp size={14} />
                          </button>
                          <button
                            disabled={idx === fields.length - 1}
                            onClick={() => handleMoveField(idx, 1)}
                            style={{ ...styles.iconBtn, opacity: idx === fields.length - 1 ? 0.3 : 1 }}
                          >
                            <MoveDown size={14} />
                          </button>
                          <button
                            onClick={() => handleRemoveField(idx)}
                            style={styles.iconBtn}
                          >
                            <Trash2 size={14} color="#EF4444" />
                          </button>
                        </div>
                      </div>

                      {/* Field Details Configuration */}
                      <div style={styles.fieldBody}>
                        <div style={{ flex: 1 }}>
                          <label style={styles.subLabel}>항목명 (Label)</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                            placeholder="예: 안건, 담당자 연락처, 준비물 목록"
                            style={styles.inputText}
                          />
                        </div>

                        {field.type !== 'checklist' && (
                          <div style={{ flex: 1 }}>
                            <label style={styles.subLabel}>안내 문구 (Placeholder)</label>
                            <input
                              type="text"
                              value={field.placeholder || ''}
                              onChange={(e) => handleUpdateField(idx, 'placeholder', e.target.value)}
                              placeholder="입력창에 표시할 안내 텍스트"
                              style={styles.inputText}
                            />
                          </div>
                        )}
                      </div>

                      {/* Checklist Specific Items Setup */}
                      {field.type === 'checklist' && (
                        <div style={styles.checklistSetup}>
                          <label style={styles.subLabel}>기본 체크 항목 설정</label>
                          {(field.defaultItems || []).map((item, itemIdx) => (
                            <div key={itemIdx} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => handleUpdateChecklistItem(idx, itemIdx, e.target.value)}
                                style={{ ...styles.inputText, flex: 1 }}
                              />
                              <button
                                onClick={() => handleRemoveChecklistItem(idx, itemIdx)}
                                style={styles.iconBtn}
                              >
                                <Trash2 size={14} color="#EF4444" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => handleAddChecklistItem(idx)}
                            style={styles.btnAddSubItem}
                          >
                            <Plus size={13} />
                            항목 추가
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div style={styles.actionRow}>
                <button
                  onClick={() => setEditingTemplateId(null)}
                  style={styles.btnSecondary}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={styles.btnPrimary}
                >
                  <Save size={16} />
                  {saving ? '저장 중...' : '템플릿 저장'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '16px'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '620px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC'
  },
  headerTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: '#0F172A'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748B',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center'
  },
  body: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  emptyBox: {
    padding: '32px 16px',
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1'
  },
  tplGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  tplCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF'
  },
  builderContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  fieldLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px'
  },
  inputTitle: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#F1F5F9',
    borderRadius: '10px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  toolBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer'
  },
  fieldsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  emptyFields: {
    padding: '24px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#64748B',
    border: '1px dashed #CBD5E1',
    borderRadius: '10px'
  },
  fieldCard: {
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  fieldHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  fieldTypeBadge: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#334155'
  },
  fieldBody: {
    display: 'flex',
    gap: '10px'
  },
  subLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748B',
    marginBottom: '4px'
  },
  inputText: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    boxSizing: 'border-box'
  },
  checklistSetup: {
    marginTop: '4px',
    paddingTop: '8px',
    borderTop: '1px dashed #E2E8F0'
  },
  btnAddSubItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '11px',
    color: '#475569',
    cursor: 'pointer'
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '12px',
    borderTop: '1px solid #E2E8F0'
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  btnSecondary: {
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

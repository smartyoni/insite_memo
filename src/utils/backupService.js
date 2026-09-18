import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';

const PRE_RESTORE_STORAGE_KEY = '__insite_memo_pre_restore_backup__';

/**
 * 최신 클라우드 백업 메타데이터 조회
 */
export async function getLatestCloudBackupInfo(db) {
  try {
    const backupDocRef = doc(db, 'app_backups', 'latest');
    const snap = await getDoc(backupDocRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      updatedAt: data.updatedAt || null,
      summary: data.summary || {
        itemsCount: 0,
        categoriesCount: 0,
        categoryGroupsCount: 0,
        templatesCount: 0,
        templates2Count: 0
      },
      sizeBytes: data.sizeBytes || 0
    };
  } catch (err) {
    console.error('클라우드 백업 정보 조회 실패:', err);
    return null;
  }
}

/**
 * 백업 페이로드 생성 헬퍼
 */
export function buildBackupPayload({ items = [], categories = [], categoryGroups = [], templates = [], templates2 = [] }) {
  const cleanList = (list) =>
    (list || []).map((item) => {
      const copy = { ...item };
      return copy;
    });

  const payload = {
    version: '1.0',
    appName: 'explorer-note-app',
    exportedAt: new Date().toISOString(),
    summary: {
      itemsCount: items.length,
      categoriesCount: categories.length,
      categoryGroupsCount: categoryGroups.length,
      templatesCount: templates.length,
      templates2Count: templates2.length
    },
    data: {
      items: cleanList(items),
      categories: cleanList(categories),
      categoryGroups: cleanList(categoryGroups),
      templates: cleanList(templates),
      templates2: cleanList(templates2)
    }
  };

  return payload;
}

/**
 * 클라우드에 최신 백업 저장 (덮어쓰기)
 */
export async function saveCloudBackup(db, { items, categories, categoryGroups, templates, templates2 }) {
  const payload = buildBackupPayload({ items, categories, categoryGroups, templates, templates2 });
  const jsonString = JSON.stringify(payload);
  const sizeBytes = new Blob([jsonString]).size;

  if (sizeBytes > 950000) {
    throw new Error(`백업 데이터 크기(${(sizeBytes / 1024).toFixed(1)} KB)가 클라우드 단일 문서 허용 한도를 초과했습니다. [JSON 파일 다운로드] 기능을 이용해주세요.`);
  }

  const backupDocRef = doc(db, 'app_backups', 'latest');
  await setDoc(backupDocRef, {
    updatedAt: new Date().toISOString(),
    summary: payload.summary,
    sizeBytes,
    payloadString: jsonString
  });

  return {
    updatedAt: payload.exportedAt,
    summary: payload.summary,
    sizeBytes
  };
}

/**
 * 클라우드 최신 백업 데이터 불러오기
 */
export async function fetchLatestCloudBackupData(db) {
  const backupDocRef = doc(db, 'app_backups', 'latest');
  const snap = await getDoc(backupDocRef);
  if (!snap.exists()) {
    throw new Error('클라우드에 저장된 백업이 없습니다.');
  }
  const data = snap.data();
  if (!data.payloadString) {
    throw new Error('백업 데이터 형식이 올바르지 않습니다.');
  }
  return JSON.parse(data.payloadString);
}

/**
 * 복원 직전 현재 상태를 로컬스토리지에 임시 저장 (안전 언두용)
 */
export function savePreRestoreSafeguard({ items, categories, categoryGroups, templates, templates2 }) {
  try {
    const payload = buildBackupPayload({ items, categories, categoryGroups, templates, templates2 });
    localStorage.setItem(PRE_RESTORE_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('임시 복원 백업 저장 실패 (용량 초과 등):', err);
  }
}

/**
 * 임시 복원 세이프가드 데이터 확인
 */
export function getPreRestoreSafeguard() {
  try {
    const str = localStorage.getItem(PRE_RESTORE_STORAGE_KEY);
    if (!str) return null;
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * 데이터 일괄 복원 실행 (Data Protection First 원칙 준수)
 * - Firestore Batch(400건 단위) 활용하여 안전하게 반영
 */
export async function applyRestoreData(db, payloadData, currentData = null, onProgress = null) {
  if (!payloadData || !payloadData.data) {
    throw new Error('유효하지 않은 백업 데이터 형식입니다.');
  }

  const { items = [], categories = [], categoryGroups = [], templates = [], templates2 = [] } = payloadData.data;

  // 복원 직전 세이프가드 저장
  if (currentData) {
    savePreRestoreSafeguard(currentData);
  }

  const collectionsToRestore = [
    { name: 'categoryGroups', docs: categoryGroups },
    { name: 'categories', docs: categories },
    { name: 'items', docs: items },
    { name: 'templates', docs: templates },
    { name: 'templates2', docs: templates2 }
  ];

  let totalOperations = 0;
  collectionsToRestore.forEach((c) => {
    totalOperations += c.docs.length;
  });

  let completedOperations = 0;

  let batch = writeBatch(db);
  let batchCount = 0;

  const commitBatchIfNeeded = async (force = false) => {
    if (batchCount >= 400 || (force && batchCount > 0)) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  };

  for (const col of collectionsToRestore) {
    for (const docData of col.docs) {
      if (!docData.id) continue;
      const ref = doc(db, col.name, docData.id);
      
      const dataToSave = { ...docData };
      delete dataToSave.id;

      batch.set(ref, dataToSave, { merge: true });
      batchCount++;
      completedOperations++;

      if (onProgress && totalOperations > 0) {
        onProgress(Math.min(99, Math.round((completedOperations / totalOperations) * 100)));
      }

      await commitBatchIfNeeded(false);
    }
  }

  await commitBatchIfNeeded(true);
  if (onProgress) onProgress(100);

  return {
    restoredItems: items.length,
    restoredCategories: categories.length,
    restoredCategoryGroups: categoryGroups.length,
    restoredTemplates: templates.length + templates2.length
  };
}

/**
 * 백업 데이터를 JSON 파일로 다운로드
 */
export function downloadBackupFile({ items, categories, categoryGroups, templates, templates2 }) {
  const payload = buildBackupPayload({ items, categories, categoryGroups, templates, templates2 });
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = new Date().toTimeString().slice(0, 5).replace(/:/g, '');
  const fileName = `memo_backup_${dateStr}_${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 사용자가 선택한 JSON 파일 읽기 및 파싱
 */
export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('선택된 파일이 없습니다.'));
    }
    if (!file.name.endsWith('.json')) {
      return reject(new Error('JSON 파일만 불러올 수 있습니다. (.json)'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = JSON.parse(content);
        if (!parsed.data || (!parsed.data.items && !parsed.data.categories)) {
          throw new Error('메모 백업 데이터 형식이 올바르지 않습니다.');
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error('파일 파싱에 실패했습니다: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 오류가 발생했습니다.'));
    reader.readAsText(file);
  });
}

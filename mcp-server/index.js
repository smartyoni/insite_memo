import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCpZ1iVrU_JwK10gEvi9FGderKYaffgMGg",
  authDomain: "data-library-5cf6c.firebaseapp.com",
  projectId: "data-library-5cf6c",
  storageBucket: "data-library-5cf6c.firebasestorage.app",
  messagingSenderId: "976961164680",
  appId: "1:976961164680:web:4aa7027e61f13425bc163d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FIXED_INBOXES = [
  { id: "inbox", name: "In-box (탐색기)", scope: "explorer", isFixed: true },
  { id: "blog_inbox", name: "In-box (블로그)", scope: "blog", isFixed: true },
  { id: "clipboard_inbox", name: "In-box (클립보드)", scope: "clipboard", isFixed: true },
  { id: "balance_inbox", name: "In-box (잔액/가계부)", scope: "balance", isFixed: true },
  { id: "clip_inbox", name: "In-box (스크랩)", scope: "clip", isFixed: true },
  { id: "office_inbox", name: "In-box (업무)", scope: "office", isFixed: true },
  { id: "ad_inbox", name: "In-box (광고/마케팅)", scope: "ad", isFixed: true }
];

const FIXED_INBOX_IDS = FIXED_INBOXES.map((b) => b.id);

function formatTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate().toISOString();
  if (ts.seconds) return new Date(ts.seconds * 1000).toISOString();
  return ts;
}

const server = new McpServer({
  name: "explorer-note-app-mcp",
  version: "1.0.0"
});

const scopeNameMap = {
  explorer: "노트",
  blog: "블로그",
  clipboard: "계약",
  balance: "앱개발",
  clip: "클립",
  office: "사무실",
  ad: "광고"
};

function computeCategoryPath(cat, allCategories) {
  if (FIXED_INBOX_IDS.includes(cat.id)) {
    const sName = scopeNameMap[cat.scope || "explorer"] || "노트";
    return `${sName} > In-box`;
  }
  const segments = [cat.name];
  let curr = cat;
  const visited = new Set([cat.id]);
  while (curr && curr.parentId) {
    const parent = allCategories.find((c) => c.id === curr.parentId);
    if (!parent || visited.has(parent.id)) break;
    visited.add(parent.id);
    segments.unshift(parent.name);
    curr = parent;
  }
  const sName = scopeNameMap[cat.scope || "explorer"] || "노트";
  return `${sName} > ${segments.join(" > ")}`;
}

// 1. memo_list_categories
server.tool(
  "memo_list_categories",
  "메모 앱의 모든 카테고리/폴더 목록을 계층 경로 및 parentId와 함께 조회합니다.",
  {
    scope: z
      .string()
      .optional()
      .describe("특정 탭/스코프 필터 (예: 'explorer', 'blog', 'clipboard', 'balance', 'clip', 'office', 'ad')")
  },
  async ({ scope }) => {
    try {
      const snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
      let list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          order: data.order,
          scope: data.scope || "explorer",
          parentId: data.parentId || null,
          createdAt: formatTimestamp(data.createdAt)
        };
      });

      // Include fixed inboxes
      const combined = [
        ...FIXED_INBOXES.map((b) => ({ ...b, parentId: null })),
        ...list
      ];

      // Add hierarchical path
      const withPaths = combined.map((c) => ({
        ...c,
        path: computeCategoryPath(c, combined)
      }));

      const filtered = scope ? withPaths.filter((c) => (c.scope || "explorer") === scope) : withPaths;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ count: filtered.length, categories: filtered }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `카테고리 목록 조회 실패: ${err.message}` }]
      };
    }
  }
);

// 2. memo_create_category
server.tool(
  "memo_create_category",
  "메모 앱에 새로운 카테고리(폴더 또는 하위 폴더)를 생성합니다.",
  {
    name: z.string().describe("생성할 카테고리 이름"),
    scope: z
      .string()
      .optional()
      .default("explorer")
      .describe("카테고리 스코프 (기본값: 'explorer')"),
    parentId: z
      .string()
      .nullable()
      .optional()
      .describe("상위 카테고리 ID (최상위(루트)는 null 또는 생략)")
  },
  async ({ name, scope, parentId }) => {
    try {
      const countSnap = await getDocs(collection(db, "categories"));
      const newRef = doc(collection(db, "categories"));
      const newCat = {
        name: name.trim(),
        order: countSnap.docs.length,
        scope: scope || "explorer",
        parentId: parentId || null,
        createdAt: serverTimestamp()
      };
      await setDoc(newRef, newCat);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              categoryId: newRef.id,
              name: newCat.name,
              scope: newCat.scope,
              parentId: newCat.parentId
            }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `카테고리 생성 실패: ${err.message}` }]
      };
    }
  }
);

// 3. memo_rename_category (기존 호환성 유지)
server.tool(
  "memo_rename_category",
  "기존 카테고리의 이름을 변경합니다 (고정 In-box는 변경 불가).",
  {
    categoryId: z.string().describe("수정할 카테고리 ID"),
    newName: z.string().describe("새 카테고리 이름")
  },
  async ({ categoryId, newName }) => {
    if (FIXED_INBOX_IDS.includes(categoryId)) {
      return {
        isError: true,
        content: [{ type: "text", text: "고정 In-box 카테고리의 이름은 변경할 수 없습니다." }]
      };
    }
    try {
      await updateDoc(doc(db, "categories", categoryId), {
        name: newName.trim()
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, categoryId, newName: newName.trim() }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `카테고리 이름 변경 실패: ${err.message}` }]
      };
    }
  }
);

// 4. memo_update_category (이름 및 parentId 이동 지원)
server.tool(
  "memo_update_category",
  "카테고리의 이름 변경 및 상위 폴더 이동(위계 변경)을 처리합니다.",
  {
    categoryId: z.string().describe("수정할 카테고리 ID"),
    name: z.string().optional().describe("새 카테고리 이름 (선택)"),
    parentId: z.string().nullable().optional().describe("새 상위 카테고리 ID (최상위는 null, 선택)")
  },
  async ({ categoryId, name, parentId }) => {
    if (FIXED_INBOX_IDS.includes(categoryId)) {
      return {
        isError: true,
        content: [{ type: "text", text: "고정 In-box 카테고리는 수정할 수 없습니다." }]
      };
    }
    try {
      const updates = {};
      if (typeof name === "string" && name.trim().length > 0) {
        updates.name = name.trim();
      }
      if (parentId !== undefined) {
        updates.parentId = parentId || null;
      }
      if (Object.keys(updates).length === 0) {
        return {
          isError: true,
          content: [{ type: "text", text: "수정할 항목(name 또는 parentId)을 입력해주세요." }]
        };
      }

      await updateDoc(doc(db, "categories", categoryId), updates);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, categoryId, ...updates }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `카테고리 정보 수정 실패: ${err.message}` }]
      };
    }
  }
);

// 5. memo_delete_category
server.tool(
  "memo_delete_category",
  "카테고리를 삭제합니다. 하위 폴더 및 메모도 옵시디언 방식으로 함께 일괄 삭제되거나 In-box로 이동됩니다.",
  {
    categoryId: z.string().describe("삭제할 카테고리 ID"),
    deleteMemos: z.boolean().optional().default(true).describe("하위 메모 함께 삭제 여부 (기본값 true: 일괄 삭제, false: In-box로 이동)")
  },
  async ({ categoryId, deleteMemos }) => {
    if (FIXED_INBOX_IDS.includes(categoryId)) {
      return {
        isError: true,
        content: [{ type: "text", text: "고정 In-box 카테고리는 삭제할 수 없습니다." }]
      };
    }
    try {
      const allCatSnap = await getDocs(collection(db, "categories"));
      const allCats = allCatSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Recursively collect all descendant category IDs
      const targetCategoryIds = [categoryId];
      const collectDescendants = (pid) => {
        allCats
          .filter((c) => c.parentId === pid)
          .forEach((child) => {
            targetCategoryIds.push(child.id);
            collectDescendants(child.id);
          });
      };
      collectDescendants(categoryId);

      const batch = writeBatch(db);

      // Delete all target categories
      targetCategoryIds.forEach((id) => {
        batch.delete(doc(db, "categories", id));
      });

      // Find all memos in target categories
      let totalMemosHandled = 0;
      for (const catId of targetCategoryIds) {
        const itemsSnap = await getDocs(query(collection(db, "items"), where("categoryId", "==", catId)));
        itemsSnap.docs.forEach((itemDoc) => {
          if (deleteMemos) {
            batch.delete(itemDoc.ref);
          } else {
            batch.update(itemDoc.ref, { categoryId: "inbox" });
          }
          totalMemosHandled++;
        });
      }

      await batch.commit();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              deletedCategoriesCount: targetCategoryIds.length,
              deletedCategoryIds: targetCategoryIds,
              memosHandled: totalMemosHandled,
              action: deleteMemos ? "deleted" : "moved_to_inbox"
            }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `카테고리 삭제 실패: ${err.message}` }]
      };
    }
  }
);

// 5. memo_list_memos
server.tool(
  "memo_list_memos",
  "메모 목록을 조회합니다. categoryId로 특정 카테고리 필터링이 가능합니다.",
  {
    categoryId: z.string().optional().describe("필터링할 카테고리 ID (생략 시 전체 메모)"),
    limit: z.number().optional().default(50).describe("최대 조회 개수 (기본 50개)")
  },
  async ({ categoryId, limit: maxCount }) => {
    try {
      let q;
      if (categoryId) {
        q = query(collection(db, "items"), where("categoryId", "==", categoryId), firestoreLimit(maxCount));
      } else {
        q = query(collection(db, "items"), firestoreLimit(maxCount));
      }
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => {
        const data = d.data();
        const snippet = (data.body || "").slice(0, 100).replace(/\n/g, " ");
        return {
          id: d.id,
          title: data.title || "제목 없음",
          categoryId: data.categoryId || "inbox",
          snippet: snippet.length >= 100 ? `${snippet}...` : snippet,
          hasSubBody: Boolean(data.subBody && data.subBody.trim().length > 0),
          updatedAt: formatTimestamp(data.updatedAt),
          createdAt: formatTimestamp(data.createdAt)
        };
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ count: list.length, memos: list }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `메모 목록 조회 실패: ${err.message}` }]
      };
    }
  }
);

// 6. memo_get_memo
server.tool(
  "memo_get_memo",
  "특정 메모의 전체 상세 내용(제목, 본문, 보충노트/체크리스트 등)을 조회합니다.",
  {
    memoId: z.string().describe("조회할 메모의 ID")
  },
  async ({ memoId }) => {
    try {
      const snap = await getDoc(doc(db, "items", memoId));
      if (!snap.exists()) {
        return {
          isError: true,
          content: [{ type: "text", text: `ID '${memoId}'에 해당하는 메모를 찾을 수 없습니다.` }]
        };
      }
      const data = snap.data();
      const result = {
        id: snap.id,
        title: data.title || "",
        body: data.body || "",
        subBody: data.subBody || "",
        categoryId: data.categoryId || "inbox",
        updatedAt: formatTimestamp(data.updatedAt),
        createdAt: formatTimestamp(data.createdAt)
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `메모 상세 조회 실패: ${err.message}` }]
      };
    }
  }
);

// 7. memo_create_memo
server.tool(
  "memo_create_memo",
  "새로운 메모를 작성합니다.",
  {
    title: z.string().describe("메모 제목"),
    body: z.string().optional().default("").describe("메모 본문"),
    subBody: z.string().optional().default("").describe("보충 노트 또는 체크리스트 (줄바꿈 구분)"),
    categoryId: z.string().optional().default("inbox").describe("저장할 카테고리 ID (기본값: 'inbox')")
  },
  async ({ title, body, subBody, categoryId }) => {
    try {
      const newRef = doc(collection(db, "items"));
      const newMemo = {
        title: title.trim(),
        body: body || "",
        subBody: subBody || "",
        categoryId: categoryId || "inbox",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(newRef, newMemo);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              id: newRef.id,
              title: newMemo.title,
              categoryId: newMemo.categoryId
            }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `메모 작성 실패: ${err.message}` }]
      };
    }
  }
);

// 8. memo_update_memo
server.tool(
  "memo_update_memo",
  "기존 메모의 제목, 본문, 보충노트, 카테고리를 수정합니다.",
  {
    memoId: z.string().describe("수정할 메모의 ID"),
    title: z.string().optional().describe("수정할 제목"),
    body: z.string().optional().describe("수정할 본문"),
    subBody: z.string().optional().describe("수정할 보충노트/체크리스트"),
    categoryId: z.string().optional().describe("이동할 카테고리 ID")
  },
  async ({ memoId, title, body, subBody, categoryId }) => {
    try {
      const updateData = { updatedAt: serverTimestamp() };
      if (title !== undefined) updateData.title = title.trim();
      if (body !== undefined) updateData.body = body;
      if (subBody !== undefined) updateData.subBody = subBody;
      if (categoryId !== undefined) updateData.categoryId = categoryId;

      await updateDoc(doc(db, "items", memoId), updateData);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              memoId,
              updatedFields: Object.keys(updateData).filter((k) => k !== "updatedAt")
            }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `메모 수정 실패: ${err.message}` }]
      };
    }
  }
);

// 9. memo_delete_memo
server.tool(
  "memo_delete_memo",
  "메모를 삭제합니다.",
  {
    memoId: z.string().describe("삭제할 메모의 ID")
  },
  async ({ memoId }) => {
    try {
      await deleteDoc(doc(db, "items", memoId));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, memoId }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `메모 삭제 실패: ${err.message}` }]
      };
    }
  }
);

// 10. memo_search_memos
server.tool(
  "memo_search_memos",
  "메모 제목, 본문, 보충노트(체크리스트) 전체에서 키워드를 검색합니다.",
  {
    keyword: z.string().describe("검색할 키워드 단어"),
    limit: z.number().optional().default(20).describe("최대 검색 결과 수")
  },
  async ({ keyword, limit: maxCount }) => {
    try {
      const term = keyword.toLowerCase().trim();
      if (!term) {
        return { content: [{ type: "text", text: JSON.stringify({ count: 0, results: [] }) }] };
      }

      const snap = await getDocs(collection(db, "items"));
      const matches = [];

      for (const d of snap.docs) {
        const data = d.data();
        const title = data.title || "";
        const body = data.body || "";
        const subBody = data.subBody || "";

        const titleMatch = title.toLowerCase().includes(term);
        const bodyMatch = body.toLowerCase().includes(term);
        const subBodyMatch = subBody.toLowerCase().includes(term);

        if (titleMatch || bodyMatch || subBodyMatch) {
          matches.push({
            id: d.id,
            title,
            categoryId: data.categoryId || "inbox",
            matchedIn: {
              title: titleMatch,
              body: bodyMatch,
              subBody: subBodyMatch
            },
            snippet: (body || "").slice(0, 120).replace(/\n/g, " "),
            updatedAt: formatTimestamp(data.updatedAt)
          });
          if (matches.length >= maxCount) break;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ count: matches.length, keyword: term, results: matches }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `메모 검색 실패: ${err.message}` }]
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Memo App MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal server error:", err);
  process.exit(1);
});

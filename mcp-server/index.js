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

// 1. memo_list_categories
server.tool(
  "memo_list_categories",
  "메모 앱의 모든 카테고리/폴더 목록을 조회합니다.",
  {
    scope: z
      .string()
      .optional()
      .describe("특정 탭/스코프 필터 (예: 'explorer', 'blog', 'clipboard', 'balance', 'clip', 'office', 'ad')")
  },
  async ({ scope }) => {
    try {
      const snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
      let list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: formatTimestamp(d.data().createdAt)
      }));

      // Include fixed inboxes
      const combined = [...FIXED_INBOXES, ...list];
      const filtered = scope ? combined.filter((c) => (c.scope || "explorer") === scope) : combined;

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
  "메모 앱에 새로운 카테고리(폴더)를 생성합니다.",
  {
    name: z.string().describe("생성할 카테고리 이름"),
    scope: z
      .string()
      .optional()
      .default("explorer")
      .describe("카테고리 스코프 (기본값: 'explorer')")
  },
  async ({ name, scope }) => {
    try {
      const countSnap = await getDocs(collection(db, "categories"));
      const newRef = doc(collection(db, "categories"));
      const newCat = {
        name: name.trim(),
        order: countSnap.docs.length,
        scope: scope || "explorer",
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
              scope: newCat.scope
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

// 3. memo_rename_category
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

// 4. memo_delete_category
server.tool(
  "memo_delete_category",
  "카테고리를 삭제합니다. deleteMemos=true일 경우 하위 메모도 함께 삭제됩니다.",
  {
    categoryId: z.string().describe("삭제할 카테고리 ID"),
    deleteMemos: z.boolean().optional().default(false).describe("하위 메모 함께 삭제 여부 (false 시 기본 In-box로 이동)")
  },
  async ({ categoryId, deleteMemos }) => {
    if (FIXED_INBOX_IDS.includes(categoryId)) {
      return {
        isError: true,
        content: [{ type: "text", text: "고정 In-box 카테고리는 삭제할 수 없습니다." }]
      };
    }
    try {
      const itemsSnap = await getDocs(query(collection(db, "items"), where("categoryId", "==", categoryId)));
      const batch = writeBatch(db);
      batch.delete(doc(db, "categories", categoryId));

      let affectedCount = 0;
      itemsSnap.docs.forEach((itemDoc) => {
        if (deleteMemos) {
          batch.delete(itemDoc.ref);
        } else {
          batch.update(itemDoc.ref, { categoryId: "inbox" });
        }
        affectedCount++;
      });

      await batch.commit();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              categoryId,
              memosHandled: affectedCount,
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

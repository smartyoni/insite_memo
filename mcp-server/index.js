import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { firestoreApi } from "./firestoreApi.js";

const server = new McpServer({
  name: "explorer-note-app-mcp",
  version: "1.1.0"
});

const FIXED_CATEGORIES = [
  { id: "quick_memo", name: "퀵메모", scope: "explorer", isFixed: true }
];
const FIXED_CATEGORY_IDS = FIXED_CATEGORIES.map((b) => b.id);
const FIXED_INBOX_IDS = ["inbox", "blog_inbox", "clipboard_inbox", "balance_inbox", "clip_inbox", "office_inbox", "ad_inbox"];

const scopeNameMap = {
  explorer: "ME",
  blog: "블로그",
  office: "정보",
  balance: "앱개발",
  experience: "경험",
  clipboard: "계약",
  ad: "광고",
  clip: "북마크",
  template2: "템플릿",
  custom1: "새탭 1",
  custom2: "새탭 2",
  custom3: "새탭 3",
  custom4: "새탭 4",
  custom5: "새탭 5",
  custom6: "새탭 6"
};

function formatChecklists(checklists) {
  if (!Array.isArray(checklists) || checklists.length === 0) return "";
  return checklists.map((c) => {
    let s = c.isSection ? `[섹션] ${c.text || ''}` : `• ${c.text || ''}`;
    if (c.detail && c.detail.trim().length > 0) {
      s += `\n${c.detail.trim()}`;
    }
    return s;
  }).join("\n\n");
}

function normalizePathString(str) {
  if (!str) return "";
  return str
    .replace(/\\/g, "/")
    .replace(/\s*>\s*/g, " > ")
    .replace(/\s*\/\s*/g, " > ")
    .trim();
}

function computeCategoryPath(cat, allCategories, allGroups) {
  if (!cat) return "";
  if (cat.id === "quick_memo") {
    return "ME > 퀵메모";
  }
  if (FIXED_INBOX_IDS.includes(cat.id)) {
    const sName = scopeNameMap[cat.scope || "explorer"] || "ME";
    return `${sName} > In-box`;
  }

  const sName = scopeNameMap[cat.scope || "explorer"] || "ME";
  const group = allGroups.find((g) => g.id === cat.groupId);
  const groupName = group ? group.name : null;

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

  const parts = [sName];
  if (groupName) parts.push(groupName);
  parts.push(...segments);
  return parts.join(" > ");
}

// 1. memo_list_categories
server.tool(
  "memo_list_categories",
  "메모 앱의 모든 카테고리/폴더 목록을 계층 경로 및 parentId, groupId와 함께 조회합니다.",
  {
    scope: z
      .string()
      .optional()
      .describe("특정 탭/스코프 필터 (예: 'explorer', 'blog', 'clipboard', 'balance', 'clip', 'office', 'ad', 'template2', 'experience')")
  },
  async ({ scope }) => {
    try {
      const [categories, groups] = await Promise.all([
        firestoreApi.getDocuments("categories"),
        firestoreApi.getDocuments("categoryGroups")
      ]);

      const activeCategories = categories.filter((c) => !c.isDeleted);
      const combined = [
        ...FIXED_CATEGORIES.map((b) => ({ ...b, parentId: null, groupId: null })),
        ...activeCategories
      ];

      const withPaths = combined.map((c) => ({
        id: c.id,
        name: c.name,
        scope: c.scope || "explorer",
        groupId: c.groupId || null,
        parentId: c.parentId || null,
        order: c.order || 0,
        path: computeCategoryPath(c, activeCategories, groups)
      }));

      withPaths.sort((a, b) => (a.order || 0) - (b.order || 0));
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
    scope: z.string().optional().default("explorer").describe("카테고리 스코프 (기본값: 'explorer')"),
    parentId: z.string().nullable().optional().describe("상위 카테고리 ID (최상위는 null 또는 생략)"),
    groupId: z.string().nullable().optional().describe("소속 대분류 카테고리 그룹 ID (선택)")
  },
  async ({ name, scope, parentId, groupId }) => {
    try {
      const cats = await firestoreApi.getDocuments("categories");
      const created = await firestoreApi.createDocument("categories", null, {
        name: name.trim(),
        order: cats.length,
        scope: scope || "explorer",
        parentId: parentId || null,
        groupId: groupId || null
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              categoryId: created.id,
              name: created.name,
              scope: created.scope,
              parentId: created.parentId,
              groupId: created.groupId
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
  "기존 카테고리의 이름을 변경합니다 (고정 In-box/퀵메모는 변경 불가).",
  {
    categoryId: z.string().describe("수정할 카테고리 ID"),
    newName: z.string().describe("새 카테고리 이름")
  },
  async ({ categoryId, newName }) => {
    if (FIXED_CATEGORY_IDS.includes(categoryId) || FIXED_INBOX_IDS.includes(categoryId)) {
      return {
        isError: true,
        content: [{ type: "text", text: "고정 카테고리의 이름은 변경할 수 없습니다." }]
      };
    }
    try {
      await firestoreApi.updateDocument("categories", categoryId, {
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

// 4. memo_update_category
server.tool(
  "memo_update_category",
  "카테고리의 이름 변경 및 상위 폴더/그룹 이동을 처리합니다.",
  {
    categoryId: z.string().describe("수정할 카테고리 ID"),
    name: z.string().optional().describe("새 카테고리 이름 (선택)"),
    parentId: z.string().nullable().optional().describe("새 상위 카테고리 ID (최상위는 null, 선택)"),
    groupId: z.string().nullable().optional().describe("새 대분류 그룹 ID (선택)")
  },
  async ({ categoryId, name, parentId, groupId }) => {
    if (FIXED_CATEGORY_IDS.includes(categoryId) || FIXED_INBOX_IDS.includes(categoryId)) {
      return {
        isError: true,
        content: [{ type: "text", text: "고정 카테고리는 수정할 수 없습니다." }]
      };
    }
    try {
      const updates = {};
      if (typeof name === "string" && name.trim().length > 0) updates.name = name.trim();
      if (parentId !== undefined) updates.parentId = parentId;
      if (groupId !== undefined) updates.groupId = groupId;

      await firestoreApi.updateDocument("categories", categoryId, updates);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, categoryId, updates }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `카테고리 수정 실패: ${err.message}` }]
      };
    }
  }
);

// 5. memo_delete_category (소프트 삭제 및 하위 메모 안전 이동)
server.tool(
  "memo_delete_category",
  "카테고리를 삭제(소프트 삭제)합니다. 하위 메모는 안전하게 퀵메모로 이동됩니다.",
  {
    categoryId: z.string().describe("삭제할 카테고리 ID")
  },
  async ({ categoryId }) => {
    if (FIXED_CATEGORY_IDS.includes(categoryId) || FIXED_INBOX_IDS.includes(categoryId)) {
      return {
        isError: true,
        content: [{ type: "text", text: "고정 카테고리는 삭제할 수 없습니다." }]
      };
    }
    try {
      const allCats = await firestoreApi.getDocuments("categories");
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

      // Soft delete all target categories
      for (const cid of targetCategoryIds) {
        await firestoreApi.softDeleteDocument("categories", cid);
      }

      // Move items in those categories to quick_memo
      const items = await firestoreApi.getDocuments("items");
      let movedCount = 0;
      for (const it of items) {
        if (!it.isDeleted && targetCategoryIds.includes(it.categoryId)) {
          await firestoreApi.updateDocument("items", it.id, { categoryId: "quick_memo" });
          movedCount++;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              deletedCategoriesCount: targetCategoryIds.length,
              deletedCategoryIds: targetCategoryIds,
              memosMovedToQuickMemo: movedCount
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

// 6. memo_list_memos
server.tool(
  "memo_list_memos",
  "메모 목록을 조회합니다. categoryId로 특정 카테고리 필터링이 가능합니다.",
  {
    categoryId: z.string().optional().describe("필터링할 카테고리 ID (생략 시 전체 메모)"),
    limit: z.number().optional().default(50).describe("최대 조회 개수 (기본 50개)")
  },
  async ({ categoryId, limit: maxCount }) => {
    try {
      let items = await firestoreApi.getDocuments("items");
      items = items.filter((it) => !it.isDeleted);
      if (categoryId) {
        items = items.filter((it) => it.categoryId === categoryId);
      }
      items.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      const sliced = items.slice(0, maxCount);

      const list = sliced.map((data) => {
        const snippet = (data.body || "").slice(0, 100).replace(/\n/g, " ");
        return {
          id: data.id,
          title: data.title || "제목 없음",
          categoryId: data.categoryId || "quick_memo",
          snippet: snippet.length >= 100 ? `${snippet}...` : snippet,
          hasSubBody: Boolean(data.subBody && data.subBody.trim().length > 0),
          updatedAt: data.updatedAt,
          createdAt: data.createdAt
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

// 7. memo_get_memo
server.tool(
  "memo_get_memo",
  "특정 메모의 전체 상세 내용(제목, 본문, 보충노트/체크리스트 등)을 조회합니다.",
  {
    memoId: z.string().describe("조회할 메모의 ID")
  },
  async ({ memoId }) => {
    try {
      const data = await firestoreApi.getDocument("items", memoId);
      if (!data || data.isDeleted) {
        return {
          isError: true,
          content: [{ type: "text", text: `ID '${memoId}'에 해당하는 메모를 찾을 수 없습니다.` }]
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: data.id,
              title: data.title || "",
              body: data.body || "",
              subBody: data.subBody || "",
              checklistContent: formatChecklists(data.checklists),
              categoryId: data.categoryId || "quick_memo",
              updatedAt: data.updatedAt,
              createdAt: data.createdAt
            }, null, 2)
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

// 8. memo_create_memo
server.tool(
  "memo_create_memo",
  "새로운 메모를 작성합니다.",
  {
    title: z.string().describe("메모 제목"),
    body: z.string().optional().default("").describe("메모 본문"),
    subBody: z.string().optional().default("").describe("보충 노트 또는 체크리스트"),
    categoryId: z.string().optional().default("quick_memo").describe("저장할 카테고리 ID (기본값: 'quick_memo')")
  },
  async ({ title, body, subBody, categoryId }) => {
    try {
      const created = await firestoreApi.createDocument("items", null, {
        title: title.trim(),
        body: body || "",
        subBody: subBody || "",
        categoryId: categoryId || "quick_memo"
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              id: created.id,
              title: created.title,
              categoryId: created.categoryId
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

// 9. memo_update_memo
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
      const updates = {};
      if (title !== undefined) updates.title = title.trim();
      if (body !== undefined) updates.body = body;
      if (subBody !== undefined) updates.subBody = subBody;
      if (categoryId !== undefined) updates.categoryId = categoryId;

      const updated = await firestoreApi.updateDocument("items", memoId, updates);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              memoId,
              updatedFields: Object.keys(updates)
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

// 10. memo_delete_memo (소프트 삭제 처리)
server.tool(
  "memo_delete_memo",
  "메모를 삭제(휴지통으로 소프트 삭제)합니다.",
  {
    memoId: z.string().describe("삭제할 메모의 ID")
  },
  async ({ memoId }) => {
    try {
      await firestoreApi.softDeleteDocument("items", memoId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, memoId, action: "soft_deleted" }, null, 2)
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

// 11. memo_search_memos
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

      let items = await firestoreApi.getDocuments("items");
      items = items.filter((it) => !it.isDeleted);
      const matches = [];

      for (const data of items) {
        const title = data.title || "";
        const body = data.body || "";
        const subBody = data.subBody || "";

        const titleMatch = title.toLowerCase().includes(term);
        const bodyMatch = body.toLowerCase().includes(term);
        const subBodyMatch = subBody.toLowerCase().includes(term);

        if (titleMatch || bodyMatch || subBodyMatch) {
          matches.push({
            id: data.id,
            title,
            categoryId: data.categoryId || "quick_memo",
            matchedIn: {
              title: titleMatch,
              body: bodyMatch,
              subBody: subBodyMatch
            },
            snippet: (body || "").slice(0, 120).replace(/\n/g, " "),
            updatedAt: data.updatedAt
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

// 12. memo_get_by_path (핵심 신규 도구: 경로 기반 메모/폴더 원클릭 조회)
server.tool(
  "memo_get_by_path",
  "사용자가 제공한 계층 경로(예: 'ME > 할일관리 > 00.진행중인 일 > 안심통장 신청할까?' 또는 'ME > 퀵메모 > 2026-09-06' 또는 'ME > 부동산')를 분석하여, 해당 메모의 상세 내용(제목, 본문, 체크리스트) 또는 해당 폴더 내의 하위 메모 목록을 한 번에 조회합니다.",
  {
    path: z.string().describe("조회할 경로 문자열 (예: 'ME > 할일관리 > 00.진행중인 일 > 안심통장 신청할까?' 또는 'ME > 부동산')")
  },
  async ({ path: inputPath }) => {
    try {
      const cleanPath = normalizePathString(inputPath);
      if (!cleanPath) {
        return {
          isError: true,
          content: [{ type: "text", text: "경로(path)가 비어있습니다." }]
        };
      }

      const [categories, groups, allItems] = await Promise.all([
        firestoreApi.getDocuments("categories"),
        firestoreApi.getDocuments("categoryGroups"),
        firestoreApi.getDocuments("items")
      ]);

      const activeCategories = categories.filter((c) => !c.isDeleted);
      const activeItems = allItems.filter((i) => !i.isDeleted);

      const combinedCategories = [
        ...FIXED_CATEGORIES.map((b) => ({ ...b, parentId: null, groupId: null })),
        ...activeCategories
      ];

      // Build Category Path Map
      const catPathMap = new Map();
      combinedCategories.forEach((cat) => {
        catPathMap.set(cat.id, computeCategoryPath(cat, activeCategories, groups));
      });

      // Build Items with Full Path
      const itemsWithPaths = activeItems.map((it) => {
        const catPath = catPathMap.get(it.categoryId) || "기타";
        const fullPath = `${catPath} > ${it.title || "제목 없음"}`;
        return {
          ...it,
          catPath,
          fullPath
        };
      });

      // 1. Check exact memo path match (case-insensitive & trimmed)
      const cleanLower = cleanPath.toLowerCase();
      let matchedMemo = itemsWithPaths.find(
        (it) => it.fullPath.toLowerCase() === cleanLower
      );

      // 2. If not matched, try matching memo title if the input path ends with it
      if (!matchedMemo) {
        const segments = cleanPath.split(">").map((s) => s.trim());
        const lastSegment = segments[segments.length - 1];
        const lastLower = lastSegment.toLowerCase();

        const candidates = itemsWithPaths.filter(
          (it) => (it.title || "").toLowerCase() === lastLower
        );
        if (candidates.length === 1) {
          matchedMemo = candidates[0];
        } else if (candidates.length > 1) {
          // If multiple, see which one contains more path segments
          matchedMemo = candidates.find((it) =>
            segments.every((seg) => it.fullPath.toLowerCase().includes(seg.toLowerCase()))
          ) || candidates[0];
        }
      }

      // If matched a MEMO:
      if (matchedMemo) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                found: true,
                type: "memo",
                id: matchedMemo.id,
                path: matchedMemo.fullPath,
                title: matchedMemo.title || "제목 없음",
                body: matchedMemo.body || "",
                subBody: matchedMemo.subBody || "",
                checklistContent: formatChecklists(matchedMemo.checklists),
                categoryId: matchedMemo.categoryId,
                categoryPath: matchedMemo.catPath,
                updatedAt: matchedMemo.updatedAt,
                createdAt: matchedMemo.createdAt
              }, null, 2)
            }
          ]
        };
      }

      // 3. Check if path matches a CATEGORY
      let matchedCategory = combinedCategories.find(
        (cat) => (catPathMap.get(cat.id) || "").toLowerCase() === cleanLower
      );

      if (!matchedCategory) {
        // Try matching category by last segment
        const segments = cleanPath.split(">").map((s) => s.trim());
        const lastSegment = segments[segments.length - 1];
        const lastLower = lastSegment.toLowerCase();
        matchedCategory = combinedCategories.find(
          (cat) => (cat.name || "").toLowerCase() === lastLower
        );
      }

      // If matched a CATEGORY:
      if (matchedCategory) {
        const catPath = catPathMap.get(matchedCategory.id) || matchedCategory.name;
        const catMemos = itemsWithPaths.filter(
          (it) => it.categoryId === matchedCategory.id
        );
        catMemos.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                found: true,
                type: "category",
                categoryId: matchedCategory.id,
                path: catPath,
                name: matchedCategory.name,
                scope: matchedCategory.scope || "explorer",
                memoCount: catMemos.length,
                memos: catMemos.map((m) => ({
                  id: m.id,
                  title: m.title || "제목 없음",
                  path: m.fullPath,
                  snippet: (m.body || "").slice(0, 120).replace(/\n/g, " "),
                  hasSubBody: Boolean(m.subBody && m.subBody.trim().length > 0),
                  updatedAt: m.updatedAt
                }))
              }, null, 2)
            }
          ]
        };
      }

      // 4. Not found - provide helpful search suggestions
      const suggestions = itemsWithPaths
        .filter((it) => it.fullPath.toLowerCase().includes(cleanLower) || cleanLower.split(" ").some((w) => it.fullPath.toLowerCase().includes(w)))
        .slice(0, 5)
        .map((it) => it.fullPath);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              found: false,
              message: `'${inputPath}'에 일치하는 메모나 카테고리를 찾지 못했습니다.`,
              suggestions
            }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `경로 조회 실패: ${err.message}` }]
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Explorer Note App MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal server error:", err);
  process.exit(1);
});

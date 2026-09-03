# Explorer Note App - Custom MCP Server

이 디렉터리는 **메모 관리 앱(`explorer-note-app`)** 전용 Model Context Protocol (MCP) 서버입니다.  
AI 에이전트(Claude, Gemini Antigravity 등)가 표준화된 MCP 프로토콜을 통해 Firestore 기반의 메모 데이터베이스를 직접 읽고 쓸 수 있도록 지원합니다.

---

## 🛠️ 제공되는 MCP Tools (10종)

1. **`memo_list_categories`**
   - 모든 카테고리/폴더 목록 및 기본 In-box 목록 조회
   - 파라미터: `scope` (선택: 'explorer', 'blog', 'clipboard', 'balance', 'clip', 'office', 'ad')

2. **`memo_create_category`**
   - 신규 카테고리 생성
   - 파라미터: `name` (필수), `scope` (선택, 기본 'explorer')

3. **`memo_rename_category`**
   - 기존 카테고리 이름 변경 (고정 In-box 제외)
   - 파라미터: `categoryId` (필수), `newName` (필수)

4. **`memo_delete_category`**
   - 카테고리 삭제 (하위 메모 삭제 또는 In-box로 안전 이동)
   - 파라미터: `categoryId` (필수), `deleteMemos` (선택, 기본 false)

5. **`memo_list_memos`**
   - 메모 목록 조회 (카테고리별 필터링, 정렬, 요약본 제공)
   - 파라미터: `categoryId` (선택), `limit` (선택, 기본 50)

6. **`memo_get_memo`**
   - 특정 메모의 전체 상세 본문 및 보충노트/체크리스트 조회
   - 파라미터: `memoId` (필수)

7. **`memo_create_memo`**
   - 신규 메모 작성
   - 파라미터: `title` (필수), `body` (선택), `subBody` (선택), `categoryId` (선택, 기본 'inbox')

8. **`memo_update_memo`**
   - 기존 메모 내용(제목, 본문, 체크리스트, 카테고리 이동) 수정
   - 파라미터: `memoId` (필수), `title`, `body`, `subBody`, `categoryId`

9. **`memo_delete_memo`**
   - 메모 단건 삭제
   - 파라미터: `memoId` (필수)

10. **`memo_search_memos`**
    - 제목, 본문, 보충노트(체크리스트) 통합 키워드 검색
    - 파라미터: `keyword` (필수), `limit` (선택, 기본 20)

---

## ⚙️ 설정 위치

`~/.gemini/config/mcp_config.json` (또는 Claude 데스크톱의 `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "memo-app-mcp-server": {
      "command": "node",
      "args": [
        "c:\\Users\\User\\Desktop\\앱개발\\메모관리앱\\mcp-server\\index.js"
      ]
    }
  }
}
```

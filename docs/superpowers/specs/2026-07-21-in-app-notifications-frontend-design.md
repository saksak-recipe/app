# 인앱 알림 프론트엔드

날짜: 2026-07-21  
상태: Approved (대화에서 섹션별 승인 완료)  
백엔드 스펙: `back/docs/superpowers/specs/2026-07-21-in-app-notifications-design.md`

## Goal

앱에서 **받은 그룹 초대**와 **유통기한 임박/만료** 알림을 벨 아이콘·알림 목록으로 보고, 초대는 목록에서 바로 수락/거절할 수 있게 한다.

## Decisions

| 항목 | 선택 |
|------|------|
| 진입 | 4탭 공통 `headerRight` 벨 + 미읽음 뱃지 → Stack `/(main)/notifications` |
| 초대 처리 | 알림 행에 수락·거절 버튼 (기존 `acceptInvite` / `rejectInvite` 재사용) |
| 유통기한 탭 | 읽음 처리 후 냉장고 탭(`/(main)/(tabs)`)으로 이동 |
| 서버 상태 | TanStack Query (목록 + unread-count). Zustand 알림 스토어 없음 |
| 폴링 | unread-count: 포커스 + `refetchInterval` ~60초. 목록: 화면 focus 시 refetch |
| UI | 기존 clay 카드 / `Button` / `colors` / Ionicons. 외부 UI 라이브러리 없음 |

## Out of Scope

- 푸시(FCM/APNs)·로컬 알림
- 알림 on/off 설정
- 알림 삭제 UI
- 재료 수정 화면으로의 딥링크
- 백엔드 API/스키마 변경
- 5번째 알림 탭

## Screens & flow

### 탭 헤더 — `NotificationBell`

- 위치: `(tabs)/_layout.tsx` `screenOptions.headerRight`
- 아이콘: `notifications-outline`
- 뱃지: `GET /notifications/unread-count`의 `count` (0이면 숨김, 99 초과는 `99+`)
- 탭 → `router.push('/(main)/notifications')`

### `/(main)/notifications` — 알림 목록

- Stack 등록: `(main)/_layout.tsx`, title `"알림"`
- 데이터: `GET /notifications` (최신순, 서버 정렬 유지)
- 헤더 액션: **모두 읽음** → `POST /notifications/read-all`
- 빈 상태: “새 알림이 없어요”
- 미읽음 행 시각적 강조 (점 또는 surface 대비), 읽음은 약한 텍스트

#### 행 동작

| type | 표시 | 동작 |
|------|------|------|
| `group_invite` | title, body + 수락/거절 | 수락 → `POST /groups/invites/{invite_id}/accept` / 거절 → `.../reject`. 성공 시 해당 알림 `PATCH .../read` 후 `['notifications']`, `['notifications','unread-count']`, `['group']` invalidate |
| `expiry_soon` | title, body | 행 탭 → `PATCH .../read` → `router.replace('/(main)/(tabs)')` (냉장고 = tabs index) |
| `expiry_expired` | title, body | 동일 |

`payload.invite_id`는 문자열 UUID. `payload.ingredient_id`는 백엔드 int — 프론트는 이번 범위에서 딥링크에 쓰지 않음.

### 에러

- 네트워크/서버 오류: 기존 패턴 `Alert.alert`
- 이미 처리된 초대(404 등): Alert 후 알림 읽음 처리 + 목록 갱신

## Architecture

```
[Tabs headerRight]
  NotificationBell
    useQuery(['notifications','unread-count'])
    → push /(main)/notifications

[notifications screen]
  useQuery(['notifications'])
  NotificationRow
    group_invite → accept/reject mutations (groups API)
    expiry_*    → markRead → replace tabs

[mutations]
  markRead / markAllRead → invalidate notifications keys
  accept/reject invite   → invalidate notifications + group keys
```

### File layout

| File | Responsibility |
|------|----------------|
| `src/api/notifications.ts` | list, unreadCount, markRead, markAllRead |
| `src/types/api.ts` | `Notification`, `UnreadCountResponse` 타입 추가 |
| `src/components/NotificationBell.tsx` | 벨 + 뱃지 |
| `src/components/NotificationRow.tsx` | 행 UI + 초대 버튼 |
| `src/app/(main)/notifications.tsx` | 목록 화면 |
| `src/app/(main)/_layout.tsx` | Stack.Screen 등록 |
| `src/app/(main)/(tabs)/_layout.tsx` | headerRight에 Bell |

## API contract (client)

Base: 기존 Axios `/api/v1`.

| Method | Path | 용도 |
|--------|------|------|
| GET | `/notifications` | 목록 |
| GET | `/notifications/unread-count` | `{ count: number }` |
| PATCH | `/notifications/{id}/read` | 단건 읽음 |
| POST | `/notifications/read-all` | 전체 읽음 (204) |

초대 수락/거절은 기존 `src/api/groups.ts` 유지.

## Testing / 수동 확인

- 로그인 후 벨 표시, unread 0이면 뱃지 없음
- 닉네임 초대 수신 → 뱃지 증가 → 목록에 초대 행 → 수락 후 가족 탭 반영·뱃지 감소
- soon 재료 존재 → 목록에 임박 알림 → 탭 시 냉장고로 이동·읽음
- 모두 읽음 → 뱃지 0

## Relation to backend

백엔드가 list/unread 호출 시 expiry sync를 수행하므로, 프론트는 별도 “임박 스캔” API를 호출하지 않는다. 폴링/포커스 refetch만으로 임박 알림이 쌓인다.

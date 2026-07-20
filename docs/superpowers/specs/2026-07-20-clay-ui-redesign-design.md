# 삭삭 Clay Playful UI 리디자인

날짜: 2026-07-20  
상태: Approved (대화에서 섹션별 승인 완료)

## Goal

냉장고 식재료 앱 **삭삭**의 전 화면 UI를 Clay Playful 톤으로 다듬어, 기능은 유지한 채 더 말랑하고 신선한 인상을 준다.

## Decisions

| 항목 | 선택 |
|------|------|
| 스타일 | Clay Playful (B) |
| 범위 | 전 화면 — 로그인, 회원가입, 냉장고, 식재료 추가 (A) |
| 팔레트 | 에메랄드 + 앰버 리프레시 (B) |
| 구현 | StyleSheet 폴리시 + `expo-linear-gradient` (1) |
| 모션 | Press opacity/가벼운 scale만. Reanimated 없음 |
| 비범위 | NativeWind 전환, API/기능 변경, 스프링·blob 애니메이션 |

## Visual System

### Colors

| Token | Value | Use |
|-------|-------|-----|
| `primary` | `#059669` | 브랜드, primary CTA |
| `primaryDark` | `#047857` | 그라데이션 하단, pressed |
| `secondary` | `#10B981` | soft fill, 아이콘 |
| `primarySoft` | `#D1FAE5` | 아이콘 배경, soft surface |
| `accent` | `#D97706` | pill, 칩 하이라이트, 힌트 |
| `accentSoft` | `#FEF3C7` | accent 배경 |
| `bg` | `#ECFDF5` | 앱 배경 |
| `surface` | `#FFFFFF` | clay 카드 |
| `text` | `#0F172A` | 본문 |
| `textMuted` | `#64748B` | 보조 |
| `border` | `#E1F2ED` | 필요 시 약한 구분 |
| `danger` | `#DC2626` | 삭제 |
| `dangerSoft` | `#FEE2E2` | 삭제 버튼 배경 |

### Clay tokens

- Card radius: `24–28`
- Button radius: `20`
- Input radius: `18`
- Chip radius: `999`
- Shadow: soft dual-layer (위쪽 하이라이트 느낌 + 아래 soft drop). 강한 테두리 대신 shadow로 구분
- Primary button fill: vertical gradient `primary` → `primaryDark`

### Typography

- 시스템 폰트 유지 (Expo 기본)
- 브랜드 “삭삭”: `fontWeight: '800'`, 큰 사이즈, tight letter-spacing
- Body 16 / meta 13 / label 13 semibold
- 제목: 22–28, bold

## Screens

### Login / Signup

- 배경 `bg`, 상단 soft blob(연한 에메랄드 원/타원 View)으로 분위기
- 로그인: **삭삭** 히어로 + 한 줄 서브카피
- 회원가입: “회원가입” 타이틀 + 삭삭 연결 서브카피
- 폼 필드를 하나의 clay surface 카드 안에 배치
- Primary CTA 그라데이션, 하단 링크는 primary/accent 톤

### Fridge (index)

- 헤더 clay 카드: 인사 + 닉네임, ghost 로그아웃
- 식재료 개수: 작은 **amber pill**
- 리스트: clay `IngredientItem` (leaf 아이콘 원 + 이름 + 구매일 + soft 삭제)
- Empty: 큰 soft 아이콘 원 + 카피 + amber 힌트
- 하단: “식재료 추가” primary 강조, “전체 비우기” danger soft secondary

### Add ingredient

- 힌트 텍스트
- Multiline clay TextField
- Suggestion chips: soft green; 탭 시 press feedback만 (영구 selected 상태 없음, 기존처럼 이름 append)
- Preview 텍스트
- “냉장고에 넣기” primary, “취소” ghost

## Components

| File | Change |
|------|--------|
| `src/theme/colors.ts` | 팔레트 갱신 |
| `src/components/Button.tsx` | clay radius, gradient primary (`expo-linear-gradient`), press feedback |
| `src/components/TextField.tsx` | softer border/shadow, larger radius |
| `src/components/IngredientItem.tsx` | clay card styling |
| `src/components/EmptyFridge.tsx` | soft icon + amber hint |
| `src/app/(auth)/login.tsx` | blob + form card layout |
| `src/app/(auth)/signup.tsx` | 동일 패턴 |
| `src/app/(main)/index.tsx` | header pill, action hierarchy |
| `src/app/(main)/add.tsx` | chips + CTA polish |
| `package.json` | add `expo-linear-gradient` |

Optional small helper: `src/theme/shadows.ts` with reusable clay shadow styles — only if it reduces duplication.

## Motion

- Pressable: `opacity ~0.88` and/or scale `0.98` via style
- No Reanimated, no floating blobs animation, no haptics requirement

## Success criteria

- 전 화면이 동일 팔레트·radius·shadow 언어를 씀
- 로그인에서 브랜드 “삭삭”이 첫인상으로 읽힘
- Primary CTA가 시각적으로 가장 강함
- 기존 플로우(로그인/가입/목록/추가/삭제) 동작 유지
- 라이트 모드 대비 충분 (본문 vs 배경 4.5:1 목표)

## Out of scope

- Dark mode
- Custom font 설치
- Reanimated clay spring
- NativeWind migration
- Backend / API / auth logic changes

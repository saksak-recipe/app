# Soft UI 무게감 완화 (타이포 · 컴포넌트)

날짜: 2026-07-26  
상태: Approved (대화에서 방향·범위·섹션 승인)

## Goal

앱이 **굵은 타이포(800) · 두툼한 버튼 · 강한 clay 그림자** 때문에 딱딱하게 느껴지는 문제를 줄이고,  
기존 emerald 팔레트는 유지한 채 **Soft UI Evolution** 톤으로 글자·컨트롤·카드/행을 가볍게 만든다.

## Decisions

| 항목 | 선택 |
|------|------|
| 딱딱함의 원인 | B: 타이포·컴포넌트 무게감 (색/톤 차가움은 이번 범위 아님) |
| 구현 접근 | 2: Soft UI 고도화 — 토큰 + Button/카드/행/탭바·헤더 |
| 범위 | 탭 + 스택 + 인증 화면 전체 (공통 토큰/컴포넌트를 쓰는 곳) |
| 팔레트 | 기존 emerald clay `colors` 유지. 새 색상 체계·커스텀 폰트 없음 |
| 레이아웃 | 2026-07-22 breathing-room(가벼운 헤더·여백) 유지. 구조 재배치 없음 |
| 기능 | API·탭 IA·비즈니스 로직 변경 없음 |

## Out of Scope

- 색상 팔레트 / 브랜드 컬러 변경
- Nunito 등 커스텀 폰트 도입
- NativeWind 전환, 다크모드
- Reanimated / 새 모션 라이브러리
- 화면 레이아웃 구조 변경(헤더 카드 재도입·그리드 개편 등)
- 컴포넌트 public API·라우팅 변경

## Problem

1. `typography.title` / `section` 및 화면 인라인 스타일에 `fontWeight: '800'`이 많아 제목이 무겁다.
2. `Button` 높이 54 + 그라데이션 + `700` 라벨이 컨트롤을 두툼하고 딱딱하게 만든다.
3. 리스트 행·폼 카드에 `clayShadow`(강한 elevation)가 남아 soft 톤과 섞인다.
4. 탭바·헤더 타이틀도 `700`이라 전체 톤이 한결같이 세다.

## Visual direction

### 원칙

- **무게는 타이포·컨트롤·그림자로만 푼다.** 색은 건드리지 않는다.
- 제목은 **700**, 본문·라벨은 **500–600** 대역. `800`은 제거.
- 그림자는 **soft 기본**. `clayShadow`는 히어로/강조 패널이 꼭 필요할 때만 (가능하면 soft로 통일).
- 리스트 행은 shadow보다 **border 또는 연한 surface**로 구분.
- breathing-room의 여백·플레인 헤더는 유지.

### Token changes

#### `src/theme/typography.ts`

| 토큰 | 현재 | 목표 |
|------|------|------|
| `title` | 24 / 800, ls -0.4 | 24 / **700**, ls **-0.3** |
| `section` | 18 / 800 | **17** / **600** |
| `body` | 15 / 500 | 유지 |
| `caption` | 13 / 500 | 13 / **400** |
| `label` | 12 / 700 | 12 / **600** |

#### `src/theme/radius.ts`

| 키 | 방향 |
|----|------|
| `sm`–`xl`, `card` | 각 **+2~4** (예: sm 12→14, md 16→18, lg 20→22, xl 24→26, card 28→30) |
| `pill` | 999 유지 |

#### `src/theme/shadows.ts`

- 사용 규칙: 행·폼·일반 카드 → `clayShadowSoft` 또는 shadow 없음 + `border`.
- `clayShadow` 신규 사용 금지에 가깝게. 기존 강한 shadow 호출부는 soft로 교체.
- soft 값 자체는 유지해도 되고, opacity를 소폭 낮춰도 됨 (선택).

`spacing` / `colors`는 이번 스펙에서 변경하지 않는다.

## Component changes

### `Button`

- `minHeight` **54 → 48**
- `borderRadius` **20 → 24** (또는 `radius.xl`/`card`에 맞춤)
- Primary: `LinearGradient` 제거 → `backgroundColor: colors.primary` 단색
- 라벨 `fontWeight` **700 → 600**
- pressed: 기존 scale 유지, opacity는 과하지 않게

### `TextField`

- `minHeight` **54 → 48** (Button과 맞춤)
- radius는 토큰 상향에 맞춤

### Cards (`RecipeCard`, `SavedRecipeCard` 등)

- `clayShadow` → `clayShadowSoft` (또는 soft + `border: colors.border`)
- 제목 `800 → 700`, 메타/배지 `700 → 600`
- 패딩·내부 gap은 유지

### List rows (`ExpiryIngredientRow`, `IngredientItem`, `ShoppingItemRow`, `NotificationRow`)

- shadow 제거 또는 soft만
- 구분: `borderWidth: 1`, `borderColor: colors.border` 및/또는 연한 fill
- 이름·배지 텍스트 `700 → 600`

### Chrome (`(tabs)/_layout`, `(main)/_layout`)

- `headerTitleStyle.fontWeight` **700 → 600**
- `tabBarLabelStyle.fontWeight` **700 → 600**

### ScopeToggle / SectionHeader / Empty* / NotificationBell

- 인라인 `800`/`700`을 토큰 또는 **600–700** 상한에 맞춤
- 토글 active 라벨도 `800` 제거

## Screen pass (인라인 정리)

토큰·공통 컴포넌트 반영 후에도 남는 인라인 `fontWeight: '800'` / `clayShadow`를 화면별로 soft 규칙에 맞게 정리한다.

| 영역 | 파일 (대표) |
|------|-------------|
| 탭 | `fridge`, `shopping`, `group`, `settings`, `index`(토큰 위주) |
| 스택 | `recipes/*`, `notifications`, `add`, `edit-ingredient`, `merge` |
| 인증 | `login`, `signup`, `verify-email`, `password-reset`, `kakao-profile` |

레이아웃 구조(섹션 구성, 헤더 카드 유무)는 바꾸지 않는다. **weight / shadow / radius / 버튼 fill**만 맞춘다.

## Implementation order

1. `typography.ts`, `radius.ts` (+ 필요 시 soft shadow 미세 조정)
2. `Button`, `TextField`
3. 카드·행·ScopeToggle·SectionHeader 등 공유 컴포넌트
4. 탭바·스택 헤더 chrome
5. 탭 → 스택 → 인증 순으로 인라인 `800` / `clayShadow` 정리
6. `npx tsc --noEmit`로 타입 확인

## Success criteria

- 앱 전역에서 `fontWeight: '800'`이 사실상 사라지거나, 의도적 예외가 문서화됨
- Primary 버튼이 그라데이션 없이 단색·높이 48로 보임
- 리스트 행이 강한 clay elevation 없이 soft/border로 구분됨
- emerald 팔레트·기존 여백 레이아웃·기능 동작 유지
- 탭·스택·인증 화면의 시각 톤이 한결같이 가벼움

## Non-goals reminder

색을 따뜻하게 바꾸거나 폰트를 교체하는 것은 **후속 작업**. 이번은 “딱딱한 무게감”만 푼다.

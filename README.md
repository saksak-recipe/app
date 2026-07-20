# 삭삭 앱

냉장고 식재료 관리 앱 (Expo + FastAPI `back` 연동)

## 실행

1. 백엔드 실행 (`../back`, 포트 `8000`)
2. 앱 디렉터리에서:

```bash
npm start
```

## API URL

`.env`의 `EXPO_PUBLIC_API_URL`을 사용합니다.

- iOS 시뮬레이터 / Android 에뮬레이터: `http://localhost:8000`
- 실기기: Mac LAN IP로 변경 (예: `http://192.168.0.10:8000`)

## 기능

- 회원가입 / 로그인 (JWT)
- 식재료 목록 조회
- 식재료 일괄 추가
- 단건 삭제 / 전체 삭제

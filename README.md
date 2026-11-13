# 모여모여 — React Native / Expo

2~6명이 함께 사용하는 도트 아지트 앱입니다. 기존 LLM 웹 도구를 교체했습니다. iOS·Android UI는 `App.tsx`와 `src/`에 있고, 웹 페이지는 초대 링크 안내 용도뿐입니다.

## 구현한 기능

- 정원 2~6명으로 방 생성, 10자리 코드 및 링크 공유로 입장
- **최초 정원이 모두 채워질 때까지 대기실 유지**. 서버·DB가 정원 및 시작 조건을 강제하며, 이후에는 혼자 접속해도 사용 가능
- 사람마다 하나의 캐릭터: 이름, 4가지 머리, 6가지 옷 색상
- 도트 공간에서 탭한 위치로 이동, 애니메이션, 멤버 접속 상태, 60자 말풍선
- 화면 활성화 중 1.5초 간격 서버 동기화. 백그라운드에서는 중지. WebSocket 게임 엔진은 아니며 이동 반영에는 네트워크 지연이 있음
- 공유 월간 캘린더, 날짜·시간·참여자·메모 등록, 작성자/방장의 수정·삭제
- 4가지 공동 테마, 6가지 기본 가구 켜기/끄기. 동시 수정 충돌 감지
- 한국 시간 기준 하루 한 번 출석, 10코인 중복 지급 방지
- 기기 계정 및 복구 코드. 로그인 키는 네이티브 SecureStore, 서버에는 SHA-256 해시만 저장

## 실행

Node.js LTS와 pnpm을 설치한 뒤:

```sh
cd /Users/leemiju/test/looplab
corepack pnpm install
corepack pnpm start
```

프로젝트는 **Expo SDK 57 / React Native 0.86**을 사용합니다. 휴대폰에는 해당 SDK와 호환되는 Expo Go가 필요합니다. 지원 버전은 https://expo.dev/go 에서 확인하세요. 개발 서버와 휴대폰은 같은 네트워크에 있어야 합니다. QR 코드를 스캔한 뒤 서로 다른 휴대폰에서 방 생성/코드 입장을 테스트할 수 있습니다.

`EXPO_PUBLIC_API_URL`은 기본적으로 https://looplab-playground.dlalwnjenny.chatgpt.site 입니다. 공개 URL은 비밀이 아니며 클라이언트에 포함됩니다. 실제 데이터는 bearer 인증 및 방 멤버십으로 제한합니다.

### 설치 가능한 네이티브 빌드

```sh
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview
```

EAS 계정, 빌드 프로젝트 연결 및 플랫폼별 서명 설정이 필요합니다. iOS 기기 설치에는 Apple 개발자 계정과 기기 등록이 필요할 수 있습니다. 이 작업에서 App Store/TestFlight 배포나 APK/IPA 서명 빌드는 하지 않았습니다. `eas.json`의 preview는 내부 배포 설정이며 Android는 APK로 생성합니다.

초대 링크는 설치된 앱의 `moyeo://join?code=...` 스킴을 엽니다. **Expo Go에서는 직접 10자리 코드 입력을 사용하세요.** 자체 앱을 빌드하면 커스텀 스킴 링크를 사용할 수 있습니다.

## 계정과 초대

처음 열면 기기 계정이 생성됩니다. 앱 재실행 시 같은 캐릭터로 돌아옵니다. 앱 삭제/휴대폰 변경 전에 ‘내 계정’의 복구 코드를 안전한 곳에 보관하세요. 복구 코드는 계정 비밀번호와 같으므로 친구에게 보내면 안 됩니다. 친구에게는 **방 초대 코드**만 공유하세요.

서버의 `/api/session`에서 기기 토큰을 등록/복원하고, 모든 방 데이터 API에서 bearer 토큰을 검증합니다. 방 ID만 알아서는 다른 방 데이터를 볼 수 없습니다. 코드가 유출되었을 때 방장이 초대 코드를 다시 발급할 수 있습니다. 현재 한 계정은 한 방에만 참여합니다. 방 탈퇴/방장 이전, 소셜 로그인, 계정 삭제 기능은 후속 작업입니다.

## 서버 개발

Cloudflare Worker + D1(SQLite). `drizzle/`의 생성된 마이그레이션에 테이블과 정원·시작 트리거가 포함됩니다.

```sh
corepack pnpm build
corepack pnpm server
```

로컬 서버는 `0.0.0.0:4173`에서 실행되고 `.local/moyeo.sqlite`에 저장합니다. 휴대폰에서 로컬 서버를 쓰려면 `.env`에 `EXPO_PUBLIC_API_URL=http://<컴퓨터-LAN-IP>:4173`를 지정하고 Expo를 재시작하세요. 네이티브 HTTP 제한이 있는 빌드에서는 HTTPS 개발 서버를 사용하세요.

## 검증

```sh
corepack pnpm typecheck
corepack pnpm test
npx expo export --platform ios --platform android --output-dir .local/native-export
```

서버 테스트는 실제 SQLite 마이그레이션을 적용하여 정원 경쟁, 시작 조건, 계정 복원, 다른 방 접근 차단, 일정 권한/충돌, 초대 코드 변경, 출석 중복 지급, 위치와 말풍선 동기화를 검사합니다. iOS/Android JavaScript 번들 검증은 네이티브 서명 빌드·실기기 검증과 다릅니다.

## 다음 단계

기본 꾸미기는 무료입니다. 미니게임·코인 상점, 가구 자유 배치, 푸시 알림, 반복 일정, 앱 스토어 출시 준비는 이번 버전에 포함하지 않았습니다. 출석 코인은 서버에 쌓이며 이후 상점 기능과 연결할 수 있습니다.

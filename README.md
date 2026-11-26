# 사이로 — React Native / Expo

사이로는 2~6명이 함께 쓰는 도트 아지트 앱입니다. iOS·Android 앱은 `App.tsx`와 `src/`에 구현되어 있고, `public/`의 웹 페이지는 초대 링크 안내용입니다. 앱은 Expo / React Native, API는 Cloudflare Worker, 데이터 저장은 D1(SQLite)을 사용합니다.

## 기능

- 정원 2~6명의 방 생성, 10자리 초대 코드와 링크 공유
- 설정한 정원이 모두 모이면 방이 시작됩니다. 시작 후에는 멤버가 오프라인이어도 방을 사용할 수 있습니다.
- 기기별 계정과 복구 코드, 캐릭터 이름·머리 스타일 8종·옷 색상 6종
- 탭한 위치로 이동하는 도트 공간, 멤버 접속 상태, 최대 60자 말풍선
- 월간 공유 캘린더와 일정 등록. 작성자 또는 방장이 수정·삭제할 수 있고, 일정 등록 알림을 받습니다.
- 방 공지 제목과 내용, 작성자 및 수정 시각 표시
- 사진 남기기와 방 멤버 사진 보기
- 4가지 공동 테마, 가구 10종 켜기·끄기, 검색. 변경 충돌을 감지합니다.
- 알림함: 새 말풍선, 사진, 일정 등록 및 투표 완료 알림
- 한국 시간 기준 하루 한 번 출석해 10코인 받기
- 미니게임 2종: 짝 맞추기, 같은 답 고르기. 게임별 하루 한 번 5코인 보상

앱은 화면이 활성화되어 있을 때 1.5초마다 서버 상태를 동기화하며 백그라운드에서는 중지합니다. 실시간 소켓 연결 방식은 아니므로 멤버 이동이나 메시지 반영에 네트워크 지연이 있을 수 있습니다. 같은 답 고르기 결과는 방 멤버 전원이 답한 뒤 공개됩니다.

## 개발 환경 실행

Node.js LTS와 pnpm을 준비한 뒤 프로젝트에서 실행합니다.

```sh
corepack pnpm install
corepack pnpm start
```

프로젝트는 Expo SDK 57 / React Native 0.86을 사용합니다. Expo Go는 프로젝트 SDK와 호환되는 버전이 필요하며, 개발 서버와 휴대폰은 같은 네트워크에 연결되어야 합니다. QR 코드를 스캔한 뒤 방 생성과 코드 입장을 테스트할 수 있습니다.

기본 API 주소는 `https://looplab-playground.dlalwnjenny.chatgpt.site`이며 `EXPO_PUBLIC_API_URL` 환경 변수로 바꿀 수 있습니다. 이 주소는 앱 클라이언트에 포함되는 공개 설정값입니다. 실제 방 데이터 API는 bearer 인증과 방 멤버십을 확인합니다.

## 같은 Wi-Fi에서 로컬 서버로 테스트

서버와 Expo를 함께 실행하려면 다음 명령을 사용합니다.

```sh
corepack pnpm dev
```

이 스크립트는 컴퓨터의 LAN 주소를 앱 API 주소로 지정합니다. 별도로 실행하려면 `.env`에 아래처럼 컴퓨터의 LAN IP를 지정하고 Expo를 재시작합니다.

```sh
EXPO_PUBLIC_API_URL=http://<컴퓨터-LAN-IP>:4173
```

로컬 API 서버는 `0.0.0.0:4173`에서 실행되고 SQLite 파일은 `.local/moyeo.sqlite`에 저장됩니다. 네이티브 빌드의 네트워크 보안 설정에 따라 HTTP 대신 HTTPS 개발 주소가 필요할 수 있습니다.

## 계정과 초대

처음 실행하면 기기 계정이 생성되고 앱 재실행 시 같은 계정으로 돌아옵니다. 앱 삭제나 휴대폰 변경 전에 설정의 ‘내 계정’에서 복구 코드를 확인해 안전하게 보관하세요. 복구 코드는 계정 접근 권한과 같으므로 다른 사람에게 공유하지 마세요. 친구에게는 방 초대 코드나 링크만 전달하면 됩니다.

서버는 기기 토큰의 SHA-256 해시를 저장합니다. 방 ID만으로 방 데이터를 조회할 수 없고, 한 계정은 한 방에 참여합니다. 방장은 초대 코드를 재발급해 기존 초대 링크를 무효화할 수 있습니다.

## 네이티브 설치 빌드

EAS 계정과 프로젝트 연결, 플랫폼별 서명 설정 후 빌드할 수 있습니다.

```sh
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview
```

`preview`는 내부 배포용이며 Android 산출물은 APK입니다. iOS 기기 설치에는 Apple 개발자 계정과 기기 등록이 필요할 수 있습니다. 이 명령은 빌드 안내이며 App Store/TestFlight 배포를 수행하지 않습니다.

초대 링크는 `moyeo://join?code=...` 앱 스킴을 사용합니다. Expo Go에서는 링크가 앱으로 연결되지 않을 수 있으므로 10자리 코드를 직접 입력하고, 커스텀 앱 빌드에서는 링크를 사용할 수 있습니다.

## 서버 및 데이터베이스 개발

서버는 Cloudflare Worker와 D1(SQLite)을 사용합니다. `db/schema.ts`가 스키마를 정의하고 `drizzle/`에 생성된 마이그레이션이 있습니다. 로컬 빌드 및 서버 실행:

```sh
corepack pnpm build
corepack pnpm server
```

`pnpm build`는 Worker와 초대 안내 페이지를 `dist/`에 생성합니다. 데이터베이스 마이그레이션 생성 명령은 `corepack pnpm db:generate`입니다.

## 검증 명령

```sh
corepack pnpm typecheck
corepack pnpm test
npx expo export --platform ios --platform android --output-dir .local/native-export
```

서버 테스트는 SQLite 마이그레이션을 적용해 방 정원과 시작 조건, 계정 복원, 방 접근 권한, 일정 권한과 충돌, 초대 코드 변경, 출석·게임 보상 중복 방지, 알림·사진·도트 상태 동기화 등을 확인합니다. Expo export는 JavaScript 번들 확인이며 네이티브 서명 빌드나 실기기 검증을 대신하지 않습니다.

## 아직 구현되지 않은 기능

현재 코드에는 계정의 방 탈퇴, 방장 이전, 소셜 로그인, 계정 삭제, 가구 자유 배치, 푸시 알림, 반복 일정, 코인 상점이 없습니다. 코인은 출석과 미니게임 보상으로 적립되지만 사용할 상점은 아직 구현되지 않았습니다. 스토어 출시 준비와 배포도 별도 작업입니다.

# 서현위키

첨부된 세 화면의 남색 상단바, 학교 문장, 홈 화면의 움직이는 청록·파랑 그라데이션을 참고해 만든 한국어 위키 프런트엔드입니다. 프레임워크 없이 정적 파일로 구성했고, Firebase를 연결하기 전에는 예시 문서와 편집 데이터가 이 브라우저의 `localStorage`에 저장됩니다.

## 실행

로컬 미리보기는 `index.html`을 브라우저에서 직접 열어도 됩니다. Firebase 연결을 확인할 때는 브라우저 보안 정책 때문에 로컬 웹 서버로 실행하세요.

```sh
python3 -m http.server 8000
```

그다음 `http://localhost:8000`을 엽니다. Firebase 설정 전에도 문서 검색, 예시 문서 보기, 로컬 문서 편집, 추천 문서, 검색어 랭킹, AI 문서 기반 답변, 관리자 화면 미리보기를 사용할 수 있습니다.

## Firebase 연결

1. Firebase 프로젝트를 만들고 웹 앱을 추가합니다.
2. Authentication에서 Google 로그인을 켜고, Firestore Database와 Firebase Storage 버킷을 만든 뒤 `firestore.rules`와 `storage.rules`를 배포합니다. Storage는 사용 전 Firebase 콘솔에서 버킷 설정이 필요합니다.
3. `firebase-config.js`의 빈 값을 Firebase 콘솔의 웹 앱 설정으로 채웁니다.
4. Firebase 콘솔의 AI Services → AI Logic에서 Gemini Developer API를 설정합니다. AI Logic에서 App Check가 적용된 프로젝트의 웹 앱은 reCAPTCHA Enterprise를 사용해야 합니다. 운영 도메인을 등록한 공개 사이트 키를 Firebase App Check 웹 앱 등록에 사용하고, 해당 사이트 키를 `firebase-config.js`의 `appCheckSiteKey`에 입력하세요. reCAPTCHA 비밀 키는 코드에 넣지 마세요. 로컬에서는 `http://localhost:8000/?appcheckdebug=1`로 실행하고, 콘솔에 표시되는 App Check 디버그 토큰을 Firebase 허용 목록에 등록합니다. 디버그 토큰은 운영 사이트에 사용하지 마세요.
5. 정적 호스팅에 이 파일들을 배포합니다. 로그인·문서 편집은 Firebase 설정을 채운 뒤 인증된 사용자에게 제공됩니다.

```sh
firebase deploy --only hosting,firestore:rules,storage
```

현재 앱은 Firebase JS SDK 12.19.0의 Auth, Firestore, Storage, AI Logic 모듈과 `gemini-3.8-flash` 모델을 사용합니다. Firebase AI Logic은 프런트엔드에서 Gemini를 부르는 용도로 사용하므로 별도의 Gemini API 키를 브라우저 코드에 넣지 않습니다. Firebase AI Logic 서비스 이용은 무료지만 Gemini Developer API 사용량은 별도 쿼터·요금 정책을 따르므로, 배포 전에 [Firebase AI Logic 요금 안내](https://firebase.google.com/docs/ai-logic/pricing)와 프로젝트의 현재 한도를 확인하세요.

### 권한과 문서 제한

- 관리자는 Google 로그인 후 인증된 이메일이 `hmpark014@gmail.com`인 계정입니다.
- 일반 문서는 로그인한 이용자가 편집하고 저장하면 바로 반영됩니다. 편집 제한 문서는 수정안이 `editRequests`에 저장되고, 관리자 또는 관리자가 권한을 부여한 편집 관리자가 승인해야 반영됩니다.
- 편집 제한 설정/해제와 편집 제안 승인 권한은 `hmpark014@gmail.com` 관리자만 부여·회수할 수 있습니다. 이용자는 한 번 Google 로그인하면 관리자 센터의 `편집 권한` 목록에 나타납니다.
- `firestore.rules`가 문서 직접 편집, 편집 제한, 편집 제안 및 승인 권한을 서버에서 검사합니다. 규칙을 배포하기 전에는 브라우저 UI만 바뀌고 Firebase의 권한 검사는 적용되지 않습니다.
- 기본값은 문서 본문 6,000자, 사진 링크 2개, 동영상 링크 0개입니다. 본문은 UTF-8 크기 18,000바이트로도 제한합니다.
- 초과 요청의 내용은 별도의 `limitRequests` 문서로 저장되고 관리자가 승인할 때 공개 문서로 반영됩니다.
- 문서 편집기에서 JPEG·PNG·WebP·GIF 사진 파일(최대 5MB)을 Firebase Storage에 올릴 수 있습니다. 사진은 공개 위키 페이지에 표시되므로 `storage.rules`는 사진 읽기를 공개하고, 업로드는 인증된 서현고 계정 또는 관리자 본인 경로로 제한합니다. `firebase deploy --only storage`로 Storage 규칙을 배포해야 업로드가 허용됩니다.
- Firebase Storage 요금제·버킷 설정은 프로젝트와 현재 Firebase 정책을 따릅니다. Storage 활성화 과정에서 결제 요금제 변경이 요구되면 비용 조건을 먼저 확인하세요. 코드에서는 결제 설정을 변경하지 않습니다.
- 관리자 화면의 글자·미디어 제한값은 현재 브라우저 미리보기 설정입니다. Firebase 실서비스의 기본 제한은 `firestore.rules`의 값과 맞춰 함께 수정해 배포해야 합니다.
- 승인 알림은 이 버전에서 관리자 화면의 대기 목록에 표시됩니다. 이메일/푸시 알림 발송은 외부 비용과 별도 서버 구성이 필요해 포함하지 않았습니다.

### Firebase AI Logic 참고

Firebase AI Logic은 웹 SDK에서 `getAI`와 `getGenerativeModel`을 사용해 연결합니다. 현재 앱은 Gemini Developer API의 `gemini-3.8-flash` 모델을 사용합니다. 모델과 API의 사용량 한도 및 요금은 Firebase 콘솔에서 확인하세요. AI Logic에서 App Check가 적용되면 유효한 토큰이 없는 요청은 차단됩니다. 운영 웹 앱에는 reCAPTCHA Enterprise 사이트 키를 사용하고, 로컬 개발에서는 이 앱의 `?appcheckdebug=1` 모드와 Firebase에 등록한 디버그 토큰을 사용하세요.


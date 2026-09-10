# 🌐 공급망 실시간 모니터링 시스템 배포 및 운영 가이드

인천(한국)과 코코모(미국) 거점 담당자가 각자의 재고를 매일 입력하고, 전 세계 누구나 웹 브라우저에서 실시간으로 공급망을 모니터링할 수 있도록 **Supabase(실시간 데이터베이스)** + **Vercel(무료 글로벌 웹 호스팅)** 구축 가이드입니다.

---

## 📌 시스템 구성 및 권한 체계

1. **일반 접속자 (Viewer)**:
   - 별도 로그인 없이 배포된 웹 URL로 접속하여 실시간 지도 및 재고 현황 모니터링.
2. **인천 거점 담당자 (`PIN: 1001`)**:
   - 상단 `[열람모드]` 클릭 후 `1001` 입력 시 **인천 재고(검사대기/합격 로트)** 및 **태평양 해상/항공 차수** 등록·수정 권한 활성화.
3. **미국 코코모 담당자 (`PIN: 2002`)**:
   - 상단 `[열람모드]` 클릭 후 `2002` 입력 시 **미주법인 3대 재고(Multi / Cap / Back)** 및 **SPE 고객 재고/일일 소진율** 수정 권한 활성화.
4. **마스터 총괄 관리자 (`PIN: 31796`)**:
   - 전 거점 수정, 엑셀 일괄 업로드, 환경설정 등 모든 통제 권한 보유.

> **💡 핵심 기능 (WebSocket Realtime)**:
> 한 거점에서 재고를 수정하고 저장하면, 브라우저를 새로고침하지 않아도 전 세계 모든 모니터링 화면에 **1초 이내 실시간 레이더 핑과 함께 동기화**됩니다.

---

## 🚀 1단계: Supabase 실시간 데이터베이스 세팅 (약 2~3분)

1. [https://supabase.com](https://supabase.com) 에 접속하여 무료 회원가입 (GitHub 계정으로 원클릭 로그인 가능).
2. **`New Project`** 버튼을 누르고 프로젝트를 생성합니다.
   - **Name**: `supply-chain-monitor` (원하는 이름)
   - **Database Password**: 원하는 비밀번호 입력 (기억해두세요)
   - **Region**: `Northeast Asia (Seoul)` 또는 `Northeast Asia (Tokyo)` 선택
3. 프로젝트가 생성되면, 좌측 사이드바 메뉴에서 **`SQL Editor`** 아이콘을 클릭합니다.
4. **`New query`**를 클릭하고, 본 프로젝트 루트에 준비된 **[`supabase_schema.sql`](./supabase_schema.sql)** 파일의 내용을 전체 복사하여 붙여넣은 뒤, 우측 하단의 **`Run`** 버튼을 누릅니다.
   - 4개 테이블(`inventory_incheon`, `inventory_kokomo`, `inventory_spe`, `shipments`)이 자동 생성되고 실시간 동기화(Realtime)가 활성화됩니다.
5. 좌측 메뉴 맨 아래 **`Project Settings` (톱니바퀴)** -> **`API`** 탭을 클릭합니다.
   - 다음 2가지 값을 복사해 둡니다:
     - **Project URL** (예: `https://abcdefghijklmn.supabase.co`)
     - **Project API keys**의 **`anon` `public`** 키 (예: `eyJhbGciOiJIUzI1NiIsIn...`)

---

## 🚀 2단계: Vercel 무료 웹 호스팅 배포 (약 2분)

### 방법 A: GitHub 연동 원클릭 배포 (가장 추천)
1. 현재 소스코드를 GitHub 저장소(Repository)에 푸시(Push)합니다.
2. [https://vercel.com](https://vercel.com) 에 접속하여 무료 로그인합니다.
3. **`Add New...`** -> **`Project`**를 클릭하고 GitHub 저장소를 선택(`Import`)합니다.
4. **`Environment Variables`** (환경 변수) 항목을 펼치고 1단계에서 복사한 2개 값을 추가합니다:
   - **Key**: `VITE_SUPABASE_URL` / **Value**: `[Supabase Project URL]`
   - **Key**: `VITE_SUPABASE_ANON_KEY` / **Value**: `[Supabase anon public key]`
5. **`Deploy`** 버튼을 누르면 약 1분 후 고유 웹 주소(예: `https://retro-inventory-monitor.vercel.app`)가 생성되며 전 세계에 배포가 완료됩니다!

### 방법 B: Vercel CLI로 로컬에서 터미널 즉시 배포
터미널(PowerShell)에서 다음 명령어로 즉시 배포할 수도 있습니다:
```bash
# Vercel CLI 전역 설치 (최초 1회)
npm install -g vercel

# 배포 실행
vercel

# 환경변수 등록
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# 프로덕션 배포
vercel --prod
```

---

## 💻 로컬 개발 환경에서 Supabase 연결 테스트

로컬 PC에서 먼저 클라우드 연동을 테스트하고 싶다면:
1. 프로젝트 폴더의 `.env.example` 파일을 복사하여 `.env` 파일을 생성합니다.
2. 다음과 같이 실제 키를 입력합니다:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```
3. `npm run dev` 실행 후 웹 브라우저를 2개 띄워놓고(예: 크롬 일반 창 & 시크릿 창), 한쪽에서 인천/미국 재고를 수정해보세요. 다른 창에서 즉시 숫자가 바뀌는 것을 확인하실 수 있습니다!

---

## 📋 일일 업무 운영 시나리오

1. **오전 한국 시간 (인천 영업/생산팀)**:
   - 웹 접속 -> 상단 `[열람모드]` -> PIN `1001` 입력.
   - `[데이터]` 메뉴 클릭 -> 인천 거점 탭에서 검사 대기 및 합격 로트 수량 갱신.
   - 해상/항공 차수 신규 발송분 추가 등록 -> `[저장]`.
   - ➡️ 미국 법인 화면에 즉시 롱비치 및 코코모 예상 도착 정보가 업데이트됨.

2. **오전 미국 현지 시간 (미주법인 물류/생산팀)**:
   - 웹 접속 -> 상단 `[열람모드]` -> PIN `2002` 입력.
   - `[데이터]` 메뉴 클릭 -> 미주법인 탭에서 당일 Multi/Cap/Back 재고 입력.
   - SPE 고객사 탭에서 고객사 라인 잔여 재고 및 일일 소진율 입력 -> `[저장]`.
   - ➡️ 한국 본사 및 경영진 모니터링 화면에 즉시 위험 일수(D-day) 및 재고 그래프가 갱신됨.

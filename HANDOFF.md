# jaeung.me — 작업 인수인계 문서 (START HERE)

> **이 문서 하나만 읽으면 이어서 작업할 수 있도록** 현재 상태·구조·남은 일을 정리했습니다.
> 최초 계획/의사결정 히스토리는 [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md) 참고 (일부 섹션은 리팩토링 전 기준이라 **현재 상태는 이 문서가 우선**).
> 최종 갱신: 2026-07-18

---

## 1. TL;DR — 지금 어디까지 왔나

**이 레포는** Jiwon Choi의 개인 블로그(`jiwnchoi.me`)를 **Jaeung Lee의 사이트(`jaeung.me`)로 리브랜딩** 중인 프로젝트입니다.
Next.js 16 + Nextra 4 기반이고 Vercel에 배포됩니다.

| 단계                                                     | 상태                                    |
| -------------------------------------------------------- | --------------------------------------- |
| Git 연결 (`github.com/gnueaj/jaeung.me`)                 | ✅ 완료                                 |
| **Phase 2 — 리팩토링** (아이덴티티 중앙화 + 빌드 안정화) | ✅ **완료**                             |
| **Phase 3 — Vercel 배포**                                | ✅ 배포 성공 (`*.vercel.app` 동작 확인) |
| Phase 3 — `jaeung.me` 도메인 연결 (Namecheap DNS)        | 🔄 진행/확인 필요 (§7)                  |
| **Phase 1 — 콘텐츠 교체 (Jiwon → Jaeung)**               | ⬜ **다음에 할 일 (가장 중요)**         |

**커밋 히스토리 (origin/main)**

```
1ef0036  fix: import siteConfig in page.tsx metadata (Vercel build fix)   ← HEAD
ad9227a  build: pin pnpm@10.15.1 via packageManager for Vercel
411c293  refactor: centralize site identity + stabilize build (Phase 2)
77aa881  Initial commit: import jiwnchoi.me blog UI as base for jaeung.me  ← 원본 백업
```

> ⚠️ **현재 사이트에 보이는 내용은 아직 Jiwon 님 것입니다.** (이름·자기소개·경력·프로젝트·블로그 글 전부)
> Phase 1이 남은 이유가 이것이며, 도메인 연결 전에 끝내는 걸 권장합니다.

---

## 2. 개발 환경 셋업 ⚠️ (가장 중요 — 안 맞추면 아무것도 안 됨)

이 머신의 **기본 `node`는 v18인데 이 프로젝트는 Node 20+ 필수**입니다. 또 **pnpm 10 필수**입니다
(pnpm 9는 `pnpm-workspace.yaml`의 `ignoredBuiltDependencies` 때문에 `packages field missing or empty` 오류로 실패).

**터미널 열 때마다 아래를 먼저 실행:**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20
export PATH="$HOME/.nvm/versions/node/v20.10.0/bin:$PATH"
corepack prepare pnpm@10.15.1 --activate   # 최초 1회만
node -v   # v20.10.0 이어야 함
pnpm -v   # 10.15.1 이어야 함
```

그 다음:

```bash
pnpm install          # 의존성
pnpm dev              # 개발서버 (datagen + next dev) → http://localhost:3000
pnpm build            # 프로덕션 빌드 (Vercel과 동일) ★푸시 전 필수
pnpm lint             # eslint .
pnpm datagen          # data/*.yml → data/*.ts 재생성
```

> 💡 **푸시 전에 반드시 `pnpm build`를 완주**시키세요. 과거에 코드 수정 후 재빌드를 안 해서
> 타입 오류(`siteConfig` import 누락)가 Vercel에서 터진 적 있습니다.

---

## 3. 아키텍처 — 데이터가 흐르는 방식

이 사이트의 핵심은 **"내용은 YAML/MDX, 화면은 컴포넌트"** 구조입니다.

```
data/*.yml  ──(pnpm datagen: generate-data.js + quicktype)──▶  data/*.ts (생성물, gitignore)
                                                                    │  import { data } from "@/data"
                     ┌──────────────────────────────┬───────────────┴────────────────┐
                     ▼                              ▼                                ▼
        app/layout.tsx (이름/직함/섹션)   content/sections/*.tsx (경력/논문…)   ContactButtons (연락처)
```

- `data/*.ts`는 **빌드 때 자동 생성**되고 `.gitignore` 대상입니다. YAML만 고치면 됩니다.
- `data-accessor.ts`는 **런타임에 `fs`로 YAML을 읽습니다** → **서버 컴포넌트에서만** `data.meta()` 사용 가능.
  (Edge 런타임인 OG 라우트, 클라이언트 컴포넌트인 Giscus에서는 못 씀 → 그래서 `site.config.ts`가 따로 있음)

### 🔑 아이덴티티(이름·URL 등)는 딱 2곳에서 나옵니다 (Phase 2 리팩토링 결과)

| 위치                         | 용도                                       | 쓰는 곳                                                                |
| ---------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| **`data/meta.yml`**          | 이름·직함·소속·연락처·`authorHighlight`    | 서버 렌더링 전부 (사이드바, 카피라이트, 논문 저자 강조, 페이지 타이틀) |
| **`site.config.ts`** (+ env) | siteUrl·OG 이름/태그라인·GA ID·Giscus 설정 | Edge OG 라우트, 클라이언트 Giscus, GA                                  |

→ **리브랜딩 시 이 2개 + 콘텐츠(MDX)만 고치면 됩니다.** 코드에 하드코딩된 개인정보는 **0건**입니다.

---

## 4. 폴더 구조 (현재 기준)

```
jaeung.me/
├── HANDOFF.md                    # ★ 이 문서
├── MIGRATION_PLAN.md             # 최초 계획 + Phase 2 실행 기록(§9)
├── site.config.ts                # ★ env 기반 배포/런타임 설정 (Edge/Client용 아이덴티티)
├── .env.example                  # 환경변수 문서 (Vercel에 넣을 값들)
├── .nvmrc                        # Node 20
│
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 루트 레이아웃: 사이드바(프로필·연락처·내비), 푸터, GA
│   ├── globals.css               # Tailwind/daisyUI 테마 토큰
│   ├── robots.ts                 # robots.txt (sitemap 미설정 — 선택 개선)
│   ├── [[...mdxPath]]/
│   │   ├── page.tsx              # MDX 라우팅 + generateMetadata(타이틀/OG/metadataBase)
│   │   └── not-found.tsx
│   └── api/
│       ├── og/route.tsx          # 동적 OG 이미지 (edge, @vercel/og) — siteConfig 사용
│       └── asset/[[...assetPath]]/route.tsx   # content/ 내 이미지 런타임 서빙 (/api/asset/...)
│
├── components/                   # 사이트 골격 UI
│   ├── Copyright.tsx             # ★ "© {올해} {meta.name}" 동적 렌더
│   ├── ContactButtons.tsx        # meta.contacts → 아이콘 링크 자동 생성
│   ├── Navigation.tsx            # 섹션 내비 + 스크롤 스파이
│   ├── Giscus.tsx                # 댓글 (env 미설정 시 렌더 안 함)
│   ├── Card / Date / MDXContent / Responsive / ScrollToTopButton / TagBadge / ThemeSwitch
│   ├── layout.tsx                # Footer
│   ├── items/                    # FullItem, SimpleItem, PublicationItem(저자 강조)
│   └── index.ts                  # 배럴 export
│
├── content/                      # ★ 실제 페이지 내용 (Nextra contentDirBasePath: /content)
│   ├── index.mdx                 # 홈(About): 자기소개 본문 + 섹션 배치
│   ├── sections/                 # About의 각 섹션 컴포넌트 (data/*.yml 바인딩)
│   │   └── News, Career, Educations, Publications, Services, Honors, Scholarships, Talks, Skills
│   ├── projects/                 # 프로젝트 갤러리
│   │   ├── index.mdx             # Gallery 2개 배치 (type: paper / project)
│   │   ├── Gallery.tsx           # 폴더 스캔 → 카드 목록 (이미지는 /api/asset 경유)
│   │   └── <slug>/index.mdx + <이미지>   # 프로젝트 1개 = 폴더 1개
│   ├── blog/
│   │   ├── index.mdx + page.tsx  # 글 목록 (날짜 정렬)
│   │   ├── components/PostItem.tsx
│   │   └── posts/*.mdx           # 글 1개 = 파일 1개
│   └── ko/                       # ⚠️ 전부 0바이트 빈 파일 (미완성 다국어 — 삭제 권장)
│
├── data/                         # ★ 모든 개인 데이터 (YAML)
│   ├── meta.yml          # 이름/직함/소속/연락처/authorHighlight
│   ├── career.yml  educations.yml  publications.yml  news.yml  skills.yml
│   ├── misc.yml          # honors / services / scholarships / talks
│   ├── authors.yml       # 논문 공저자 이름→링크 매핑
│   ├── sections.yml      # 내비게이션에 뜨는 섹션 정의
│   └── (data-*.ts, index.ts = 생성물, gitignore)
│
├── public/                       # 정적 파일
│   ├── profilepic.png (917KB)    # ⚠️ 현재 Jiwon 사진 — 교체 대상
│   ├── jaeung.jpg (2.0MB)        # ★ 준비된 Jaeung 사진 (용량 큼 → 압축 후 사용)
│   ├── favicon*.png/.ico, apple-touch-icon, android-chrome-*  # 교체 대상
│   ├── site.webmanifest          # 이름 하드코딩 — 교체 대상
│   └── giscus_light.css / giscus_dark.css
│
├── utils/                        # date/image 헬퍼
├── mdx-components.tsx            # MDX 태그 매핑 (글 하단 Giscus 삽입 등)
├── generate-data.js              # YAML→TS 코드 생성기 (watch 지원)
├── next.config.ts                # Nextra 래핑, 이미지 캐시, asset 라우트 트레이싱
└── package.json                  # engines.node>=20, packageManager pnpm@10.15.1
```

---

## 5. 🎯 다음 작업 — Phase 1: 콘텐츠 교체 (Jiwon → Jaeung)

> **사용자(재웅님)가 실제 이력을 직접 제공하기로 확정**되어 있습니다. 데이터 받고 아래를 채우면 됩니다.
> 사이트 성격 = **학술 + 개발 혼합** (원본 구조 유지, Publications/Talks 등 학술 섹션 유지 결정됨).

### 5-1. `data/*.yml` (여기만 고쳐도 대부분 반영됨)

| 파일                     | 할 일                                                                                                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `meta.yml`               | `name`, `position`, `affiliation` → Jaeung. `contacts`: email `dlwodnd00@gmail.com`, github `gnueaj`, **linkedin `jaeunglee`** (URL 자동 조합됨). 없는 채널(scholar/twitter/instagram)은 **키 자체를 삭제**. `authorHighlight` → 논문에 표기되는 이름 그대로 (예: `Jaeung Lee`) |
| `career.yml`             | 경력 전면 교체 (현재 Match Group/NAVER/SKKU = Jiwon 것)                                                                                                                                                                                                                         |
| `educations.yml`         | 학력 교체                                                                                                                                                                                                                                                                       |
| `publications.yml`       | 본인 논문만 (**Bavisitter는 실제 공저자**라 유지 가능). `authors` 배열의 이름은 `authors.yml`과 정확히 일치해야 링크됨                                                                                                                                                          |
| `authors.yml`            | 남길 논문의 공저자 링크만. Jaeung 링크는 `https://www.linkedin.com/in/jaeunglee/` 로 갱신                                                                                                                                                                                       |
| `misc.yml`               | honors/services/scholarships/talks 교체 또는 비우기                                                                                                                                                                                                                             |
| `news.yml`, `skills.yml` | 교체                                                                                                                                                                                                                                                                            |
| `sections.yml`           | 비우는 섹션이 생기면 여기서 해당 항목 제거 (내비에서 사라짐)                                                                                                                                                                                                                    |

### 5-2. 콘텐츠(MDX)

- **`content/index.mdx`** — frontmatter `title` + 자기소개 본문 교체. 안 쓰는 섹션 컴포넌트(`<Publications/>` 등)는 여기서도 제거.
- **`content/projects/<slug>/`** — Jiwon 프로젝트 폴더 10개 삭제 → 본인 것으로. 폴더 1개 = `index.mdx`(frontmatter: `title`, `shortTitle`, `description`, `type: paper|project`, `selected`, `tags`, `date`) + 이미지 1장. 이미지는 MDX에서 `![alt](./파일명.png)` 상대경로.
- **`content/blog/posts/*.mdx`** — Jiwon 글 2개 삭제 → 본인 글. frontmatter: `title`, `date`, `description`, `tags`, `type: post`.
- **`content/ko/`** — 전부 빈 파일. **삭제 권장**.

### 5-3. 정적 에셋 (`public/`)

- `jaeung.jpg`(2MB)를 **압축·정사각 리사이즈(예: 512×512)** 후 **`profilepic.png`를 덮어쓰기**
  (파일명 유지가 편함 — `app/layout.tsx`와 `app/api/og/route.tsx` 두 곳이 `/profilepic.png`를 참조)
- favicon 세트 재생성 ([realfavicongenerator.net](https://realfavicongenerator.net) 등)
- `site.webmanifest`의 `name`/`short_name` 교체

### 5-4. 마무리

- `site.config.ts` 기본값 또는 Vercel 환경변수를 Jaeung 값으로 (§6)
- `pnpm build` 통과 확인 → 커밋 → 푸시 → Vercel 자동 배포

---

## 6. 배포 정보 (Vercel)

- **연결 방식**: Vercel ↔ GitHub 자동 연동. `main`에 push → 자동 프로덕션 배포, PR → 프리뷰 배포.
- **빌드**: `pnpm build` (내부적으로 `datagen` → `next build` → `pagefind` postbuild). 별도 설정 불필요.
- **Node/pnpm**: `engines.node ">=20"` + `packageManager pnpm@10.15.1`로 자동 결정됨.

### 환경변수 (Vercel → Settings → Environment Variables)

미설정 시 `site.config.ts` 기본값 사용. 전체 목록은 `.env.example` 참고.

| Key                        | 값                              | 비고                             |
| -------------------------- | ------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_SITE_URL`     | `https://jaeung.me`             | OG/Giscus 절대경로               |
| `NEXT_PUBLIC_SITE_NAME`    | `Jaeung Lee`                    | OG 이미지 이름                   |
| `NEXT_PUBLIC_SITE_TAGLINE` | 직함                            | OG 부제                          |
| `NEXT_PUBLIC_GA_ID`        | `G-XXXX…`                       | **미설정 시 GA 비활성** (의도됨) |
| `NEXT_PUBLIC_GISCUS_*`     | repo/repoId/category/categoryId | **4개 다 있어야 댓글 활성**      |

> GA·Giscus는 원래 Jiwon의 속성/저장소를 가리켰기 때문에 **의도적으로 기본 비활성**으로 바꿨습니다.
> 쓰려면 본인 계정으로 새로 만들어 env에 넣으세요 (Giscus 설정값은 https://giscus.app 에서 발급).

---

## 7. 도메인 연결 (`jaeung.me` @ Namecheap)

**DNS 값의 출처 = Vercel**: Project → Settings → Domains → `jaeung.me` 추가하면 **입력할 레코드를 화면에 표시**해줍니다. 아래는 일반값이니 **실제로는 Vercel 화면 값**을 쓰세요.

**Namecheap 절차**: Domain List → `jaeung.me` **Manage** → **Advanced DNS** 탭

1. ⚠️ 기본 파킹 레코드 **먼저 삭제** (`CNAME www → parkingpage.namecheap.com`, `URL Redirect`, 파킹 `A` 레코드) — 안 지우면 충돌
2. ADD NEW RECORD로 추가:

| Type         | Host  | Value                  | TTL       |
| ------------ | ----- | ---------------------- | --------- |
| A Record     | `@`   | `76.76.21.21`          | Automatic |
| CNAME Record | `www` | `cname.vercel-dns.com` | Automatic |

3. 저장(초록 ✓) → 전파 수분~30분 → Vercel에 "Valid Configuration" → **SSL 자동 발급**

> Nameserver를 Vercel로 바꾸는 방식도 있으나, 이메일 등 다른 DNS까지 넘어가므로 위 A+CNAME 방식이 안전합니다.

---

## 8. 알려진 이슈 & 함정 (Gotchas)

### 이미 고친 것 (원본 레포에 있던 버그 — 되돌리지 말 것)

1. **`generate-data.js`의 chokidar** — chokidar@5는 ESM 전용이라 `require()` 불가. **watch 모드에서만 동적 `import()`** 하도록 수정됨. 이거 깨지면 `datagen`→`build` 전체가 실패.
2. **`pnpm lint`** — Next 16이 `next lint`를 제거해서 스크립트를 `eslint .`로 교체함.
3. **ESLint 버전** — `eslint@10`은 `eslint-config-next@16`과 비호환(크래시). **`eslint@9` 유지 필수**. 함부로 올리지 말 것.
4. **pnpm 버전** — `packageManager: pnpm@10.15.1` 고정. pnpm 9로 내리면 install 실패.

### 빌드 로그의 무해한 경고 (고칠 필요 없음)

- `Turbopack ... Encountered unexpected file in NFT list` (asset 라우트가 fs를 쓰기 때문) → 경고일 뿐
- `engines: ">=20" will automatically upgrade` → Node 새 메이저 자동 적용 안내

### 주의

- **푸시 전 `pnpm build` 완주 필수** (타입 오류는 lint로 안 잡힘)
- 커밋 시 husky + lint-staged가 prettier/eslint를 자동 적용 → 파일이 자동 포맷될 수 있음(정상)
- `data/*.ts`, `node_modules`, `.next`, `public/_pagefind`는 gitignore 대상

---

## 9. 선택 개선 항목 (여유 될 때)

- `content/ko/` 빈 파일 삭제 (영어 단일 운영)
- `public/profilepic.png`·`jaeung.jpg` 용량 최적화 (WebP 고려)
- `app/sitemap.ts` 추가 + `app/robots.ts`에 sitemap 연결 (SEO)
- GitHub Actions CI (`lint`+`build` 자동 검증) — 현재 없음. Vercel이 빌드 검증을 해주므로 **필수는 아님**
- `content/index.mdx`의 섹션 나열을 `data/sections.yml` 기반으로 자동화

---

## 10. 자주 쓰는 명령어 요약

```bash
# 0) 환경 (터미널마다!)
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20
export PATH="$HOME/.nvm/versions/node/v20.10.0/bin:$PATH"

# 1) 개발
pnpm install && pnpm dev            # http://localhost:3000

# 2) 검증 (푸시 전 필수)
pnpm build && pnpm lint

# 3) 배포 (push하면 Vercel 자동 배포)
git add -A && git commit -m "..." && git push origin main
```

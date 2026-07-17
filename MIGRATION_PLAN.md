# jaeung.me 마이그레이션 & 리팩토링 계획

> 원본: [`jiwnchoi/jiwnchoi`](https://jiwnchoi.me) 개인 블로그 (Jiwon Choi)
> 목표: 이 UI/구조를 재사용하여 **Jaeung Lee**의 개인 사이트로 리브랜딩 → **jaeung.me** 배포 + 배포 파이프라인 구축
> 원격 저장소: https://github.com/gnueaj/jaeung.me.git (연결 완료)
> 작성일: 2026-07-17

---

## 0. 진행 현황 (Status)

| 작업 | 상태 |
| --- | --- |
| `:Zone.Identifier` (WSL 잡파일 107개) 제거 | ✅ 완료 |
| `git init` + `main` 브랜치 + `origin` 원격 연결 | ✅ 완료 |
| 원격 저장소 접근 확인 (`git ls-remote`) | ✅ 완료 (원격에 `Initial commit`/README.md만 존재) |
| **첫 푸시 (원본 백업, 강제 푸시)** | ⏳ 진행 예정 |
| Phase 1: 콘텐츠 교체 | ⬜ 예정 |
| Phase 2: 리팩토링 | ⬜ 예정 |
| Phase 3: 배포 파이프라인 | ⬜ 예정 |

---

## 1. 기술 스택 개요

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | **Next.js 16** (App Router, Turbopack) |
| 문서/블로그 엔진 | **Nextra 4** + `nextra-theme-blog`, MDX + LaTeX(KaTeX) |
| UI | **TailwindCSS 4** + `@tailwindcss/typography` + **daisyUI 5**, `next-themes`(라이트/다크) |
| 아이콘 | `@hugeicons/react`, `react-icons`, `react-devicons` |
| 런타임 | React 19, TypeScript 6, **pnpm** (workspace) |
| 데이터 계층 | **YAML → 코드 생성** (`generate-data.js` → `data/data-accessor.ts`) |
| 검색 | **Pagefind** (postbuild 인덱싱) |
| 댓글 | **Giscus** (GitHub Discussions) |
| 분석/배포 | **Vercel** (`@vercel/analytics`, `speed-insights`, `@vercel/og`), Google Analytics |
| 코드 품질 | ESLint 10, Prettier(+tailwind plugin), Husky + lint-staged, Dependabot |

> ⚠️ **런타임 주의**: 현재 개발 머신 Node `v18.17.1`. Next.js 16 은 **Node ≥ 20** (권장 20/22) 필요 → 로컬 빌드 및 Vercel 설정 모두에서 Node 버전 상향 필요 (§6-G, §6 배포).

---

## 2. 코드 구조 (Directory Map)

```
jaeung.me/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # ★ 루트 레이아웃(사이드바/프로필/카피라이트/GA) — 하드코딩 다수
│   ├── globals.css               # 전역 스타일 (Tailwind/daisyUI 테마 토큰)
│   ├── robots.ts                 # robots.txt (sitemap 주석 처리됨)
│   ├── [[...mdxPath]]/
│   │   ├── page.tsx              # ★ MDX 라우팅 + generateMetadata(OG/타이틀) — 하드코딩
│   │   └── not-found.tsx
│   └── api/
│       ├── og/route.tsx          # ★ 동적 OG 이미지(edge) — 이름/태그라인 하드코딩
│       └── asset/[[...assetPath]]/route.tsx   # content 내 이미지 서빙
├── components/                   # 재사용 UI (사이트 골격)
│   ├── layout.tsx (Footer)  Navigation  ContactButtons  ThemeSwitch
│   ├── Card  Date  Responsive  ScrollToTopButton  TagBadge
│   ├── Giscus.tsx                # ★ 댓글 — repo/repoId/categoryId/CSS URL 하드코딩
│   ├── MDXContent.tsx            # 문자열 MDX 렌더러
│   ├── items/                    # FullItem / SimpleItem / PublicationItem
│   │   └── PublicationItem.tsx   # ★ "Jiwon Choi" 저자 강조 하드코딩
│   └── index.ts
├── content/                      # 실제 페이지 콘텐츠 (contentDirBasePath: /content)
│   ├── index.mdx                 # ★ 홈(About) — 소개문 + 섹션 배치 (이름/이력 하드코딩)
│   ├── sections/                 # About 페이지 섹션 컴포넌트(데이터 바인딩)
│   │   └── News/Career/Educations/Publications/Services/Honors/Scholarships/Talks/Skills
│   ├── projects/                 # 프로젝트 갤러리 (index.mdx + Gallery.tsx + 폴더별 mdx/png)
│   │   └── bavisitter, bobai, cloz, datalab, intentable, milk, ... (Jiwon의 연구/프로젝트)
│   ├── blog/                     # 블로그 (index.mdx + page.tsx + posts/*.mdx)
│   │   └── posts/                # Jiwon의 게시글 2개 (교체 대상)
│   └── ko/                       # ★ 한국어 라우트 — 대부분 비어있음/미완성 (정리 필요)
├── data/                         # ★★ 사이트의 모든 개인 데이터 (YAML)
│   ├── meta.yml                  # 이름/직함/소속/연락처(contacts)
│   ├── authors.yml               # 논문 저자 링크
│   ├── career.yml  educations.yml  publications.yml  news.yml  skills.yml
│   ├── misc.yml                  # honors/services/scholarships/talks
│   ├── sections.yml              # 내비게이션 섹션 정의 (About/Career/.../Blog)
│   └── data-accessor.ts          # (생성물, .gitignore) ← generate-data.js 산출
├── public/                       # ★ 프로필/파비콘/매니페스트 (교체 대상)
│   ├── profilepic.png (938KB, 최적화 필요)  favicon*  android-chrome*  apple-touch-icon
│   ├── site.webmanifest          # 이름 하드코딩
│   └── giscus_light.css / giscus_dark.css
├── utils/                        # date/image 헬퍼
├── mdx-components.tsx            # MDX 컴포넌트 매핑 (블로그 글에 <Giscus/> 삽입)
├── generate-data.js             # YAML→TS 코드 생성기 (quicktype + js-yaml + chokidar watch)
├── next.config.ts  tsconfig.json  eslint.config.mjs  postcss.config.mjs
├── package.json                  # ★ name: "jiwnchoi"
└── .github/dependabot.yml        # (CI 워크플로우 없음 — 신규 추가 필요)
```

### 데이터 흐름 (핵심 아키텍처)
```
data/*.yml  ──(pnpm datagen: generate-data.js)──▶  data/data-accessor.ts  (import { data } from "@/data")
                                                          │
                     ┌────────────────────────────────────┼─────────────────────────────┐
                     ▼                                     ▼                              ▼
        app/layout.tsx (meta/sections)      content/sections/*.tsx (career/pubs...)   ContactButtons (contacts)
```
- `pnpm dev`/`build`/`start` 모두 `pnpm datagen`을 선행 실행 → **YAML만 바꾸면 대부분의 텍스트가 반영됨**.
- `data/*.ts` 는 `.gitignore` 처리됨 (빌드 시 재생성).

---

## 3. Phase 1 — 콘텐츠 교체 (Jiwon → Jaeung)

> 원칙: **가능한 모든 개인정보는 `data/*.yml` 한 곳에서** 바꾼다. YAML로 못 덮는 하드코딩은 §4 목록에서 소스 수정.

### 3-1. YAML 데이터 (대부분 여기서 해결)
| 파일 | 바꿀 내용 |
| --- | --- |
| `data/meta.yml` | `name`, `position`, `affiliation`, `contacts`(email/github/linkedin/twitter/scholar/instagram) → Jaeung 값. **linkedin: `jaeunglee`** (ContactButtons가 `https://www.linkedin.com/in/{linkedin}` 로 조합). 불필요한 채널(scholar/twitter/instagram 등)은 키 삭제 |
| `data/sections.yml` | Jaeung 프로필에 맞게 노출 섹션 취사선택 (예: 학술 이력이 적으면 Publications/Scholarships/Talks 제거 또는 유지) |
| `data/career.yml` | Jaeung 경력으로 전면 교체 (현재는 Match Group/NAVER/SKKU = Jiwon 이력) |
| `data/educations.yml` | Jaeung 학력으로 교체 |
| `data/publications.yml` | Jaeung 논문만 남김 (Bavisitter 공저자 등 실제 이력 기준). 없으면 섹션 제거 |
| `data/misc.yml` | honors/services/scholarships/talks 교체 또는 비우기 |
| `data/news.yml` | Jaeung 소식으로 교체 |
| `data/skills.yml` | Jaeung 스킬로 교체 |
| `data/authors.yml` | 남길 논문의 공저자 링크만. Jaeung LinkedIn을 `https://www.linkedin.com/in/jaeunglee/` 로 갱신 |

### 3-2. 홈/콘텐츠 (MDX)
| 파일 | 작업 |
| --- | --- |
| `content/index.mdx` | frontmatter `title`, 자기소개 본문(“Jason Choi (최지원)…”) 을 Jaeung 소개로 교체. 노출할 섹션(`<News/>`, `<Career/>` …) 취사선택 |
| `content/projects/**` | Jiwon 프로젝트 폴더 전부 교체/삭제. 각 폴더 = `index.mdx`(frontmatter: title/type=`paper|project`/thumbnail) + 이미지. Jaeung 프로젝트로 재구성 |
| `content/projects/index.mdx` | Gallery `contentTypes` 유지 (paper/project 분류) |
| `content/blog/posts/*.mdx` | Jiwon 글 2개 삭제 → Jaeung 글로 교체 (frontmatter: `title/date/description/tags/type: post`) |
| `content/ko/**` | 다국어 유지 여부 결정 (§7). 유지 안 하면 폴더 삭제 |

### 3-3. 정적 에셋 (`public/`)
- `profilepic.png` → Jaeung 프로필 사진 (교체 + 최적화, 아래 §6-H)
- `favicon.ico`, `favicon-16/32`, `apple-touch-icon`, `android-chrome-192/512` → 재생성
- `site.webmanifest` → `name`/`short_name` 교체
- `giscus_light.css`/`giscus_dark.css` → 그대로 사용 가능 (Giscus 설정만 §4에서 교체)

---

## 4. 하드코딩된 개인정보 위치 (소스 수정 필요 핫스팟)

> `grep -rniE 'jiwnchoi|jiwon|jason|G-XVX4B96FPG'` 결과 정리. **Phase 2에서 이들을 `data`/env로 중앙화하는 것이 리팩토링의 핵심.**

| # | 파일:라인 | 하드코딩 내용 | 즉시 교체 | 근본 개선(Phase 2) |
| --- | --- | --- | --- | --- |
| 1 | `app/layout.tsx:69,86` | `Copyright © 2025 Jiwon Jason Choi` (2곳) | 이름/연도 | `meta.name` + `new Date().getFullYear()` 사용하는 `<Copyright/>` 컴포넌트 |
| 2 | `app/layout.tsx:94` | GA `gaId="G-XVX4B96FPG"` | 새 GA ID 또는 제거 | `process.env.NEXT_PUBLIC_GA_ID` |
| 3 | `app/[[...mdxPath]]/page.tsx:35` | 기본 title `"Jiwon Jason Choi"` | 이름 | `data.meta().name` |
| 4 | `app/api/og/route.tsx:38,71,72` | OG 기본 title/이름/태그라인 | 이름/태그라인 | `data.meta()` 참조 |
| 5 | `components/Giscus.tsx:11,12,15,20` | `repo`, `repoId`, `category`, `categoryId`, CSS URL(`jiwnchoi.me`) | Jaeung Giscus 설정 | env 변수화 + `siteUrl` |
| 6 | `components/items/PublicationItem.tsx:20` | 저자 `=== "Jiwon Choi"` 시 강조 | `"Jaeung Lee"` | `meta.name`/`authorHighlight` 필드 비교 |
| 7 | `public/site.webmanifest:2,3` | `name`/`short_name` | 이름 | (선택) 빌드시 생성 |
| 8 | `package.json:2` | `"name": "jiwnchoi"` | `"jaeung-me"` | — |
| 9 | `README.md` | Jiwon 소개 | Jaeung 소개 | — |
| 10 | `content/index.mdx:2,20,22` | title/소개문/지도교수 | Jaeung 내용 | (콘텐츠) |

---

## 5. Phase 2 — 리팩토링 항목

> **주제: “설정/아이덴티티의 단일 출처(single source of truth)화”.** 현재 `process.env` 사용이 0건이고, 이름·URL·분석 ID·댓글 설정이 여러 파일에 흩어져 있음. 이후 이 사이트를 또 다른 사람이 포크하거나 값이 바뀔 때 한 곳만 고치면 되도록 정리.

### R1. 사이트 아이덴티티 중앙화 (최우선)
- `data/meta.yml` 에 필드 추가: `siteUrl`(https://jaeung.me), `tagline`, `copyrightName`, (선택) `authorHighlight`.
- §4의 하드코딩(1,3,4,6,7) 을 전부 `data.meta()` 참조로 치환.
- `Copyright © {year} {name}` 을 렌더링하는 단일 `<Copyright/>` 컴포넌트로 추출 (연도는 자동).

### R2. 환경변수 도입
- `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GISCUS_*`(repo/repoId/category/categoryId), `NEXT_PUBLIC_SITE_URL` 등.
- `.env.example` 제공. GA/Giscus 미설정 시 렌더링 스킵(옵셔널) 처리 → 초기엔 비활성 가능.

### R3. Giscus 설정 분리 & 동작화
- 하드코딩된 `jiwnchoi/jiwnchoi` repo/ID → Jaeung의 GitHub Discussions 로 교체(또는 env). 미사용 시 `mdx-components.tsx:186` 에서 조건부 렌더.

### R4. About 섹션 구성의 데이터 주도화 (선택, 중간 난이도)
- 현재 `content/index.mdx` 가 섹션을 하드코딩 나열. `data/sections.yml` 이 이미 존재하므로, index.mdx 를 `sections.yml` 기반으로 렌더하도록 정리하면 섹션 on/off 가 YAML 한 줄로 가능. (과할 경우 index.mdx 직접 편집으로 대체)

### R5. 다국어(i18n) 정리
- `content/ko/**` 가 대부분 빈 파일/미완성 (`ko/index.mdx` empty, `ko/blog|projects/index.mdx` empty).
- **결정 필요**: (a) 한국어 완성 유지, (b) 전면 삭제(영어 단일). 삭제가 유지보수에 유리 (권장).

### R6. 코드 정리(클린업)
- `components/ContactButtons.tsx:51` 오타 `(valye: string)` → `(value: string)`.
- `app/layout.tsx:62` 주석 처리된 `<Search/>` 및 미사용 import 정리 (검색은 Pagefind로 별도 존재).
- `robots.ts` 의 `sitemap` 활성화 + `app/sitemap.ts` 추가(선택, SEO).
- Dependabot `all-dependencies` 단일 그룹 → major 업데이트 소음 주의(선택 조정).

### R7. 빌드/런타임 안정화
- Node 버전 고정: `package.json` `engines.node: ">=20"`, `.nvmrc`(20 또는 22), Vercel Project Node 20/22.
- `README.md` 재작성(개발/배포 방법 포함).

### R8. 에셋 최적화
- `profilepic.png` 938KB → 리사이즈/압축(WebP 고려). 파비콘 세트 재생성.

---

## 6. Phase 3 — 배포 파이프라인 (jaeung.me)

### 권장 아키텍처: **Vercel Git 연동 + GitHub Actions CI**
이유: 코드가 이미 Vercel 종속(`@vercel/og` edge, analytics, speed-insights, next-on-vercel). 별도 서버/S3 불필요.

#### A. Vercel 배포 (CD)
1. Vercel에서 `gnueaj/jaeung.me` GitHub 저장소 Import.
2. Framework: Next.js (자동). Build: `pnpm build` (내부에서 `datagen`+`next build`+`pagefind` postbuild 자동).
3. **Node.js Version: 20.x (또는 22.x)** 로 설정 (§R7).
4. `main` push → Production 배포, PR → Preview 배포 자동.
5. 필요 env 등록: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GISCUS_*` 등(§R2).

#### B. 도메인 연결 (jaeung.me — 구매 완료)
- Vercel Project → Domains → `jaeung.me` + `www.jaeung.me` 추가.
- 도메인 등록업체 DNS: `A @ 76.76.21.21` + `CNAME www cname.vercel-dns.com` (Vercel 안내값 사용). 또는 네임서버 위임.
- `NEXT_PUBLIC_SITE_URL=https://jaeung.me` 반영 (OG/Giscus/robots).

#### C. GitHub Actions CI (품질 게이트)
- 신규 `.github/workflows/ci.yml`: PR/Push 시 `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm build`(타입/빌드 검증). Node 20 matrix.
- (선택) `.github/workflows` 에 배포는 Vercel 연동에 맡기고 Actions는 CI만 담당(토큰 불필요, 가장 단순).

> 대안(B안): Vercel Git 연동 대신 Actions에서 `vercel deploy --prebuilt` 로 직접 배포 → `VERCEL_TOKEN/ORG_ID/PROJECT_ID` secret 필요. 제어권↑, 복잡도↑. **A안 권장.**

#### D. 배포 전 체크리스트
- [ ] `pnpm install && pnpm build` 로컬 성공 (Node 20)
- [ ] Giscus/GA 미설정 시에도 빌드/렌더 정상 (옵셔널 처리 확인)
- [ ] OG 이미지(`/api/og`) 정상 생성
- [ ] Pagefind 검색 인덱스 생성 (`postbuild`)
- [ ] favicon/manifest/OG 이름 전부 Jaeung 반영

---

## 7. 결정 사항 (User Decisions) — 확정됨

1. **첫 푸시 전략** — ✅ **강제 푸시(`--force`)로 원격 기본 README 덮어쓰기**. (원본 상태를 초기 커밋으로 백업)
2. **사이트 성격** — ✅ **학술+개발 혼합 (원본 구조 최대한 유지)**. → 학술 섹션(Publications/Talks/Scholarships/Honors/Services) **유지**.
3. **콘텐츠 소스** — ✅ **사용자가 실제 이력(경력/학력/프로젝트)을 직접 제공**. 그전까지 구조는 유지하고 이름/식별자만 Jaeung으로 치환, 상세 내용은 사용자 입력 대기.
4. **다국어(ko)** — ⏳ 미정 (원본 유지 방침상 일단 보존, 미완성 파일은 추후 정리).
5. **댓글(Giscus)** — ⏳ 미정 (Jaeung GitHub 저장소 연결 필요 시 활성화).
6. **분석(Analytics)** — ⏳ 미정 (새 GA 속성 vs Vercel Analytics만 vs 제거).

---

## 8. 실행 순서 (제안)

```
Step 0 ─ [완료] git 연결 · 잡파일 정리 · 본 계획 수립
Step 1 ─ 첫 커밋 & 푸시 (§7-1 전략 확정 후)                     → 원본 백업 확보
Step 2 ─ Phase 2 R1/R2/R7 선행 (아이덴티티 중앙화·env·Node 고정) → 이후 콘텐츠 교체가 쉬워짐
Step 3 ─ Phase 1 콘텐츠 교체 (data/*.yml → content → public 에셋)
Step 4 ─ Phase 2 나머지 (R3~R6, R8 정리)
Step 5 ─ 로컬 빌드 검증 (Node 20)
Step 6 ─ Phase 3 배포 (Vercel import → CI 워크플로우 → 도메인 jaeung.me 연결)
Step 7 ─ 최종 점검 (OG/검색/파비콘/댓글/분석)
```

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "katex/dist/katex.min.css";
import { Noto_Sans_KR, Open_Sans } from "next/font/google";
import "./globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";
import { ThemeProvider } from "next-themes";
import Image from "next/image";
import "nextra-theme-blog/style.css";

import { AttributionFooter, Navigation, ScrollToTopButton } from "@/components";
import ContactButtons from "@/components/ContactButtons";
import ThemeSwitch from "@/components/ThemeSwitch";
import { data } from "@/data";
import { siteConfig } from "@/site.config";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-open-sans",
});

// Open Sans has no Hangul, so Korean text would otherwise fall back to whatever
// gothic the OS ships. Listed after Open Sans in the stack, this only ever picks
// up the glyphs Open Sans is missing.
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-kr",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sections = data.sections().sections;
  const meta = data.meta();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${openSans.variable} ${notoSansKr.variable} font-sans`}>
      <body className="flex h-fit max-w-7xl flex-col gap-4 p-0 md:flex-row md:px-8 md:py-4">
        <ThemeProvider
          attribute={["data-theme", "class"]}
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange>
          <div className="min-h-2xs max-h-2xs hidden max-w-2xs min-w-2xs md:block" />
          <aside className="sticky top-[-160px] z-3 -mb-4 flex w-full flex-col gap-2 md:fixed md:top-4 md:h-[calc(100vh-2rem)] md:max-w-2xs md:min-w-2xs md:gap-2">
            <section className="me-card after-bottom-0 after-right-0 after-h-20 relative top-0 z-10 w-full flex-row items-center gap-8 p-4 md:flex-col md:gap-3 md:p-7 md:pb-5">
              <Image
                src={"/profilepic.jpg"}
                alt="Profile Picture"
                className="mx-auto h-[150px] w-[120px] rounded-2xl object-cover md:aspect-[4/5] md:h-auto md:w-[86%]"
                width={1000}
                height={1250}
                priority
              />
              <div className="flex w-full flex-col overflow-hidden overflow-x-hidden md:items-center">
                <p className="mb-2 truncate text-lg font-semibold">{meta.name}</p>
                <p className="mb-1 text-xs text-zinc-500 md:text-center dark:text-zinc-400">
                  {meta.position}
                </p>
                <p className="text-xs text-zinc-500 md:text-center dark:text-zinc-400">
                  {meta.affiliation}
                </p>
                <ContactButtons className={"mt-3 flex w-full gap-2 md:justify-center"} />
              </div>
            </section>
            <div className="me-nav-header">
              <section
                className="me-card sticky top-0 w-full flex-col p-2 md:block md:p-4"
                style={{ zIndex: 1000 }}>
                <div className="flex min-w-0 items-center gap-1 md:block">
                  <div className="min-w-0 flex-1">
                    <Navigation sections={sections} />
                  </div>
                  <ThemeSwitch
                    size={18}
                    homeOnly
                    className="btn btn-ghost me-violet-hover flex h-9 min-h-0 w-9 shrink-0 items-center justify-center rounded-lg p-0 md:hidden"
                  />
                </div>
              </section>
            </div>
          </aside>
          <main className="relative w-full grow md:-mr-4">
            <ThemeSwitch
              size={18}
              homeOnly
              className="btn btn-ghost me-violet-hover absolute top-3 right-3 z-20 hidden h-9 min-h-0 w-9 items-center justify-center rounded-lg p-0 md:flex"
            />
            <article
              className="me-prose me-card drawer-content w-full flex-col"
              dir="ltr"
              data-pagefind-body>
              {children}
            </article>
            <AttributionFooter />
          </main>
        </ThemeProvider>
        <ScrollToTopButton />
      </body>
      {siteConfig.gaId && <GoogleAnalytics gaId={siteConfig.gaId} />}
      <Analytics />
      <SpeedInsights />
    </html>
  );
}

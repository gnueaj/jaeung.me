import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "katex/dist/katex.min.css";
import { Open_Sans } from "next/font/google";
import "./globals.css";

import { Footer } from "@/components/layout";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ThemeProvider } from "next-themes";
import Image from "next/image";
import "nextra-theme-blog/style.css";

import { Navigation, Responsive, ScrollToTopButton } from "@/components";
import ContactButtons from "@/components/ContactButtons";
import { data } from "@/data";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-open-sans",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sections = data.sections().sections;
  const meta = data.meta();
  return (
    <html lang="en" suppressHydrationWarning className={openSans.className}>
      <body className="flex h-fit max-w-7xl flex-col gap-4 p-0 md:flex-row md:px-8 md:py-8">
        <ThemeProvider
          attribute={["data-theme", "class"]}
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          <div className="min-h-2xs max-h-2xs hidden max-w-2xs min-w-2xs md:block" />
          <aside className="sticky top-[-160px] z-3 -mb-4 flex w-full flex-col gap-2 md:fixed md:top-8 md:h-screen md:max-w-2xs md:min-w-2xs md:gap-4">
            <section className="me-card after-bottom-0 after-right-0 after-h-20 relative top-0 z-10 w-full flex-row items-center gap-8 p-4 md:flex-col md:gap-4 md:p-8">
              <Image
                src={"/profilepic.png"}
                alt="Profile Picture"
                className="mx-auto h-[108px] w-[108px] rounded-2xl md:h-[150px] md:w-[150px]"
                width={150}
                height={150}
              />
              <div className="flex w-full flex-col overflow-hidden overflow-x-hidden md:items-center">
                <p className="mb-2 truncate text-lg font-semibold">{meta.name}</p>
                <p className="mb-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {meta.position}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {meta.affiliation}
                </p>
                <ContactButtons className={"mt-4 flex w-full gap-2 md:justify-center"} />
              </div>
            </section>
            <div className="me-nav-header">
              <section
                className="me-card sticky top-0 w-full flex-col p-2 md:block md:p-4"
                style={{ zIndex: 1000 }}>
                <Navigation sections={sections} />
                {/* <Search /> */}
              </section>
            </div>
            <Responsive
              base={null}
              md={
                <Footer className="flex w-full flex-col-reverse items-center justify-start gap-2 text-zinc-500 dark:text-zinc-400">
                  Copyright © 2025 Jiwon Jason Choi
                </Footer>
              }
            />
          </aside>
          <main className="w-full grow md:-mr-4">
            <article
              className="me-prose me-card drawer-content w-full flex-col p-16"
              dir="ltr"
              data-pagefind-body>
              {children}
            </article>
          </main>

          <Responsive
            base={
              <Footer className="w-full p-4 text-zinc-500 dark:text-zinc-400">
                Copyright © 2025 Jiwon Jason Choi
              </Footer>
            }
            md={null}
          />
        </ThemeProvider>
        <ScrollToTopButton />
      </body>
      <GoogleAnalytics gaId="G-XVX4B96FPG" />
      <Analytics />
      <SpeedInsights />
    </html>
  );
}

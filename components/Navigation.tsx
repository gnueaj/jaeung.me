"use client";
import { type Section } from "@/data";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Responsive from "./Responsive";

// Anything here means the visitor grabbed the scroll back from us.
const USER_TAKEOVER_EVENTS = ["wheel", "touchstart", "keydown"] as const;

// Page tabs whose route still holds the original template author's content.
// They render and animate exactly like a normal tab, but must not navigate yet.
// Empty this set once /projects holds Jaeung's own work.
const LOCKED_PAGE_KEYS = new Set(["projects"]);

// The tab that pulses once the visitor reaches the bottom of the home page.
const CTA_PAGE_KEY = "guestbook";

function useSectionRefs(sections: Section[]) {
  const sectionRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    sectionRefs.current = sections
      .filter((s) => s.type === "main")
      .map((s) => document.getElementById(s.key))
      .filter((el): el is HTMLElement => !!el);
  }, [sections]);

  return sectionRefs;
}

export default function Navigation({ sections }: { sections: Section[] }) {
  const sectionRefs = useSectionRefs(sections);
  const router = useRouter();
  const pathname = usePathname();
  const [hash, setHash] = useState<string>("");
  const [isAtPageBottom, setIsAtPageBottom] = useState(false);
  const navigationListRef = useRef<HTMLUListElement>(null);

  const activated = useMemo(() => {
    if (pathname === "/") {
      return hash || "about";
    } else {
      return pathname.split("/")[1];
    }
  }, [pathname, hash]);

  const isProgrammaticScroll = useRef(false);
  const programmaticScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll-spy: use heading positions instead of observing the small heading
  // elements inside a narrow IntersectionObserver band.
  useEffect(() => {
    if (pathname !== "/") return;

    let animationFrame: number | null = null;
    const updateActiveSection = () => {
      animationFrame = null;
      // Guard on "is there anything to scroll" — otherwise a page shorter than
      // the viewport counts as "at the bottom" the instant it loads, and the
      // Project Gallery CTA fires with the visitor never having scrolled.
      const doc = document.documentElement;
      const isScrollable = doc.scrollHeight > window.innerHeight + 8;
      const reachedBottom =
        isScrollable && window.innerHeight + window.scrollY >= doc.scrollHeight - 80;
      setIsAtPageBottom((current) => (current === reachedBottom ? current : reachedBottom));

      if (isProgrammaticScroll.current) return;

      const isMd = window.matchMedia("(min-width: 768px)").matches;
      const activationOffset = isMd ? 80 : 140;
      let nextSection = "about";

      for (const section of sectionRefs.current) {
        if (section.getBoundingClientRect().top <= activationOffset) {
          nextSection = section.id;
        } else {
          break;
        }
      }

      setHash((current) => (current === nextSection ? current : nextSection));
    };

    const scheduleUpdate = () => {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(updateActiveSection);
      }
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, [pathname, sectionRefs]);

  useEffect(() => {
    if (!isAtPageBottom || pathname !== "/") return;

    const list = navigationListRef.current;
    if (!list) return;

    // Only the mobile nav scrolls sideways. Bail on desktop: the sidebar is
    // position:fixed, so scrollIntoView() there scrolls the *window* to reveal
    // the link — which drags the page off the bottom, flips isAtPageBottom back
    // to false, kills the pulse, and jitters as the visitor scrolls down again.
    if (list.scrollWidth <= list.clientWidth) return;

    const link = Array.from(list.querySelectorAll<HTMLElement>('[data-nav-cta="true"]')).find(
      (el) => el.offsetParent !== null,
    );
    if (!link) return;

    // Centre it by moving the list's own scroll offset, never the page.
    const left = link.offsetLeft + link.offsetWidth / 2 - list.clientWidth / 2;
    list.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [isAtPageBottom, pathname]);

  // A fixed timeout was wrong in both directions: it unlocked mid-flight on long
  // jumps (so the highlight snapped back), and it kept ignoring the visitor for
  // the rest of the window on short ones. Unlock when the smooth scroll actually
  // settles, or the moment the visitor scrolls themselves.
  const releaseProgrammaticScroll = useCallback(() => {
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current);
      programmaticScrollTimeoutRef.current = null;
    }

    const finish = () => {
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
        programmaticScrollTimeoutRef.current = null;
      }
      window.removeEventListener("scrollend", finish);
      USER_TAKEOVER_EVENTS.forEach((event) => window.removeEventListener(event, finish));

      isProgrammaticScroll.current = false;
      window.dispatchEvent(new Event("scroll"));
    };

    window.addEventListener("scrollend", finish);
    USER_TAKEOVER_EVENTS.forEach((event) =>
      window.addEventListener(event, finish, { passive: true }),
    );
    // Safety net for browsers without `scrollend`.
    programmaticScrollTimeoutRef.current = setTimeout(finish, 1200);
  }, []);

  const handleMainSectionClick = (sectionKey: string) => {
    if (programmaticScrollTimeoutRef.current) clearTimeout(programmaticScrollTimeoutRef.current);
    isProgrammaticScroll.current = true;

    setHash(sectionKey);
    if (pathname !== "/" && sectionKey === "about") {
      router.push("/", { scroll: false });
    }
    if (pathname !== "/" && sectionKey !== "about") {
      router.push(`/#${sectionKey}`, { scroll: true });
    }

    if (pathname === "/" && sectionKey === "about") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      router.replace("/", { scroll: false });
      releaseProgrammaticScroll();
      return;
    } else {
      const element = document.getElementById(sectionKey);
      if (element) {
        const isMd = window.matchMedia("(min-width: 768px)").matches;
        window.scrollTo({
          top: element.offsetTop - (isMd ? 20 : 100),
          behavior: "smooth",
        });
        router.replace(`/#${sectionKey}`, { scroll: false });
      }
    }

    releaseProgrammaticScroll();
  };

  return (
    <nav aria-label="Main navigation" className="not-prose flex w-full md:flex-col">
      <ul
        ref={navigationListRef}
        className="menu flex w-full flex-row flex-nowrap justify-between gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] md:flex-col [&::-webkit-scrollbar]:hidden">
        {sections
          .filter((s) => s.type === "main")
          .map((section) => (
            <li key={section.key} className="menu-item flex-shrink-0">
              <Responsive
                component={Link}
                base={section.shortTitle}
                href={section.key === "about" ? "/" : `/#${section.key}`}
                md={section.title}
                onClick={(e) => {
                  e.preventDefault();
                  handleMainSectionClick(section.key);
                }}
                target="_self"
                aria-current={activated === section.key ? "page" : undefined}
                className={clsx(
                  "w-[64px] rounded-lg text-center text-xs md:w-full md:text-start md:text-base",
                  activated === section.key ? "me-highlight font-bold" : "",
                )}
              />
            </li>
          ))}
        {/* <li className="menu-item flex-shrink-0">
          <button
            className="me-highlight block w-[64px] rounded-lg text-center text-xs font-bold md:hidden md:w-full md:text-start md:text-base"
            base="About"
            md="About">
            About
          </button>
          <button
            className="me-highlight hidden w-[64px] rounded-lg text-center text-xs font-bold md:block md:w-full md:text-start md:text-base"
            base="About"
            md="About">
            About
          </button>
        </li> */}
        {sections.some((s) => s.type === "page") && (
          <div className="divider divider-horizontal md:divider-vertical divider-primary mx-1 flex-shrink-0 md:my-1" />
        )}
        {sections
          .filter((s) => s.type === "page")
          .map((section) => {
            const isLocked = LOCKED_PAGE_KEYS.has(section.key);

            return (
              <li key={section.key} className="menu-item flex-shrink-0">
                <Responsive
                  component={Link}
                  onClick={(e) => {
                    e.preventDefault();
                    if (isLocked) return;
                    router.push(`/${section.key}`, { scroll: true });
                  }}
                  href={isLocked ? "#" : `/${section.key}`}
                  target="_self"
                  base={section.shortTitle}
                  md={section.title}
                  prefetch={!isLocked}
                  aria-disabled={isLocked || undefined}
                  data-nav-cta={section.key === CTA_PAGE_KEY ? "true" : undefined}
                  aria-current={activated === section.key ? "page" : undefined}
                  className={clsx(
                    "w-[64px] rounded-lg text-center text-xs md:w-full md:text-start md:text-base",
                    activated === section.key ? "me-highlight font-bold" : "",
                    pathname === "/" && isAtPageBottom && section.key === CTA_PAGE_KEY
                      ? "me-nav-cta"
                      : "",
                  )}
                />
              </li>
            );
          })}
      </ul>
    </nav>
  );
}

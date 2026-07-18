"use client";
import { type Section } from "@/data";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Responsive from "./Responsive";

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

  const releaseProgrammaticScroll = useCallback(() => {
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current);
    }

    programmaticScrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
      window.dispatchEvent(new Event("scroll"));
    }, 800);
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
      <ul className="menu flex w-full flex-row flex-nowrap justify-between gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] md:flex-col [&::-webkit-scrollbar]:hidden">
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
        <div className="divider divider-horizontal md:divider-vertical divider-primary mx-1 flex-shrink-0 md:my-1" />
        {sections
          .filter((s) => s.type === "page")
          .map((section) => (
            <li key={section.key} className="menu-item flex-shrink-0">
              <Responsive
                component={Link}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/${section.key}`, { scroll: true });
                }}
                href={`/${section.key}`}
                target="_self"
                base={section.shortTitle}
                md={section.title}
                prefetch={true}
                aria-current={activated === section.key ? "page" : undefined}
                className={clsx(
                  "w-[64px] rounded-lg text-center text-xs md:w-full md:text-start md:text-base",
                  activated === section.key ? "me-highlight font-bold" : "",
                )}
              />
            </li>
          ))}
      </ul>
    </nav>
  );
}

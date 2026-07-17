"use client";
import { type Section } from "@/data";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Responsive from "./Responsive";

function useVisibleSections(sections: Section[]) {
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.filter((s) => s.type === "main").map((s) => [s.key, false])),
  );
  const sectionRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    sectionRefs.current = sections
      .filter((s) => s.type === "main")
      .map((s) => document.getElementById(s.key))
      .filter((el): el is HTMLElement => !!el);
    if (!sectionRefs.current.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleSections((prev) => {
          const newVisible = { ...prev };
          let changed = false;
          entries.forEach((entry) => {
            const sectionKey = entry.target.id;
            if (
              prev.hasOwnProperty(sectionKey) &&
              newVisible[sectionKey] !== entry.isIntersecting
            ) {
              newVisible[sectionKey] = entry.isIntersecting;
              changed = true;
            }
          });
          return changed ? newVisible : prev;
        });
      },
      { threshold: 0.1, root: null, rootMargin: "-160px 0px -50% 0px" },
    );

    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => {
      sectionRefs.current.forEach((el) => el && observer.unobserve(el));
      observer.disconnect();
    };
  }, [sections]);
  return { visibleSections, sectionRefs: sectionRefs };
}

export default function Navigation({ sections }: { sections: Section[] }) {
  const { visibleSections, sectionRefs } = useVisibleSections(sections);
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

  // // Go Top
  // useEffect(() => {
  //   const hash = window.location.hash;
  //   if (hash) return;

  //   const isMd = window.matchMedia("(min-width: 768px)").matches;
  //   window.scrollTo({
  //     top: pathname === "/" ? 0 : isMd ? 0 : 160,
  //     behavior: "instant",
  //   });
  // }, [pathname]);

  // Scroll Change Effect
  useEffect(() => {
    if (isProgrammaticScroll.current) return;
    const firstVisibleKey = sectionRefs.current.find((el) => el && visibleSections[el.id])?.id;
    if (firstVisibleKey && activated !== firstVisibleKey) {
      setHash(firstVisibleKey);
    }
  }, [visibleSections, sections, activated, sectionRefs]);

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
      return;
    } else {
      console.log("sectionKey", sectionKey);
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

    programmaticScrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 500);
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
        <div className="divider divider-horizontal md:divider-vertical divider-primary mx-1 flex-shrink-0" />
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

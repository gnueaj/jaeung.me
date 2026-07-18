"use client";

import { ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="bg-primary text-primary-content fixed right-2 bottom-4 z-50 h-12 w-12 items-center justify-center rounded-full opacity-70 transition-all duration-300 hover:bg-violet-700 md:right-8 md:bottom-8 dark:hover:bg-violet-300"
          aria-label="Scroll to top">
          <HugeiconsIcon icon={ArrowUp01Icon} size={24} className="m-auto" />
        </button>
      )}
    </>
  );
}

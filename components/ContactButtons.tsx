import { data } from "@/data";
import {
  Github01Icon,
  InstagramIcon,
  Linkedin01Icon,
  Mail01Icon,
  Mortarboard01Icon,
  TwitterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

async function ContactButton({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: IconSvgElement;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-square btn-ghost btn-xs font-color me-hover border-0 hover:bg-transparent"
      aria-label={label}>
      <HugeiconsIcon icon={Icon} size={18} />
    </a>
  );
}

const ICON_MAP: Record<string, IconSvgElement> = {
  github: Github01Icon,
  twitter: TwitterIcon,
  linkedin: Linkedin01Icon,
  email: Mail01Icon,
  scholar: Mortarboard01Icon,
  instagram: InstagramIcon,
};

const LABEL_MAP: Record<string, string> = {
  github: "GitHub profile",
  twitter: "Twitter profile",
  linkedin: "LinkedIn profile",
  email: "Send an email",
  scholar: "Google Scholar profile",
  instagram: "Instagram profile",
};

const HREF_MAP: Record<string, (valye: string) => string> = {
  github: (username: string) => `https://github.com/${username}`,
  twitter: (username: string) => `https://x.com/${username}`,
  linkedin: (username: string) => `https://www.linkedin.com/in/${username}`,
  email: (email: string) => `mailto:${email}`,
  website: (href: string) => href,
  scholar: (username: string) => `https://scholar.google.com/citations?user=${username}`,
  instagram: (username: string) => `https://www.instagram.com/${username}`,
};

export default async function ContactButtons(props: React.HTMLProps<HTMLDivElement>) {
  const contacts = data.meta().contacts ?? {};
  return (
    <div {...props}>
      {Object.entries(contacts).map(([key, value]) => {
        const Icon = ICON_MAP[key];
        if (Icon) {
          return (
            <ContactButton
              key={key}
              href={HREF_MAP[key](value)}
              Icon={Icon}
              label={LABEL_MAP[key] || key}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

import { Link } from "react-router-dom";
import { JinderLogo } from "@/components/JinderLogo";

const footerLinks = {
  product: [
    { label: "Jobs", href: "/jobs" },
    { label: "Resume", href: "/resume" },
    { label: "Pricing", href: "/pricing" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-accent/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <JinderLogo size="md" className="mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered career platform for the modern job seeker.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4 text-sm capitalize font-sans">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-8">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Jinder. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

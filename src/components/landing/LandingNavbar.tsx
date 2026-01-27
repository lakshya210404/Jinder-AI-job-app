import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { JinderLogo } from "@/components/JinderLogo";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Jobs", href: "/jobs" },
  { label: "Resume", href: "/resume" },
  { label: "Pricing", href: "/pricing" },
];

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <JinderLogo size="sm" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-8 px-3 rounded-lg">
              <Link to="/auth">Log in</Link>
            </Button>
            <Button size="sm" asChild className="h-8 px-3 rounded-lg">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden absolute top-14 left-0 right-0 bg-background border-b border-border transition-all duration-200 overflow-hidden",
          mobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="flex flex-col p-3 gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="py-2.5 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-border my-2" />
          <div className="flex gap-2 p-1">
            <Button variant="ghost" size="sm" asChild className="flex-1 rounded-lg">
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            </Button>
            <Button size="sm" asChild className="flex-1 rounded-lg">
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Get started</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}

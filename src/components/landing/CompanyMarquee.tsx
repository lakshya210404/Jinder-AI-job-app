import { cn } from "@/lib/utils";

const companies = [
  { name: "Google", logo: "https://logo.clearbit.com/google.com" },
  { name: "Apple", logo: "https://logo.clearbit.com/apple.com" },
  { name: "Microsoft", logo: "https://logo.clearbit.com/microsoft.com" },
  { name: "Amazon", logo: "https://logo.clearbit.com/amazon.com" },
  { name: "Meta", logo: "https://logo.clearbit.com/meta.com" },
  { name: "Netflix", logo: "https://logo.clearbit.com/netflix.com" },
  { name: "Spotify", logo: "https://logo.clearbit.com/spotify.com" },
  { name: "Airbnb", logo: "https://logo.clearbit.com/airbnb.com" },
  { name: "Stripe", logo: "https://logo.clearbit.com/stripe.com" },
  { name: "Notion", logo: "https://logo.clearbit.com/notion.so" },
  { name: "Figma", logo: "https://logo.clearbit.com/figma.com" },
  { name: "Slack", logo: "https://logo.clearbit.com/slack.com" },
  { name: "GitHub", logo: "https://logo.clearbit.com/github.com" },
  { name: "Vercel", logo: "https://logo.clearbit.com/vercel.com" },
  { name: "OpenAI", logo: "https://logo.clearbit.com/openai.com" },
  { name: "Coinbase", logo: "https://logo.clearbit.com/coinbase.com" },
];

function LogoItem({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex items-center justify-center px-8 py-4 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
      <img
        src={logo}
        alt={`${name} logo`}
        className="h-8 w-auto object-contain"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}

export function CompanyMarquee() {
  return (
    <section className="py-12 bg-secondary/30 border-y border-border overflow-hidden">
      <div className="text-center mb-8">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Users hired at top companies
        </p>
      </div>

      {/* Marquee container */}
      <div className="relative">
        {/* Gradient overlays for smooth edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-secondary/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-secondary/30 to-transparent z-10 pointer-events-none" />

        {/* First row - left to right */}
        <div className="flex animate-marquee mb-4">
          {[...companies, ...companies].map((company, index) => (
            <LogoItem key={`row1-${index}`} {...company} />
          ))}
        </div>

        {/* Second row - right to left */}
        <div className="flex animate-marquee-reverse">
          {[...companies.slice().reverse(), ...companies.slice().reverse()].map((company, index) => (
            <LogoItem key={`row2-${index}`} {...company} />
          ))}
        </div>
      </div>
    </section>
  );
}

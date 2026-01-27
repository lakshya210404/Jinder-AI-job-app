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
    <div className="flex items-center justify-center px-10 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
      <img
        src={logo}
        alt={`${name} logo`}
        className="h-6 w-auto object-contain"
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
    <section className="py-16 overflow-hidden">
      <div className="text-center mb-10">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Users hired at
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="flex animate-marquee">
          {[...companies, ...companies].map((company, index) => (
            <LogoItem key={`row1-${index}`} {...company} />
          ))}
        </div>
      </div>
    </section>
  );
}

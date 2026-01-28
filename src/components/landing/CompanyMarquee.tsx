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

const secondRow = [
  { name: "Tesla", logo: "https://logo.clearbit.com/tesla.com" },
  { name: "Uber", logo: "https://logo.clearbit.com/uber.com" },
  { name: "Lyft", logo: "https://logo.clearbit.com/lyft.com" },
  { name: "Dropbox", logo: "https://logo.clearbit.com/dropbox.com" },
  { name: "Shopify", logo: "https://logo.clearbit.com/shopify.com" },
  { name: "Square", logo: "https://logo.clearbit.com/squareup.com" },
  { name: "Twilio", logo: "https://logo.clearbit.com/twilio.com" },
  { name: "Datadog", logo: "https://logo.clearbit.com/datadog.com" },
  { name: "Atlassian", logo: "https://logo.clearbit.com/atlassian.com" },
  { name: "Adobe", logo: "https://logo.clearbit.com/adobe.com" },
  { name: "Salesforce", logo: "https://logo.clearbit.com/salesforce.com" },
  { name: "Oracle", logo: "https://logo.clearbit.com/oracle.com" },
  { name: "IBM", logo: "https://logo.clearbit.com/ibm.com" },
  { name: "Intel", logo: "https://logo.clearbit.com/intel.com" },
  { name: "Nvidia", logo: "https://logo.clearbit.com/nvidia.com" },
  { name: "AMD", logo: "https://logo.clearbit.com/amd.com" },
];

function LogoItem({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-center px-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
      <img
        src={logo}
        alt={`${name} logo`}
        className="h-7 w-auto object-contain"
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
    <section className="py-20 overflow-hidden bg-secondary/20">
      <div className="text-center mb-12">
        <p className="text-sm font-medium text-muted-foreground tracking-wide">
          Users hired at
        </p>
      </div>

      {/* First row - scrolling left */}
      <div className="relative mb-6">
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="flex animate-marquee">
          {[...companies, ...companies, ...companies].map((company, index) => (
            <LogoItem key={`row1-${index}`} {...company} />
          ))}
        </div>
      </div>

      {/* Second row - scrolling right */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="flex animate-marquee-reverse">
          {[...secondRow, ...secondRow, ...secondRow].map((company, index) => (
            <LogoItem key={`row2-${index}`} {...company} />
          ))}
        </div>
      </div>
    </section>
  );
}

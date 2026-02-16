import { ScrollReveal } from "@/components/animations";

const companies = [
  "Google", "Apple", "Microsoft", "Amazon", "Meta", "Netflix", "Spotify",
  "Airbnb", "Stripe", "Notion", "Figma", "Slack", "GitHub", "Vercel", "OpenAI", "Coinbase",
];

const secondRow = [
  "Tesla", "Uber", "Lyft", "Dropbox", "Shopify", "Square", "Twilio",
  "Datadog", "Atlassian", "Adobe", "Salesforce", "Oracle", "IBM", "Intel", "Nvidia", "AMD",
];

function LogoItem({ name }: { name: string }) {
  return (
    <div className="flex-shrink-0 px-6 sm:px-8">
      <span className="text-sm sm:text-base font-medium text-muted-foreground/50 whitespace-nowrap tracking-wide">
        {name}
      </span>
    </div>
  );
}

export function CompanyMarquee() {
  return (
    <section className="py-16 overflow-hidden">
      <ScrollReveal className="text-center mb-10">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em]">
          Users hired at
        </p>
      </ScrollReveal>

      <div className="relative mb-6">
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex animate-marquee">
          {[...companies, ...companies, ...companies].map((name, i) => (
            <LogoItem key={`r1-${i}`} name={name} />
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex animate-marquee-reverse">
          {[...secondRow, ...secondRow, ...secondRow].map((name, i) => (
            <LogoItem key={`r2-${i}`} name={name} />
          ))}
        </div>
      </div>
    </section>
  );
}

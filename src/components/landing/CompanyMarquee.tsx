const companies = [
  { name: "Google", initials: "G", color: "bg-blue-500" },
  { name: "Apple", initials: "A", color: "bg-gray-800" },
  { name: "Microsoft", initials: "M", color: "bg-orange-500" },
  { name: "Amazon", initials: "A", color: "bg-amber-600" },
  { name: "Meta", initials: "M", color: "bg-blue-600" },
  { name: "Netflix", initials: "N", color: "bg-red-600" },
  { name: "Spotify", initials: "S", color: "bg-green-500" },
  { name: "Airbnb", initials: "A", color: "bg-pink-500" },
  { name: "Stripe", initials: "S", color: "bg-violet-600" },
  { name: "Notion", initials: "N", color: "bg-gray-900" },
  { name: "Figma", initials: "F", color: "bg-purple-500" },
  { name: "Slack", initials: "S", color: "bg-emerald-600" },
  { name: "GitHub", initials: "G", color: "bg-gray-900" },
  { name: "Vercel", initials: "V", color: "bg-black" },
  { name: "OpenAI", initials: "O", color: "bg-teal-600" },
  { name: "Coinbase", initials: "C", color: "bg-blue-700" },
];

const secondRow = [
  { name: "Tesla", initials: "T", color: "bg-red-700" },
  { name: "Uber", initials: "U", color: "bg-black" },
  { name: "Lyft", initials: "L", color: "bg-pink-600" },
  { name: "Dropbox", initials: "D", color: "bg-blue-500" },
  { name: "Shopify", initials: "S", color: "bg-green-600" },
  { name: "Square", initials: "S", color: "bg-gray-900" },
  { name: "Twilio", initials: "T", color: "bg-red-500" },
  { name: "Datadog", initials: "D", color: "bg-purple-700" },
  { name: "Atlassian", initials: "A", color: "bg-blue-600" },
  { name: "Adobe", initials: "A", color: "bg-red-600" },
  { name: "Salesforce", initials: "S", color: "bg-sky-500" },
  { name: "Oracle", initials: "O", color: "bg-red-700" },
  { name: "IBM", initials: "I", color: "bg-blue-800" },
  { name: "Intel", initials: "I", color: "bg-blue-600" },
  { name: "Nvidia", initials: "N", color: "bg-green-700" },
  { name: "AMD", initials: "A", color: "bg-red-600" },
];

function LogoItem({ name, initials, color }: { name: string; initials: string; color: string }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-2.5 px-6 opacity-60 hover:opacity-100 transition-all duration-300">
      <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
        <span className="text-white text-sm font-semibold">{initials}</span>
      </div>
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{name}</span>
    </div>
  );
}

export function CompanyMarquee() {
  return (
    <section className="py-20 overflow-hidden">
      <div className="text-center mb-12">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Users hired at
        </p>
      </div>

      {/* First row - scrolling left */}
      <div className="relative mb-8">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="flex animate-marquee">
          {[...companies, ...companies, ...companies].map((company, index) => (
            <LogoItem key={`row1-${index}`} {...company} />
          ))}
        </div>
      </div>

      {/* Second row - scrolling right */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="flex animate-marquee-reverse">
          {[...secondRow, ...secondRow, ...secondRow].map((company, index) => (
            <LogoItem key={`row2-${index}`} {...company} />
          ))}
        </div>
      </div>
    </section>
  );
}

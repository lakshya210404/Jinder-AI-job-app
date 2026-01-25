import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Engineer Intern",
    company: "Google",
    companyLogo: "https://logo.clearbit.com/google.com",
    avatar: "AC",
    avatarColor: "from-purple to-blue",
    quote: "I found jobs here days before they hit LinkedIn. The AI match scores saved me hours of reading descriptions that weren't a fit."
  },
  {
    name: "Sarah Kim",
    role: "Product Manager Intern",
    company: "Stripe",
    companyLogo: "https://logo.clearbit.com/stripe.com",
    avatar: "SK",
    avatarColor: "from-pink to-orange",
    quote: "The resume builder helped me beat ATS systems. I went from 0 callbacks to 5 interviews in two weeks!"
  },
  {
    name: "Jordan Lee",
    role: "Data Analyst",
    company: "Spotify",
    companyLogo: "https://logo.clearbit.com/spotify.com",
    avatar: "JL",
    avatarColor: "from-green to-teal",
    quote: "Contact Finder was a game changer. I cold emailed a recruiter and landed an interview the same week."
  },
  {
    name: "Maya Patel",
    role: "UX Designer",
    company: "Airbnb",
    companyLogo: "https://logo.clearbit.com/airbnb.com",
    avatar: "MP",
    avatarColor: "from-orange to-pink",
    quote: "The interview prep AI asked me questions I actually got asked in my interviews. It felt like cheating!"
  },
  {
    name: "Ryan Torres",
    role: "Full Stack Developer",
    company: "Notion",
    companyLogo: "https://logo.clearbit.com/notion.so",
    avatar: "RT",
    avatarColor: "from-blue to-purple",
    quote: "I was applying everywhere with no luck. Jinder's match scores helped me focus on roles where I actually fit."
  },
  {
    name: "Emma Watson",
    role: "Marketing Intern",
    company: "Netflix",
    companyLogo: "https://logo.clearbit.com/netflix.com",
    avatar: "EW",
    avatarColor: "from-red-500 to-pink",
    quote: "Everything in one place - jobs, contacts, resume builder. I deleted three other apps after signing up."
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 rounded-full px-4 py-1">
            <Quote className="h-3 w-3 mr-1 text-primary" />
            Success stories
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Join thousands of happy job seekers
          </h2>
          <p className="text-lg text-muted-foreground">
            Real people landing real jobs with Jinder
          </p>
        </div>

        {/* Testimonial card */}
        <div className="relative">
          {/* Floating avatars for social proof */}
          <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple to-blue flex items-center justify-center text-white font-bold text-sm opacity-20 blur-[1px]">
            AC
          </div>
          <div className="absolute -bottom-4 -right-4 w-10 h-10 rounded-full bg-gradient-to-br from-pink to-orange flex items-center justify-center text-white font-bold text-xs opacity-20 blur-[1px]">
            SK
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
            {/* Quote icon */}
            <div className="absolute top-6 right-6 opacity-5">
              <Quote className="h-24 w-24" />
            </div>

            {/* Testimonial content */}
            <div className="relative z-10 text-center">
              {/* Avatar */}
              <div className={cn(
                "w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl mx-auto mb-6 shadow-lg",
                testimonials[activeIndex].avatarColor
              )}>
                {testimonials[activeIndex].avatar}
              </div>

              {/* Quote */}
              <blockquote className="text-lg sm:text-xl text-foreground mb-6 leading-relaxed">
                "{testimonials[activeIndex].quote}"
              </blockquote>

              {/* Author info */}
              <div className="flex flex-col items-center gap-2">
                <div className="font-semibold text-foreground">
                  {testimonials[activeIndex].name}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{testimonials[activeIndex].role}</span>
                  <span>•</span>
                  <span>joined</span>
                  <img
                    src={testimonials[activeIndex].companyLogo}
                    alt={testimonials[activeIndex].company}
                    className="h-5 w-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === activeIndex
                    ? "w-8 bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

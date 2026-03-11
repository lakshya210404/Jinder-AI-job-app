import { useState, useEffect, useRef } from "react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "@/components/animations";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Engineer Intern → Google",
    avatar: "AC",
    color: "bg-primary/20 text-primary",
    quote: "I found jobs here days before they hit LinkedIn. The AI match scores saved me hours of reading descriptions that weren't a fit.",
  },
  {
    name: "Sarah Kim",
    role: "Product Manager Intern → Stripe",
    avatar: "SK",
    color: "bg-destructive/15 text-destructive",
    quote: "The resume builder helped me beat ATS systems. I went from 0 callbacks to 5 interviews in two weeks!",
  },
  {
    name: "Jordan Lee",
    role: "Data Analyst → Spotify",
    avatar: "JL",
    color: "bg-success/15 text-success",
    quote: "Contact Finder was a game changer. I cold emailed a recruiter and landed an interview the same week.",
  },
  {
    name: "Maya Patel",
    role: "UX Designer → Airbnb",
    avatar: "MP",
    color: "bg-warning/15 text-warning",
    quote: "The interview prep AI asked me questions I actually got asked in my interviews. It felt like cheating!",
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
  };

  return (
    <section className="py-28 px-4 sm:px-6 bg-accent/30">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-serif mb-4">
            People love using Jinder
          </h2>
          <p className="text-muted-foreground text-lg">
            Real stories from job seekers who found their next opportunity.
          </p>
        </ScrollReveal>

        <div className="organic-card p-8 sm:p-12 relative overflow-hidden">
          <Quote className="absolute top-6 right-6 h-20 w-20 text-border/50" />

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-center"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-semibold mx-auto mb-6",
                  testimonials[activeIndex].color
                )}>
                  {testimonials[activeIndex].avatar}
                </div>

                <blockquote className="text-lg sm:text-xl text-foreground mb-6 leading-relaxed font-serif italic">
                  "{testimonials[activeIndex].quote}"
                </blockquote>

                <div className="font-semibold text-foreground text-sm">
                  {testimonials[activeIndex].name}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {testimonials[activeIndex].role}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === activeIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-border hover:bg-muted-foreground/30"
              )}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

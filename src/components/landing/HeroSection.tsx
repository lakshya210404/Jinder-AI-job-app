import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {/* Main headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.1] mb-6"
        >
          Find your next role,
          <br />
          <span className="text-primary">effortlessly.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-lg text-muted-foreground max-w-xl mx-auto mb-10"
        >
          AI-powered job matching. One-click resume tailoring. 
          Thousands of opportunities from top companies.
        </motion.p>

        {/* CTA buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
        >
          <Button asChild size="lg" className="h-11 px-6 rounded-lg gap-2">
            <Link to="/auth">
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-6 rounded-lg">
            <Link to="/jobs">
              Browse jobs
            </Link>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-center justify-center gap-12 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="text-2xl font-semibold text-foreground">10K+</div>
            <div className="text-sm text-muted-foreground">Active jobs</div>
          </motion.div>
          <div className="w-px h-10 bg-border" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="text-2xl font-semibold text-foreground">50K+</div>
            <div className="text-sm text-muted-foreground">Users</div>
          </motion.div>
          <div className="w-px h-10 bg-border" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="text-2xl font-semibold text-foreground">85%</div>
            <div className="text-sm text-muted-foreground">Match rate</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

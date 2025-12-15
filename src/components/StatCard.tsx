interface StatCardProps {
  value: string;
  label: string;
  delay?: number;
}

export const StatCard = ({ value, label, delay = 0 }: StatCardProps) => {
  return (
    <div 
      className="gradient-border p-4 rounded-xl animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-center">
        <p className="text-xl font-bold gradient-text">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
};

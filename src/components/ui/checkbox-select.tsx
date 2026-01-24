import * as React from "react";
import { ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export type CheckboxSelectOption = { value: string; label: string };

interface CheckboxSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CheckboxSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

const CustomCheckbox = ({ checked }: { checked: boolean }) => (
  <div
    className={cn(
      "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
      checked ? "bg-primary border-primary" : "border-border bg-background"
    )}
  >
    {checked && (
      <svg
        className="h-3 w-3 text-primary-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )}
  </div>
);

export function CheckboxSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  icon,
  className,
}: CheckboxSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[160px] h-10 rounded-xl bg-secondary border-0 justify-between text-left font-normal hover:bg-muted/50",
            !selected && value === "all" && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {icon}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 bg-popover border border-border shadow-lg rounded-lg z-50"
        align="start"
      >
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 bg-background border border-border"
            />
          </div>
        </div>
        <ScrollArea className="h-[220px]">
          <div className="py-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No options found.
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-muted/80 cursor-pointer transition-colors text-left"
                >
                  <CustomCheckbox checked={value === opt.value} />
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

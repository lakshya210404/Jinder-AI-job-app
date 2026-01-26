import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, X, Plus, Ban, Building2, FileText, Type } from "lucide-react";
import { useJobPreferences } from "@/hooks/useJobPreferences";
import { cn } from "@/lib/utils";

export function JobFilterSettings() {
  const { preferences, addExclusion, removeExclusion, loading } = useJobPreferences();
  const [open, setOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<"title" | "desc" | "company">("title");

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    await addExclusion(activeTab, newKeyword.trim());
    setNewKeyword("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const getExclusionList = () => {
    if (!preferences) return [];
    switch (activeTab) {
      case "title":
        return preferences.title_exclude || [];
      case "desc":
        return preferences.desc_exclude || [];
      case "company":
        return preferences.company_exclude || [];
    }
  };

  const totalExclusions =
    (preferences?.title_exclude?.length || 0) +
    (preferences?.desc_exclude?.length || 0) +
    (preferences?.company_exclude?.length || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          <Settings2 className="h-4 w-4" />
          Filter Settings
          {totalExclusions > 0 && (
            <Badge variant="secondary" className="ml-1 rounded-full px-2">
              {totalExclusions}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Smart Job Filters
          </DialogTitle>
          <DialogDescription>
            Automatically hide jobs that contain certain keywords in their title,
            description, or from specific companies.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="title" className="gap-1.5">
              <Type className="h-3.5 w-3.5" />
              Title
              {(preferences?.title_exclude?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {preferences?.title_exclude?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="desc" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Description
              {(preferences?.desc_exclude?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {preferences?.desc_exclude?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Company
              {(preferences?.company_exclude?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {preferences?.company_exclude?.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            {/* Add new keyword input */}
            <div className="flex gap-2">
              <Input
                placeholder={
                  activeTab === "title"
                    ? "e.g., senior, clinical, manager"
                    : activeTab === "desc"
                    ? "e.g., 5+ years, PhD required"
                    : "e.g., Acme Corp, ClickJobs.io"
                }
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <Button onClick={handleAddKeyword} disabled={!newKeyword.trim() || loading}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Current exclusions */}
            <div className="min-h-[100px] rounded-lg border border-dashed p-4">
              {getExclusionList().length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No {activeTab === "company" ? "companies" : "keywords"} blocked yet.
                  <br />
                  Add keywords above to filter out unwanted jobs.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {getExclusionList().map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className={cn(
                        "gap-1.5 pr-1.5",
                        activeTab === "company" && "bg-destructive/10 text-destructive"
                      )}
                    >
                      {keyword}
                      <button
                        onClick={() => removeExclusion(activeTab, keyword)}
                        className="ml-1 rounded-full hover:bg-background/50 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Helper text */}
            <p className="text-xs text-muted-foreground">
              {activeTab === "title" &&
                "Jobs with these words in the title will be hidden from your feed."}
              {activeTab === "desc" &&
                "Jobs mentioning these terms in the description will be hidden."}
              {activeTab === "company" &&
                "All jobs from these companies will be hidden from your feed."}
            </p>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

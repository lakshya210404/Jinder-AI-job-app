import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, X, Plus } from "lucide-react";
import { useJobPreferences } from "@/hooks/useJobPreferences";

export function JobFilterSettings() {
  const { preferences, addExclusion, removeExclusion, loading } = useJobPreferences();
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
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg shrink-0 relative">
          <Settings2 className="h-4 w-4" />
          {totalExclusions > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
              {totalExclusions}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filter Settings</SheetTitle>
          <SheetDescription>
            Automatically hide jobs based on keywords in the title, description, or company name.
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-6">
          <TabsList className="grid w-full grid-cols-3 h-9 rounded-lg bg-secondary p-0.5">
            <TabsTrigger value="title" className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Title
              {(preferences?.title_exclude?.length || 0) > 0 && (
                <span className="ml-1 text-muted-foreground">
                  ({preferences?.title_exclude?.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="desc" className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Description
              {(preferences?.desc_exclude?.length || 0) > 0 && (
                <span className="ml-1 text-muted-foreground">
                  ({preferences?.desc_exclude?.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="company" className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Company
              {(preferences?.company_exclude?.length || 0) > 0 && (
                <span className="ml-1 text-muted-foreground">
                  ({preferences?.company_exclude?.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            {/* Add keyword */}
            <div className="flex gap-2">
              <Input
                placeholder={
                  activeTab === "title"
                    ? "e.g., Senior, Manager"
                    : activeTab === "desc"
                    ? "e.g., 5+ years"
                    : "e.g., Acme Corp"
                }
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="h-9 rounded-lg"
              />
              <Button 
                size="sm" 
                onClick={handleAddKeyword} 
                disabled={!newKeyword.trim() || loading}
                className="h-9 px-3 rounded-lg"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Keywords list */}
            <div className="min-h-[120px] rounded-lg border border-dashed border-border p-3">
              {getExclusionList().length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">
                  No {activeTab === "company" ? "companies" : "keywords"} blocked yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {getExclusionList().map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-secondary rounded-md"
                    >
                      {keyword}
                      <button
                        onClick={() => removeExclusion(activeTab, keyword)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {activeTab === "title" && "Jobs with these words in the title will be hidden."}
              {activeTab === "desc" && "Jobs with these terms in the description will be hidden."}
              {activeTab === "company" && "All jobs from these companies will be hidden."}
            </p>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

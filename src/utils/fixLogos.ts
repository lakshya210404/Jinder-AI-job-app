// Temporary utility to trigger logo resolution
// Run this once to backfill all missing logos
import { supabase } from "@/integrations/supabase/client";

export async function fixAllLogos() {
  console.log("Starting logo resolution for all jobs...");
  
  try {
    const { data, error } = await supabase.functions.invoke("logo-resolver", {
      body: { batch_size: 2000 },
    });

    if (error) {
      console.error("Logo resolution failed:", error);
      return { success: false, error };
    }

    console.log("Logo resolution complete:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Logo resolution error:", err);
    return { success: false, error: err };
  }
}
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

const submitSchema = z.object({
  level: z.number().int().min(1).max(20),
  points: z.number().int().min(0).max(1_000_000),
  timeSeconds: z.number().int().min(0).max(60 * 60 * 24),
});

export const submitScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Try inserting normally first. If a unique-constraint violation occurs
    // (rare for default gen_random_uuid()), retry with an explicit UUID.
    let { error } = await context.supabase.from("scores").insert({
      user_id: context.userId,
      level: data.level,
      points: data.points,
      time_seconds: data.timeSeconds,
    });

    if (error) {
      // Postgres unique violation code
      if ((error as any)?.code === "23505") {
        const id = randomUUID();
        const retry = await context.supabase.from("scores").insert({
          id,
          user_id: context.userId,
          level: data.level,
          points: data.points,
          time_seconds: data.timeSeconds,
        });
        error = retry.error;
      }
    }

    if (error) throw new Error(error.message);
    return { ok: true };
  });

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const getGlobalLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("leaderboard_global")
    .select("user_id, username, total_points, plays, highest_level")
    .order("total_points", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getLevelLeaderboards = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("leaderboard_per_level")
    .select("level, user_id, username, best_points, best_time")
    .order("level", { ascending: true })
    .order("best_points", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

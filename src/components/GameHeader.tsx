import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Puzzle, LogOut, Trophy } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function GameHeader() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user) return;
      const { data: p } = await supabase.from("profiles").select("username").eq("id", data.user.id).maybeSingle();
      if (active) setUsername(p?.username ?? data.user.email ?? null);
    });
    return () => { active = false; };
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <Puzzle className="h-5 w-5 text-primary" />
          <span className="text-gradient">Piecewise</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/play">
            <Button variant="ghost" size="sm">Levels</Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="ghost" size="sm">
              <Trophy className="mr-1 h-4 w-4" /> Leaderboard
            </Button>
          </Link>
          {username && (
            <span className="hidden text-sm text-muted-foreground sm:inline">{username}</span>
          )}
          {username ? (
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          ) : (
            <Link to="/auth"><Button variant="outline" size="sm">Sign in</Button></Link>
          )}
        </nav>
      </div>
    </header>
  );
}

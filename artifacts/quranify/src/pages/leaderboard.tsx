import { useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Award, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Leaderboard() {
  const { user } = useAuth();
  const { data: leaderboardData, isLoading } = useGetLeaderboard({
    query: {
      queryKey: getGetLeaderboardQueryKey()
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const entries = leaderboardData?.entries || [];
  const currentUserRank = leaderboardData?.currentUserRank;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-slate-400" />;
      case 3: return <Medal className="w-6 h-6 text-amber-700" />;
      default: return <span className="font-bold text-muted-foreground w-6 text-center inline-block">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <Award className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Global Leaderboard</h1>
          <p className="text-muted-foreground">Inspire each other in the pursuit of memorization</p>
        </div>
      </div>

      <Card className="border-primary/10 shadow-sm overflow-hidden">
        {currentUserRank && (
          <div className="bg-primary/5 p-4 border-b flex items-center justify-between">
            <span className="font-medium text-foreground">Your current rank</span>
            <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 text-sm font-bold shadow-sm">
              Rank #{currentUserRank}
            </Badge>
          </div>
        )}
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No entries found yet.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-20 text-center">Rank</TableHead>
                  <TableHead>Hafizh</TableHead>
                  <TableHead>Halaqah</TableHead>
                  <TableHead className="text-right">Ayat</TableHead>
                  <TableHead className="text-center w-24">Streak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const isCurrentUser = user?.id === entry.userId;
                  return (
                    <TableRow 
                      key={entry.userId} 
                      className={`${isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : ''} hover:bg-muted/50 transition-colors`}
                    >
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center h-8">
                          {getRankIcon(entry.rank)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {entry.name}
                          {isCurrentUser && <span className="text-xs text-primary font-bold">(You)</span>}
                        </div>
                        {entry.badges && entry.badges.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {entry.badges.slice(0, 3).map((badge, idx) => (
                              <span key={idx} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                {badge}
                              </span>
                            ))}
                            {entry.badges.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">+{entry.badges.length - 3}</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.halaqahName ? (
                          <span className="text-sm px-2 py-1 bg-secondary rounded-md border text-secondary-foreground">
                            {entry.halaqahName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono">
                        {entry.totalAyat.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1 text-orange-500 font-bold bg-orange-500/10 px-2 py-1 rounded-md w-16 mx-auto">
                          <Flame className="w-3 h-3" />
                          {entry.streak}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

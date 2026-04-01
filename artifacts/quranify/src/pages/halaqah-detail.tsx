import { useRoute } from "wouter";
import { 
  useGetHalaqah, 
  useGetHalaqahLeaderboard,
  getGetHalaqahQueryKey,
  getGetHalaqahLeaderboardQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, Trophy, Medal, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HalaqahDetail() {
  const [, params] = useRoute("/halaqah/:id");
  const halaqahId = params?.id ? parseInt(params.id, 10) : 0;

  const { data: halaqah, isLoading: isHalaqahLoading } = useGetHalaqah(halaqahId, {
    query: {
      enabled: !!halaqahId,
      queryKey: getGetHalaqahQueryKey(halaqahId)
    }
  });

  const { data: leaderboardData, isLoading: isLeaderboardLoading } = useGetHalaqahLeaderboard(halaqahId, {
    query: {
      enabled: !!halaqahId,
      queryKey: getGetHalaqahLeaderboardQueryKey(halaqahId)
    }
  });

  const isLoading = isHalaqahLoading || isLeaderboardLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!halaqah) {
    return <div>Halaqah not found</div>;
  }

  const entries = leaderboardData?.entries || [];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-slate-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-700" />;
      default: return <span className="font-bold text-muted-foreground w-5 text-center inline-block">{rank}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <Link href="/halaqah">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground -ml-3">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Halaqahs
          </Button>
        </Link>
        <h1 className="text-3xl font-serif font-bold text-foreground">{halaqah.name}</h1>
        <p className="text-muted-foreground mt-1">Mentored by {halaqah.mentorName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full text-primary">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Members</p>
              <p className="text-3xl font-bold">{halaqah.members?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary border-secondary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-background rounded-full text-secondary-foreground border">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Ayat</p>
              <p className="text-3xl font-bold">{halaqah.totalAyat.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No memorization data recorded in this group yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Ayat</TableHead>
                  <TableHead className="text-center w-24">Streak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.userId} className="hover:bg-muted/50">
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center h-8">
                        {getRankIcon(entry.rank)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{entry.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-1">
                        {entry.badges?.slice(0, 2).map((b, i) => (
                          <span key={i} className="bg-muted px-1.5 py-0.5 rounded">{b}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold font-mono">
                      {entry.totalAyat.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-orange-500 font-bold bg-orange-500/10 px-2 py-1 rounded-md">
                        {entry.streak}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

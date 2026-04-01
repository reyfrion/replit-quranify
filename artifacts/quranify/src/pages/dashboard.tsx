import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Flame, Trophy, Activity, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading, error } = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey(),
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !summary) {
    return <div>Failed to load dashboard</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Assalamu'alaikum, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">May your hifzh journey be blessed today.</p>
        </div>
        <Link href="/tracker">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            Log Memorization
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BookOpen className="w-24 h-24 text-primary" />
          </div>
          <CardHeader>
            <CardTitle className="text-primary font-serif">Today's Ayah</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-2xl font-serif text-right leading-loose tracking-wide text-foreground mb-4">
              "{summary.todayAyah}"
            </p>
            <p className="text-sm font-medium text-primary">
              {summary.todayAyahReference}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif">Motivation</CardTitle>
          </CardHeader>
          <CardContent>
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">
              "{summary.motivationalQuote}"
            </blockquote>
            <p className="text-sm font-medium text-foreground">
              — {summary.motivationalQuoteReference}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-foreground">{summary.totalAyat}</p>
            <p className="text-sm text-muted-foreground">Total Ayat</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
              <Flame className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-foreground">{summary.streak}</p>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-xl font-bold text-foreground truncate w-full">
              {summary.lastActivity ? new Date(summary.lastActivity).toLocaleDateString() : 'None'}
            </p>
            <p className="text-sm text-muted-foreground">Last Activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-foreground">{summary.badges?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Badges</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{summary.weeklyProgress} / {summary.weeklyGoal} Ayat</span>
          </div>
          <Progress value={Math.min(100, (summary.weeklyProgress / summary.weeklyGoal) * 100)} className="h-2" />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-serif font-bold">Recent Activity</h2>
        {summary.recentHafalan && summary.recentHafalan.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.recentHafalan.map(hafalan => (
              <Card key={hafalan.id} className="border-l-4 border-l-primary hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{hafalan.surah} ({hafalan.surahNumber})</h3>
                    <p className="text-sm text-muted-foreground">Ayah {hafalan.ayahStart} - {hafalan.ayahEnd}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {hafalan.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(hafalan.date).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No recent memorization logged. Start today!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

import { useGetAnalytics, getGetAnalyticsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CalendarDays, TrendingUp } from "lucide-react";

export default function Analytics() {
  const { data: analytics, isLoading } = useGetAnalytics({
    query: {
      queryKey: getGetAnalyticsQueryKey()
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!analytics) return <div>Failed to load analytics</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your consistency and growth over time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col justify-center items-center text-center">
            <TrendingUp className="w-8 h-8 text-primary mb-3" />
            <p className="text-3xl font-bold text-foreground">{analytics.totalThisWeek}</p>
            <p className="text-sm font-medium text-primary mt-1">Ayat This Week</p>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary/50">
          <CardContent className="p-6 flex flex-col justify-center items-center text-center">
            <CalendarDays className="w-8 h-8 text-foreground/70 mb-3" />
            <p className="text-3xl font-bold text-foreground">{analytics.totalThisMonth}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Ayat This Month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-center items-center text-center">
            <Activity className="w-8 h-8 text-blue-500 mb-3" />
            <p className="text-3xl font-bold text-foreground">{analytics.averagePerDay.toFixed(1)}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Average Ayat / Day</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Memorization over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              {analytics.weekly.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAyat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ayat" 
                      name="Ayat" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorAyat)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                  No data for this week
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>Memorization over the last 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              {analytics.monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="week" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      cursor={{ fill: 'hsl(var(--muted))' }}
                    />
                    <Bar 
                      dataKey="ayat" 
                      name="Ayat" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                  No data for this month
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

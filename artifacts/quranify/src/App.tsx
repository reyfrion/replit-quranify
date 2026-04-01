import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Tracker from "@/pages/tracker";
import Leaderboard from "@/pages/leaderboard";
import HalaqahList from "@/pages/halaqah";
import HalaqahDetail from "@/pages/halaqah-detail";
import Analytics from "@/pages/analytics";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route>
        <ProtectedRoute>
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/tracker" component={Tracker} />
              <Route path="/leaderboard" component={Leaderboard} />
              <Route path="/halaqah" component={HalaqahList} />
              <Route path="/halaqah/:id" component={HalaqahDetail} />
              <Route path="/profile" component={Profile} />
              <Route path="/analytics" component={Analytics} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

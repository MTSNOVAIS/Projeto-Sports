import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import ArticleView from "@/pages/article";
import TeamsList from "@/pages/teams-list";
import TeamPage from "@/pages/team";
import CategoryPage from "@/pages/category";
import SearchPage from "@/pages/search";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminArticlesList from "@/pages/admin/articles-list";
import AdminArticleEditor from "@/pages/admin/article-editor";
import AdminImport from "@/pages/admin/import";
import AdminTeamsList from "@/pages/admin/teams-list";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/noticias/:slug" component={ArticleView} />
      <Route path="/times" component={TeamsList} />
      <Route path="/times/:slug" component={TeamPage} />
      <Route path="/categoria/:category" component={CategoryPage} />
      <Route path="/busca" component={SearchPage} />

      <Route path="/dashboard" component={AdminDashboard} />
      <Route path="/dashboard/artigos" component={AdminArticlesList} />
      <Route path="/dashboard/artigos/novo" component={AdminArticleEditor} />
      <Route path="/dashboard/artigos/:id/editar" component={AdminArticleEditor} />
      <Route path="/dashboard/importar" component={AdminImport} />
      <Route path="/dashboard/times" component={AdminTeamsList} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

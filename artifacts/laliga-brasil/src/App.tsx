import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/home";
import ArticleView from "@/pages/article";
import TeamsList from "@/pages/teams-list";
import TeamPage from "@/pages/team";
import CategoryPage from "@/pages/category";
import SearchPage from "@/pages/search";
import LoginPage from "@/pages/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminArticlesList from "@/pages/admin/articles-list";
import AdminArticleEditor from "@/pages/admin/article-editor";
import AdminImport from "@/pages/admin/import";
import AdminTeamsList from "@/pages/admin/teams-list";
import AdminTeamEditor from "@/pages/admin/team-editor";
import AdminUsersList from "@/pages/admin/users-list";
import AdminRolesList from "@/pages/admin/roles-list";
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
      <Route path="/login" component={LoginPage} />

      <Route path="/dashboard">
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/artigos">
        <ProtectedRoute>
          <AdminArticlesList />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/artigos/new">
        <ProtectedRoute>
          <AdminArticleEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/artigos/:id/editar">
        <ProtectedRoute>
          <AdminArticleEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/importar">
        <ProtectedRoute>
          <AdminImport />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/times">
        <ProtectedRoute>
          <AdminTeamsList />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/times/:id">
        <ProtectedRoute>
          <AdminTeamEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/usuarios">
        <ProtectedRoute>
          <AdminUsersList />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/cargos">
        <ProtectedRoute>
          <AdminRolesList />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

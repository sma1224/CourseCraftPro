import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import CourseGenerator from "@/pages/course-generator";
import OutlineViewer from "@/pages/outline-viewer";
import ContentCreator from "@/pages/content-creator";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/course-generator" component={CourseGenerator} />
          <Route path="/outline-generator" component={CourseGenerator} />
          <Route path="/outline/:id" component={OutlineViewer} />
          <Route path="/content-creator/:outlineId" component={ContentCreator} />
          <Route path="/video-producer" component={NotFound} />
          <Route path="/assessment-builder" component={NotFound} />
          <Route path="/resource-manager" component={NotFound} />
          <Route path="/analytics" component={NotFound} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

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
import VideoProducer from "@/pages/video-producer";
import AssessmentBuilder from "@/pages/assessment-builder";
import ResourceManager from "@/pages/resource-manager";
import Analytics from "@/pages/analytics";

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
          <Route path="/content-creator/:projectId" component={ContentCreator} />
          <Route path="/video-producer/:outlineId" component={VideoProducer} />
          <Route path="/assessment-builder/:projectId" component={AssessmentBuilder} />
          <Route path="/resource-manager/:projectId" component={ResourceManager} />
          <Route path="/analytics/:projectId" component={Analytics} />
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

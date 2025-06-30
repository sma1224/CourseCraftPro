import { useState } from "react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import CourseGeneratorModal from "@/components/course/course-generator-modal";

export default function CourseGenerator() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showModal, setShowModal] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Course Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your course outline with AI assistance
          </p>
        </div>
      </div>

      {showModal && (
        <CourseGeneratorModal 
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            window.history.back();
          }}
        />
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Sparkles, Users, Clock, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-card rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Creation Suite</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI-Powered Course Development</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="course-primary-btn px-6 py-2"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6 dark:bg-blue-900 dark:text-blue-200">
              <Sparkles className="h-4 w-4" />
              <span>Transform weeks of work into hours</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Create Professional 
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> Courses </span>
              with AI
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Course Creation Suite empowers educators, trainers, and instructional designers to build comprehensive course content 
              using advanced AI technology. From initial concept to polished outline in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                className="course-primary-btn px-8 py-4 text-lg"
              >
                Start Creating
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 py-4 text-lg border-gray-300 dark:border-gray-600"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to create amazing courses
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Professional tools powered by AI to streamline your course development workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 gradient-card rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">AI Course Generator</CardTitle>
                <CardDescription>
                  Describe your course idea in natural language and get a comprehensive outline in minutes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Voice Interaction</CardTitle>
                <CardDescription>
                  Use natural voice commands to describe your course and get real-time AI feedback
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Templates</CardTitle>
                <CardDescription>
                  Professional course structures for different industries and learning formats
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Export Anywhere</CardTitle>
                <CardDescription>
                  Export to Google Docs, PDF, Word, or Markdown with professional formatting
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Collaboration</CardTitle>
                <CardDescription>
                  Work with your team in real-time with comments, version control, and sharing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-green-500 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Analytics</CardTitle>
                <CardDescription>
                  Track course performance and student engagement with detailed analytics
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-green-600 border-0 text-white">
            <CardContent className="py-16">
              <h2 className="text-4xl font-bold mb-4">
                Ready to transform your course creation process?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Join thousands of educators who are already creating better courses faster with AI
              </p>
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
              >
                Get Started for Free
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-card rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Course Creation Suite</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              © 2025 Course Creation Suite. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

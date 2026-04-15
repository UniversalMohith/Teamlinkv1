import { ArrowRight, Check, Users, MessageSquare, Zap, Shield, BarChart3, Globe, Layout, Bell, Video, FileText, Calendar, Lock } from 'lucide-react';
import { Button } from './ui/button';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onProjectSelect: (projectId: string) => void;
}

export function LandingPage({ onNavigateToLogin, onProjectSelect }: LandingPageProps) {
  const features = [
    {
      icon: Layout,
      title: 'Kanban Boards',
      description: 'Drag-and-drop task management with customizable columns and real-time updates'
    },
    {
      icon: MessageSquare,
      title: 'Team Chat',
      description: 'Real-time messaging with typing indicators, file sharing, and online/offline status'
    },
    {
      icon: Video,
      title: 'Voice & Video Calls',
      description: 'Built-in calling capabilities across all chat systems for seamless communication'
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Create teams, add members, assign roles, and manage permissions effortlessly'
    },
    {
      icon: Bell,
      title: 'Real-time Notifications',
      description: 'Stay updated with instant notifications for tasks, messages, and team activities'
    },
    {
      icon: FileText,
      title: 'Project Tracking',
      description: 'Monitor project progress, deadlines, and team performance with detailed analytics'
    },
    {
      icon: Calendar,
      title: 'Task Scheduling',
      description: 'Set due dates, assign tasks, and track completion with visual progress indicators'
    },
    {
      icon: Lock,
      title: 'Secure Authentication',
      description: 'Email/password and social login (Google, Facebook) with session persistence'
    },
    {
      icon: Shield,
      title: 'Data Security',
      description: 'Enterprise-grade security with Row Level Security and encrypted data storage'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track active projects, completed tasks, and team productivity metrics'
    },
    {
      icon: Users,
      title: 'Friend Connections',
      description: 'Add friends, build your network, and collaborate with trusted colleagues'
    },
    {
      icon: Globe,
      title: 'Responsive Design',
      description: 'Beautiful interface that works seamlessly on desktop, tablet, and mobile devices'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 3L21 12L3 21V3Z" fill="white"/>
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TeamLink
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#about" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onNavigateToLogin}>
              Sign In
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              onClick={onNavigateToLogin}
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full mb-8">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">100% Free • No Credit Card Required</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
            Collaborate Better,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Achieve More
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            The all-in-one platform for team collaboration, project management, and real-time communication.
            Completely free, forever.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-14 px-8 text-lg"
              onClick={onNavigateToLogin}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              View All Features
            </Button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-500 mt-6">
            No credit card required • Always free • Unlimited users
          </p>
        </div>

        {/* Hero Dashboard Preview */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Dashboard Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3L21 12L3 21V3Z" fill="white"/>
                  </svg>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">TeamLink Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  JD
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Projects</span>
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">12</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-blue-600 rounded-full"></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">75%</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</span>
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">48</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-green-600 rounded-full"></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">50%</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Team Members</span>
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">24</p>
                  <div className="mt-2 flex -space-x-2">
                    {['BG', 'SJ', 'MC', 'ER'].map((initials, i) => (
                      <div key={i} className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800">
                        {initials}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Project Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Website Redesign</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Due in 2 days</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Layout className="w-4 h-4" />
                      <span>8 tasks completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>4 team members</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-blue-600 rounded-full"></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Mobile App Launch</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Due Mar 25</p>
                    </div>
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Layout className="w-4 h-4" />
                      <span>5 tasks completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>6 team members</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="about" className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why teams choose TeamLink
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                A completely free, full-featured project management platform designed for teams of all sizes
              </p>

              <div className="space-y-4">
                {[
                  'Unlimited projects and tasks',
                  'Real-time collaboration & messaging',
                  'Secure data encryption',
                  'No hidden fees or upgrades'
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="mt-8 bg-white text-blue-600 hover:bg-gray-100 h-14 px-8"
                onClick={onNavigateToLogin}
              >
                Get Started Now
              </Button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="space-y-6">
                <div className="bg-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Layout className="w-12 h-12 text-white/60" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Kanban Boards</h4>
                      <p className="text-sm text-blue-100">Visualize your workflow</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <MessageSquare className="w-12 h-12 text-white/60" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Team Chat</h4>
                      <p className="text-sm text-blue-100">Communicate instantly</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Video className="w-12 h-12 text-white/60" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Voice & Video</h4>
                      <p className="text-sm text-blue-100">Connect face-to-face</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Everything you need to
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> succeed</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Powerful features designed to help your team work better together
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to transform your team?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of teams using TeamLink for free. Get started in seconds with all features included.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 h-14 px-10 text-lg"
            onClick={onNavigateToLogin}
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-blue-100 mt-6">
            No credit card required • Always free • Start collaborating today
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Product</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#about" className="hover:text-gray-900 dark:hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Company</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Resources</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Legal</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Licenses</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3L21 12L3 21V3Z" fill="white"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">TeamLink</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2026 TeamLink. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  TrendingUp,
  Users,
  Briefcase,
  MessageSquare,
  Plus,
  ChevronRight,
  Calendar,
  Star,
  AlertTriangle,
  Megaphone,
  GraduationCap,
  FileText,
  Shield
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: blogs, isLoading: blogsLoading } = useQuery({
    queryKey: ["/api/blogs", { limit: 2 }],
    queryFn: async ({ queryKey }) => {
      const [baseUrl, params] = queryKey as [string, any];
      const url = new URL(baseUrl, window.location.origin);
      if (params.limit) url.searchParams.set("limit", params.limit);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const { data: qnaThreads, isLoading: qnaLoading } = useQuery({
    queryKey: ["/api/qna", { limit: 2 }],
    queryFn: async ({ queryKey }) => {
      const [baseUrl, params] = queryKey as [string, any];
      const url = new URL(baseUrl, window.location.origin);
      if (params.limit) url.searchParams.set("limit", params.limit);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const { data: announcements } = useQuery({
    queryKey: ["/api/announcements", { limit: 3 }],
  });

  const { data: opportunities } = useQuery({
    queryKey: ["/api/opportunities", { limit: 3 }],
  });

  const { data: complaints, isLoading: complaintsLoading } = useQuery({
    queryKey: ["/api/complaints", { limit: 2 }],
    queryFn: async ({ queryKey }) => {
      const [baseUrl, params] = queryKey as [string, any];
      const url = new URL(baseUrl, window.location.origin);
      if (params.limit) url.searchParams.set("limit", params.limit);
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(url.toString(), { headers, credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  // Ensure stats and data arrays are always defined
  const safeStats: any = stats || {};
  const safeBlogs = Array.isArray(blogs) ? blogs : [];
  const safeQnaThreads = Array.isArray(qnaThreads) ? qnaThreads : [];
  const safeAnnouncements = Array.isArray(announcements) ? announcements : [];
  const safeOpportunities = Array.isArray(opportunities) ? opportunities : [];

  // Prepare complaints for display: always show the current user's most recent complaint (if any), plus the next most recent (no duplicates)
  let displayComplaints = Array.isArray(complaints) ? [...complaints] : [];
  if (user && displayComplaints.length > 0) {
    const userComplaint = displayComplaints.find(c => c.userId === user.id);
    if (!userComplaint) {
      // If not in the top 2, fetch user's most recent complaint from all complaints (if available)
      // This requires a separate fetch if not present, but for now, assume the backend returns enough for the user to appear if they have a recent complaint
    }
    // Move user's complaint to the top if present
    displayComplaints = [
      ...displayComplaints.filter(c => c.userId === user.id),
      ...displayComplaints.filter(c => c.userId !== user.id)
    ];
    // Remove duplicates by id
    displayComplaints = displayComplaints.filter((c, idx, arr) => arr.findIndex(x => x.id === c.id) === idx);
    // Limit to 2
    displayComplaints = displayComplaints.slice(0, 2);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* <Navigation /> */}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-4xl font-bold mb-4">Welcome to UUConnect</h1>
                <p className="text-xl mb-6 text-blue-100">
                  Your gateway to campus life, connections, and opportunities at Uttaranchal University.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/add-blog">
                    <Button className="bg-white text-primary hover:bg-gray-100">
                      Start Blogging
                    </Button>
                  </Link>
                  <Link href="/opportunities">
                    <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary bg-transparent">
                      Find Opportunities
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:block">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500" 
                  alt="Students collaborating on campus" 
                  className="rounded-xl shadow-lg w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {safeStats.totalBlogs || 0}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">Total Blogs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">{safeStats.totalUsers || 0}</div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">Active Users</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {safeStats.totalOpportunities || 0}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">Opportunities</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {safeStats.totalQuestions || 0}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">Q&A Threads</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Trending Blogs Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Trending Blogs</CardTitle>
                  <div className="flex space-x-2">
                    <Link href="/add-blog">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Post
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {blogsLoading ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400">Loading blogs...</div>
                  </div>
                ) : safeBlogs.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {safeBlogs.map((blog: any) => (
                        <article key={blog.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900 flex flex-col h-full min-w-0">
                          <div className="flex items-start space-x-3 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={blog.author?.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs">
                                {getInitials(blog.author?.fullName || "Unknown")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1 mb-1">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                  {blog.author?.fullName}
                                </h3>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">
                                  {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                                </span>
                                <Badge className="text-xs px-2 py-0.5">{blog.category}</Badge>
                              </div>
                              <Link href={`/blogs/${blog.id}`}>
                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 hover:text-primary cursor-pointer truncate">
                                  {blog.title}
                                </h4>
                              </Link>
                            </div>
                          </div>
                          {blog.image && (
                            <img 
                              src={blog.image} 
                              alt={blog.title}
                              className="rounded-md w-full h-28 object-cover mb-2"
                            />
                          )}
                          <p className="text-gray-600 dark:text-gray-300 text-xs mb-2 line-clamp-2 flex-1">{blog.excerpt}</p>
                          <div className="flex items-center justify-between mt-auto pt-2">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-xs">
                                <Heart className="h-3 w-3" />
                                <span>{blog.likes}</span>
                              </span>
                              <span className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-xs">
                                <MessageCircle className="h-3 w-3" />
                                <span>{blog.commentsCount}</span>
                              </span>
                            </div>
                            <Link href={`/blogs/${blog.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-7">
                                Read More <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className="text-right mt-4">
                      <Link href="/blogs">
                        <Button className="bg-primary text-white hover:bg-primary/90" size="sm">
                          View More
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No blogs yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to share your experience!</p>
                    <Link href="/add-blog">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Write First Blog
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ask Senior Q&A Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Recent Q&A</CardTitle>
                  <Link href="/qna">
                    <Button className="bg-secondary hover:bg-secondary/90">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ask Question
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              
              <CardContent>
                {qnaLoading ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400">Loading questions...</div>
                  </div>
                ) : safeQnaThreads.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {safeQnaThreads.map((thread: any) => (
                        <div key={thread.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900 flex flex-col h-full min-w-0">
                          <div className="flex items-start space-x-3 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={thread.author?.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white text-xs">
                                {getInitials(thread.author?.fullName || "Unknown")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1 mb-1">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                  {thread.author?.fullName}
                                </h3>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">
                                  {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                                </span>
                                {thread.tags && thread.tags.length > 0 && (
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">{thread.tags[0]}</Badge>
                                )}
                              </div>
                              <Link href={`/qna?thread=${thread.id}`}>
                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 hover:text-primary cursor-pointer truncate">
                                  {thread.question}
                                </h4>
                              </Link>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 text-xs mt-auto pt-2">
                            <span className="text-gray-500 dark:text-gray-400">
                              {thread.answersCount} answers
                            </span>
                            <Link href={`/qna?thread=${thread.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-7">
                                View Discussion <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-right mt-4">
                      <Link href="/qna">
                        <Button className="bg-primary text-white hover:bg-primary/90" size="sm">
                          View More
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No questions yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Ask seniors for guidance and share knowledge!</p>
                    <Link href="/qna">
                      <Button className="bg-secondary hover:bg-secondary/90">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ask First Question
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Complaints Section */}
            <Card className="h-full min-h-[400px] flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                    Recent Complaints
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {complaintsLoading ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400">Loading complaints...</div>
                  </div>
                ) : displayComplaints.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
                      {displayComplaints.map((complaint: any) => (
                        <div key={complaint.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900 flex flex-col h-full min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className="text-xs px-2 py-0.5">{complaint.category}</Badge>
                            <Badge className={`text-xs px-2 py-0.5 ${complaint.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : complaint.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>{complaint.status.replace('_', ' ').toUpperCase()}</Badge>
                            {complaint.isAnonymous && (
                              <Badge variant="outline" className="flex items-center gap-1 text-xs"><Shield className="h-3 w-3" />Anonymous</Badge>
                            )}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-xs mb-2 line-clamp-3 flex-1">{complaint.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto pt-2">
                            <span>Submitted {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}</span>
                            {!complaint.isAnonymous && complaint.author && (
                              <span>by {complaint.author.fullName}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-right mt-4">
                      <Link href="/complaints">
                        <Button className="bg-primary text-white hover:bg-primary/90" size="sm">
                          View More
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="h-8 w-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No complaints yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to submit a complaint or suggestion!</p>
                    <Link href="/complaints">
                      <Button className="bg-red-600 hover:bg-red-700 text-white">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Submit Complaint
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/add-blog">
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Write Blog
                    </Button>
                  </Link>
                  <Link href="/complaints">
                    <Button className="w-full bg-red-600 hover:bg-red-700">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Complaints
                    </Button>
                  </Link>
                  <Link href="/opportunities">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Post Opportunity
                    </Button>
                  </Link>
                  <Link href="/skill-share">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Skill
                    </Button>
                  </Link>
                  {/* More Dropdown */}
                  <div className="relative">
                    <details className="group">
                      <summary className="w-full cursor-pointer select-none">
                        <Button className="w-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700" variant="outline">
                          More
                        </Button>
                      </summary>
                      <div className="absolute left-0 w-full mt-2 z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
                        <Link href="/qna">
                          <Button className="w-full justify-start bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" variant="ghost">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Ask Question
                          </Button>
                        </Link>
                      </div>
                    </details>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Announcements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {safeAnnouncements.map((announcement: any) => (
                    <div key={announcement.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                            <Megaphone className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href="/announcements">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 hover:text-primary cursor-pointer">
                              {announcement.title}
                            </h4>
                          </Link>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">
                            {announcement.content.substring(0, 100)}...
                          </p>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center mt-4">
                  <Link href="/announcements">
                    <Button variant="ghost" size="sm">
                      View All Announcements <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="bg-primary text-white text-center rounded-lg p-2 min-w-[3rem]">
                        <div className="text-xs font-medium">MAR</div>
                        <div className="text-lg font-bold">15</div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Tech Symposium 2024</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">10:00 AM - 4:00 PM</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Main Auditorium</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="bg-secondary text-white text-center rounded-lg p-2 min-w-[3rem]">
                        <div className="text-xs font-medium">MAR</div>
                        <div className="text-lg font-bold">18</div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Career Fair</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">9:00 AM - 5:00 PM</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Sports Complex</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="bg-green-600 text-white text-center rounded-lg p-2 min-w-[3rem]">
                        <div className="text-xs font-medium">MAR</div>
                        <div className="text-lg font-bold">22</div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Cultural Night</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">6:00 PM - 10:00 PM</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Open Ground</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <Link href="/calendar">
                    <Button variant="ghost" size="sm">
                      View Calendar <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Popular Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Trending Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Python</Badge>
                  <Badge variant="secondary">Web Design</Badge>
                  <Badge variant="secondary">Photography</Badge>
                  <Badge variant="secondary">Digital Marketing</Badge>
                  <Badge variant="secondary">Data Science</Badge>
                  <Badge variant="secondary">UI/UX Design</Badge>
                </div>
                <div className="text-center mt-4">
                  <Link href="/skill-share">
                    <Button variant="ghost" size="sm">
                      Explore Skill Hub <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Additional Sections Preview */}
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Mental Health Corner Preview */}
          <Card className="bg-gradient-to-br from-pink-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="h-6 w-6" />
                <h3 className="text-lg font-bold">Mental Health Corner</h3>
              </div>
              <p className="text-pink-100 text-sm mb-4">A safe space for sharing experiences and finding support.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">47 posts</span>
                <Link href="/mental-health">
                  <Button variant="ghost" size="sm" className="text-white hover:text-pink-200 p-0">
                    Visit <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Opportunities Preview */}
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <Briefcase className="h-6 w-6" />
                <h3 className="text-lg font-bold">Opportunities</h3>
              </div>
              <p className="text-green-100 text-sm mb-4">Find internships, jobs, and freelance projects.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">23 new</span>
                <Link href="/opportunities">
                  <Button variant="ghost" size="sm" className="text-white hover:text-green-200 p-0">
                    Explore <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Reviews System Preview */}
          <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <Star className="h-6 w-6" />
                <h3 className="text-lg font-bold">Reviews</h3>
              </div>
              <p className="text-yellow-100 text-sm mb-4">Rate and review campus services and experiences.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">4.2 avg</span>
                <Link href="/reviews">
                  <Button variant="ghost" size="sm" className="text-white hover:text-yellow-200 p-0">
                    Review <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Complaints System Preview */}
          <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-bold">Submit Feedback</h3>
              </div>
              <p className="text-red-100 text-sm mb-4">Anonymous complaints and suggestions portal.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Private & Secure</span>
                <Link href="/complaints">
                  <Button variant="ghost" size="sm" className="text-white hover:text-red-200 p-0">
                    Submit <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Horizontal line before Footer */}
      <hr className="border-t border-gray-300 dark:border-gray-700 max-w-7xl mx-auto" />

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">UUConnect</h3>
              <p className="text-gray-400 text-sm">Connecting the Uttaranchal University community through shared experiences, knowledge, and opportunities.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/blogs" className="hover:text-white">Blogs</Link></li>
                <li><Link href="/qna" className="hover:text-white">Q&A Forum</Link></li>
                <li><Link href="/opportunities" className="hover:text-white">Opportunities</Link></li>
                <li><Link href="/skill-share" className="hover:text-white">Skill Sharing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/mental-health" className="hover:text-white">Mental Health</Link></li>
                <li><Link href="/complaints" className="hover:text-white">Submit Feedback</Link></li>
                <li><Link href="/reviews" className="hover:text-white">Reviews</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">University</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/announcements" className="hover:text-white">Announcements</Link></li>
                <li><Link href="/calendar" className="hover:text-white">Events Calendar</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 UUConnect - Uttaranchal University Student Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

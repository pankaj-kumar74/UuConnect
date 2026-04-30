import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { requireAdmin } from "@/lib/auth";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  BarChart3, 
  Users, 
  FileText, 
  MessageSquare, 
  AlertTriangle,
  TrendingUp,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Building
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  // Stats queries
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: blogs } = useQuery({
    queryKey: ["/api/blogs"],
  });

  const { data: qnaThreads } = useQuery({
    queryKey: ["/api/qna"],
  });

  const { data: complaints } = useQuery({
    queryKey: ["/api/complaints"],
  });

  const { data: announcements } = useQuery({
    queryKey: ["/api/announcements"],
  });

  const { data: opportunities } = useQuery({
    queryKey: ["/api/opportunities"],
  });

  const { data: reviews } = useQuery({
    queryKey: ["/api/reviews"],
  });

  const { data: skills } = useQuery({
    queryKey: ["/api/skills"],
  });

  const { data: mentalHealthPosts } = useQuery({
    queryKey: ["/api/mental-health"],
  });

  // Delete mutations
  const deleteBlogMutation = useMutation({
    mutationFn: async (blogId: number) => {
      const response = await apiRequest("DELETE", `/api/blogs/${blogId}`);
      // Check if response has content before parsing JSON
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blogs"] });
      toast({ title: "Success", description: "Blog deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: number) => {
      const response = await apiRequest("DELETE", `/api/announcements/${announcementId}`);
      // Check if response has content before parsing JSON
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Success", description: "Announcement deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateComplaintStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/complaints/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({ title: "Success", description: "Complaint status updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "in_progress": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  // Calculate some stats
  const totalUsers = stats?.totalUsers || 0; // Use actual stats from API
  const totalPosts = (blogs?.length || 0) + (qnaThreads?.length || 0) + (announcements?.length || 0);
  const pendingComplaints = complaints?.filter((c: any) => c.status === "open").length || 0;
  const averageRating = reviews?.length > 0 
    ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "N/A";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* <Navigation /> */}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span>Admin Dashboard</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Monitor and manage all platform activities
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalPosts}</p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Complaints</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{pendingComplaints}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Rating</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{averageRating}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Management Tabs */}
        <Tabs defaultValue="complaints" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="blogs">Blogs</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="qna">Q&A</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Complaints Management */}
          <TabsContent value="complaints">
            <Card>
              <CardHeader>
                <CardTitle>Complaints Management</CardTitle>
              </CardHeader>
              <CardContent>
                {complaints && complaints.length > 0 ? (
                  <div className="space-y-4">
                    {complaints.map((complaint: any) => (
                      <div 
                        key={complaint.id} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getStatusColor(complaint.status)}>
                                {complaint.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{complaint.category}</Badge>
                              {complaint.isAnonymous && (
                                <Badge variant="outline">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Anonymous
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                              {complaint.description}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>
                                Submitted {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                              </span>
                              {!complaint.isAnonymous && complaint.author && (
                                <span>by {complaint.author.fullName}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedComplaint(complaint)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Select
                              value={complaint.status}
                              onValueChange={(status) => updateComplaintStatusMutation.mutate({ 
                                id: complaint.id, 
                                status 
                              })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No complaints to review
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blogs Management */}
          <TabsContent value="blogs">
            <Card>
              <CardHeader>
                <CardTitle>Blogs Management</CardTitle>
              </CardHeader>
              <CardContent>
                {blogs && blogs.length > 0 ? (
                  <div className="space-y-4">
                    {blogs.map((blog: any) => (
                      <div 
                        key={blog.id} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={blog.author?.avatar} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(blog.author?.fullName || "Unknown")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{blog.author?.fullName}</span>
                              <Badge>{blog.category}</Badge>
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {blog.title}
                            </h3>
                            
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                              {blog.excerpt}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>{blog.likes} likes</span>
                              <span>{blog.commentsCount} comments</span>
                              <span>{formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBlogMutation.mutate(blog.id)}
                            disabled={deleteBlogMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No blogs to manage
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Management */}
          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Announcements Management</CardTitle>
              </CardHeader>
              <CardContent>
                {announcements && announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((announcement: any) => (
                      <div 
                        key={announcement.id} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge>{announcement.category}</Badge>
                              {announcement.eventDate && (
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Event
                                </Badge>
                              )}
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {announcement.title}
                            </h3>
                            
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                              {announcement.content}
                            </p>
                            
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                            disabled={deleteAnnouncementMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No announcements to manage
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Q&A Management */}
          <TabsContent value="qna">
            <Card>
              <CardHeader>
                <CardTitle>Q&A Management</CardTitle>
              </CardHeader>
              <CardContent>
                {qnaThreads && qnaThreads.length > 0 ? (
                  <div className="space-y-4">
                    {qnaThreads.map((thread: any) => (
                      <div 
                        key={thread.id} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={thread.author?.avatar} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(thread.author?.fullName || "Unknown")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{thread.author?.fullName}</span>
                              {thread.tags && thread.tags.length > 0 && (
                                <Badge variant="outline">{thread.tags[0]}</Badge>
                              )}
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {thread.question}
                            </h3>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>{thread.answersCount} answers</span>
                              <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No Q&A threads to manage
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities Management */}
          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle>Opportunities Management</CardTitle>
              </CardHeader>
              <CardContent>
                {opportunities && opportunities.length > 0 ? (
                  <div className="space-y-4">
                    {opportunities.map((opportunity: any) => (
                      <div 
                        key={opportunity.id} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={opportunity.author?.avatar} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(opportunity.author?.fullName || "Unknown")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{opportunity.author?.fullName}</span>
                              <Badge>{opportunity.category}</Badge>
                              {opportunity.company && (
                                <Badge variant="outline">
                                  <Building className="h-3 w-3 mr-1" />
                                  {opportunity.company}
                                </Badge>
                              )}
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {opportunity.title}
                            </h3>
                            
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                              {opportunity.description}
                            </p>
                            
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(opportunity.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No opportunities to manage
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Management */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Reviews Management</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div 
                        key={review.id} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={review.author?.avatar} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(review.author?.fullName || "Unknown")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{review.author?.fullName}</span>
                              <Badge>{review.category}</Badge>
                              <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">★</span>
                                <span className="text-sm font-medium">{review.rating}/5</span>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                              {review.comment}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>{review.upvotes} upvotes</span>
                              <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No reviews to manage
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Complaint Detail Modal */}
        <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Complaint Details</DialogTitle>
            </DialogHeader>
            {selectedComplaint && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(selectedComplaint.status)}>
                    {selectedComplaint.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{selectedComplaint.category}</Badge>
                  {selectedComplaint.isAnonymous && (
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      Anonymous
                    </Badge>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedComplaint.description}
                  </p>
                </div>

                {selectedComplaint.attachment && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Attachment</h4>
                    <a 
                      href={selectedComplaint.attachment} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Attachment
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Submitted:</span>
                    <div>{formatDistanceToNow(new Date(selectedComplaint.createdAt), { addSuffix: true })}</div>
                  </div>
                  {!selectedComplaint.isAnonymous && selectedComplaint.author && (
                    <div>
                      <span className="font-medium">Submitted by:</span>
                      <div>{selectedComplaint.author.fullName}</div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Select
                    value={selectedComplaint.status}
                    onValueChange={(status) => {
                      updateComplaintStatusMutation.mutate({ 
                        id: selectedComplaint.id, 
                        status 
                      });
                      setSelectedComplaint({ ...selectedComplaint, status });
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setSelectedComplaint(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default requireAdmin(AdminDashboard);

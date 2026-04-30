import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Edit, 
  FileText, 
  MessageSquare, 
  Briefcase, 
  Users, 
  Heart,
  Calendar,
  Mail,
  MapPin,
  GraduationCap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    bio: "",
    avatar: "",
  });

  // Use current user's ID if no ID provided
  const profileUserId = id ? parseInt(id) : currentUser?.id;

  const { data: profileUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users", profileUserId],
    enabled: !!profileUserId,
  });

  const { data: userBlogs } = useQuery({
    queryKey: ["/api/blogs", { userId: profileUserId }],
    enabled: !!profileUserId,
    queryFn: async () => {
      const response = await fetch(`/api/blogs?userId=${profileUserId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user blogs');
      }
      return response.json();
    },
  });

  const { data: userQuestions } = useQuery({
    queryKey: ["/api/qna"],
    select: (data) => data?.filter((thread: any) => thread.userId === profileUserId),
    enabled: !!profileUserId,
  });

  const { data: userSkills } = useQuery({
    queryKey: ["/api/skills"],
    select: (data) => data?.filter((skill: any) => skill.userId === profileUserId),
    enabled: !!profileUserId,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updateData: typeof editFormData) => {
      const response = await apiRequest("PUT", `/api/users/${profileUserId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", profileUserId] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const isOwnProfile = currentUser?.id === profileUserId;

  const handleEditProfile = () => {
    if (profileUser) {
      setEditFormData({
        fullName: profileUser.fullName,
        bio: profileUser.bio || "",
        avatar: profileUser.avatar || "",
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(editFormData);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-12">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                User Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The user profile you're looking for doesn't exist.
              </p>
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* <Navigation /> */}
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={profileUser.avatar && profileUser.avatar.trim() !== "" ? profileUser.avatar : undefined} 
                  alt={profileUser.fullName}
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-2xl">
                  {getInitials(profileUser.fullName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {profileUser.fullName}
                  </h1>
                  <Badge variant={profileUser.role === "admin" ? "destructive" : "secondary"}>
                    {profileUser.role}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300 mb-3">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{profileUser.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatDistanceToNow(new Date(profileUser.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                
                {profileUser.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {profileUser.bio}
                  </p>
                )}
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {userBlogs?.length || 0}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 ml-1">Blogs</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {userQuestions?.length || 0}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 ml-1">Questions</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {userSkills?.length || 0}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 ml-1">Skills</span>
                  </div>
                </div>
              </div>
              
              {isOwnProfile && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleEditProfile}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={editFormData.fullName}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editFormData.bio}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="avatar">Avatar URL</Label>
                        <Input
                          id="avatar"
                          value={editFormData.avatar}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, avatar: e.target.value }))}
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={updateProfileMutation.isPending}>
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="blogs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="blogs" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Blogs</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Questions</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Skills</span>
            </TabsTrigger>
          </TabsList>

          {/* Blogs Tab */}
          <TabsContent value="blogs">
            {userBlogs && userBlogs.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {userBlogs.map((blog: any) => (
                  <Card key={blog.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <Link href={`/blogs/${blog.id}`}>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-primary cursor-pointer">
                          {blog.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                        {blog.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <Badge>{blog.category}</Badge>
                        <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>{blog.likes}</span>
                          </div>
                          <span>{formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No blogs yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {isOwnProfile ? "Start sharing your thoughts and experiences!" : `${profileUser.fullName} hasn't written any blogs yet.`}
                  </p>
                  {isOwnProfile && (
                    <Link href="/add-blog">
                      <Button>Write Your First Blog</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            {userQuestions && userQuestions.length > 0 ? (
              <div className="space-y-4">
                {userQuestions.map((question: any) => (
                  <Card key={question.id}>
                    <CardContent className="p-4">
                      <Link href={`/qna?thread=${question.id}`}>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-primary cursor-pointer">
                          {question.question}
                        </h3>
                      </Link>
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {question.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{question.answersCount} answers</span>
                        <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No questions yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {isOwnProfile ? "Ask your first question to get help from seniors!" : `${profileUser.fullName} hasn't asked any questions yet.`}
                  </p>
                  {isOwnProfile && (
                    <Link href="/qna">
                      <Button>Ask a Question</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills">
            {userSkills && userSkills.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {userSkills.map((skill: any) => (
                  <Card key={skill.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {skill.skillTitle}
                        </h3>
                        <Badge variant={skill.isHelpRequest ? "outline" : "default"}>
                          {skill.isHelpRequest ? "Seeking Help" : "Offering Help"}
                        </Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        {skill.description}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(skill.createdAt), { addSuffix: true })}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No skills shared yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {isOwnProfile ? "Share your skills or ask for help learning new ones!" : `${profileUser.fullName} hasn't shared any skills yet.`}
                  </p>
                  {isOwnProfile && (
                    <Link href="/skill-share">
                      <Button>Share Your Skills</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

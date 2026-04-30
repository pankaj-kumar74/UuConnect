import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Heart, MessageCircle, Shield, Phone, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MentalHealth() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    content: "",
    isAnonymous: true,
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/mental-health"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: typeof formData) => {
      const response = await apiRequest("POST", "/api/mental-health", postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mental-health"] });
      setIsCreateDialogOpen(false);
      setFormData({ content: "", isAnonymous: true });
      toast({
        title: "Success",
        description: "Your post has been shared anonymously. Thank you for contributing!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please write something to share",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* <Navigation /> */}
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Heart className="h-8 w-8 text-pink-500" />
                <span>Mental Health Corner</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                A safe, supportive space for sharing experiences and finding strength together
              </p>
            </div>
            {user && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-pink-500 hover:bg-pink-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Share Your Story
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Share Your Experience</DialogTitle>
                  </DialogHeader>
                  <Alert className="mb-4">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      This is a safe space. Your privacy is protected and all posts can be made anonymously.
                    </AlertDescription>
                  </Alert>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isAnonymous"
                        checked={formData.isAnonymous}
                        onCheckedChange={(checked) => handleChange("isAnonymous", checked)}
                      />
                      <Label htmlFor="isAnonymous">
                        Post anonymously (recommended)
                      </Label>
                    </div>

                    <div>
                      <Label htmlFor="content">Your Story *</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => handleChange("content", e.target.value)}
                        placeholder="Share your thoughts, experiences, struggles, victories, or words of encouragement. Your story might help someone else feel less alone."
                        required
                        rows={6}
                        className="min-h-[150px]"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPostMutation.isPending}
                        className="bg-pink-500 hover:bg-pink-600"
                      >
                        {createPostMutation.isPending ? "Sharing..." : "Share Safely"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Support Resources */}
        <Card className="mb-8 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-800">
          <CardHeader>
            <CardTitle className="text-pink-800 dark:text-pink-200">Support Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Emergency Helplines</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-red-500" />
                    <span>National Suicide Prevention: 988</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <span>Crisis Text Line: Text HOME to 741741</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Campus Support</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-green-500" />
                    <span>Counseling Center: counseling@uu.ac.in</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-purple-500" />
                    <span>Student Health: +91-XXX-XXX-XXXX</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading posts...</div>
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post: any) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={post.author?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
                        {post.isAnonymous ? "?" : getInitials(post.author?.fullName || "Anonymous")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {post.isAnonymous ? "Anonymous" : post.author?.fullName}
                        </h3>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                        {post.isAnonymous && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Anonymous
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center space-x-6">
                        <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-pink-500">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500">
                          <MessageCircle className="h-4 w-4" />
                          <span>Support</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-pink-300 mx-auto mb-4" />
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              No posts yet. Be the first to share your story and support others.
            </div>
            {user && (
              <Button 
                className="bg-pink-500 hover:bg-pink-600"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Share your story
              </Button>
            )}
          </div>
        )}

        {/* Footer Message */}
        <div className="mt-12 text-center">
          <Alert className="max-w-2xl mx-auto bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Heart className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Remember: You are not alone. Every story shared here matters and helps build our supportive community. 
              If you're in crisis, please reach out to the resources above or contact emergency services.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
}

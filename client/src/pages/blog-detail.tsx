import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import CommentSection from "@/components/comment-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BlogDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: blog, isLoading } = useQuery({
    queryKey: ["/api/blogs", id],
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/blogs/${id}/like`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blogs", id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update like",
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

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to like posts",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading blog...</div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Blog not found
            </h1>
            <Link href="/blogs">
              <Button>Back to Blogs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/blogs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blogs
            </Button>
          </Link>
        </div>

        <Card className="mb-8">
          <CardContent className="p-8">
            {/* Author Info */}
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={blog.author?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                  {getInitials(blog.author?.fullName || "Unknown")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {blog.author?.fullName}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                  </span>
                  <Badge>{blog.category}</Badge>
                </div>
              </div>
            </div>

            {/* Blog Title */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {blog.title}
            </h1>

            {/* Blog Image */}
            {blog.image && (
              <img 
                src={blog.image} 
                alt={blog.title}
                className="rounded-lg w-full h-64 object-cover mb-6"
              />
            )}

            {/* Blog Content */}
            <div className="prose max-w-none dark:prose-invert mb-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {blog.content}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-6">
                <button 
                  className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-red-500"
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                >
                  <Heart className="h-5 w-5" />
                  <span>{blog.likes}</span>
                </button>
                <a 
                  href="#comments"
                  className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>{blog.commentsCount} Comments</span>
                </a>
                <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-500">
                  <Share2 className="h-5 w-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <CommentSection blogId={parseInt(id!)} />
      </main>
    </div>
  );
}

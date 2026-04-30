import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommentSectionProps {
  blogId: number;
}

export default function CommentSection({ blogId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["/api/blogs", blogId, "comments"],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/blogs/${blogId}/comments`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blogs", blogId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blogs", blogId] });
      queryClient.invalidateQueries({ queryKey: ["/api/blogs"] });
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  return (
    <Card id="comments">
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add Comment Form */}
        {user && (
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex space-x-4">
              <Avatar className="flex-shrink-0">
                <AvatarImage 
                  src={user.avatar && user.avatar.trim() !== "" ? user.avatar : undefined} 
                  alt={user.fullName}
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                  >
                    {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading comments...
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <div key={comment.id} className="flex space-x-4">
                <Avatar className="flex-shrink-0">
                  <AvatarImage src={comment.author?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                    {getInitials(comment.author?.fullName || "Unknown")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {comment.author?.fullName}
                      </h4>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {comment.content}
                    </p>
                    <div className="flex items-center space-x-4 mt-3">
                      <button className="text-gray-500 dark:text-gray-400 hover:text-red-500 text-xs flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{comment.likes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </div>
        )}
      </CardContent>
    </Card>
  );
}

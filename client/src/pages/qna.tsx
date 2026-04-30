import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, MessageSquare, ArrowUp, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function QnA() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [newReply, setNewReply] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    question: "",
    tags: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check URL for thread parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const threadId = urlParams.get('thread');
    if (threadId) {
      setSelectedThread(parseInt(threadId));
    }
  }, []);

  const { data: threads, isLoading: threadsLoading } = useQuery({
    queryKey: ["/api/qna"],
  });

  const { data: replies, isLoading: repliesLoading } = useQuery({
    queryKey: ["/api/qna", selectedThread, "replies"],
    enabled: !!selectedThread,
  });

  const createThreadMutation = useMutation({
    mutationFn: async (threadData: { question: string; tags: string[]; userId: number }) => {
      const response = await apiRequest("POST", "/api/qna", threadData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qna"] });
      setIsCreateDialogOpen(false);
      setFormData({ question: "", tags: "" });
      toast({
        title: "Success",
        description: "Question posted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post question",
        variant: "destructive",
      });
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async (replyData: { answer: string; threadId: number; userId: number }) => {
      const response = await apiRequest("POST", `/api/qna/${selectedThread}/replies`, replyData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qna", selectedThread, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/qna"] });
      setNewReply("");
      toast({
        title: "Success",
        description: "Reply posted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post reply",
        variant: "destructive",
      });
    },
  });

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim()) {
      toast({
        title: "Error",
        description: "Please enter your question",
        variant: "destructive",
      });
      return;
    }

    const tags = formData.tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    createThreadMutation.mutate({
      question: formData.question,
      tags,
      userId: user?.id ?? 0,
    });
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReply.trim()) {
      toast({
        title: "Error",
        description: "Please enter your answer",
        variant: "destructive",
      });
      return;
    }

    createReplyMutation.mutate({
      answer: newReply,
      threadId: selectedThread ?? 0,
      userId: user?.id ?? 0,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const filteredThreads = threads?.filter((thread: any) =>
    thread.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedThreadData = threads?.find((t: any) => t.id === selectedThread);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* <Navigation /> */}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Ask Senior Q&A</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Get help from seniors and peers on academics, campus life, and career guidance
              </p>
            </div>
            {user && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary hover:bg-secondary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Ask Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ask a Question</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitQuestion} className="space-y-4">
                    <div>
                      <Label htmlFor="question">Your Question *</Label>
                      <Textarea
                        id="question"
                        value={formData.question}
                        onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                        placeholder="Describe your question in detail..."
                        required
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags (optional)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="e.g., academics, placement, hostel (comma-separated)"
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
                        disabled={createThreadMutation.isPending}
                        className="bg-secondary hover:bg-secondary/90"
                      >
                        {createThreadMutation.isPending ? "Posting..." : "Post Question"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Search */}
          <div className="mt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Questions List */}
          <div className="lg:col-span-2">
            {threadsLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">Loading questions...</div>
              </div>
            ) : filteredThreads && filteredThreads.length > 0 ? (
              <div className="space-y-4">
                {filteredThreads.map((thread: any) => (
                  <Card 
                    key={thread.id} 
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${
                      selectedThread === thread.id ? 'ring-2 ring-secondary' : ''
                    }`}
                    onClick={() => setSelectedThread(thread.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage src={thread.author?.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white">
                            {getInitials(thread.author?.fullName || "Unknown")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {thread.author?.fullName}
                            </h3>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                              {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                            {thread.question}
                          </h4>

                          {thread.tags && thread.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {thread.tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{thread.answersCount} answers</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery ? "No questions found matching your search" : "No questions yet"}
                </div>
                {user && !searchQuery && (
                  <Button 
                    className="bg-secondary hover:bg-secondary/90"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ask the first question
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Thread Details */}
          <div className="lg:col-span-1">
            {selectedThread && selectedThreadData ? (
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg">Question Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {selectedThreadData.question}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedThreadData.author?.avatar} />
                          <AvatarFallback className="bg-orange-500 text-white text-xs">
                            {getInitials(selectedThreadData.author?.fullName || "Unknown")}
                          </AvatarFallback>
                        </Avatar>
                        <span>by {selectedThreadData.author?.fullName}</span>
                      </div>
                    </div>

                    {/* Replies */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Answers ({selectedThreadData.answersCount})
                      </h4>
                      
                      {repliesLoading ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">Loading answers...</div>
                      ) : replies && replies.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {replies.map((reply: any) => (
                            <div key={reply.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={reply.author?.avatar} />
                                  <AvatarFallback className="bg-green-500 text-white text-xs">
                                    {getInitials(reply.author?.fullName || "Unknown")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {reply.author?.fullName}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {reply.answer}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 flex items-center space-x-1">
                                  <ArrowUp className="h-3 w-3" />
                                  <span>{reply.likes}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">No answers yet</div>
                      )}
                    </div>

                    {/* Reply Form */}
                    {user && (
                      <form onSubmit={handleSubmitReply} className="space-y-3">
                        <Textarea
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          placeholder="Write your answer..."
                          rows={3}
                          className="text-sm"
                        />
                        <Button 
                          type="submit" 
                          size="sm"
                          disabled={!newReply.trim() || createReplyMutation.isPending}
                          className="w-full"
                        >
                          {createReplyMutation.isPending ? "Posting..." : "Post Answer"}
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-8">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a question to view details and answers
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Megaphone, Calendar, MapPin } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Announcements() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    eventDate: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["/api/announcements"],
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcementData: typeof formData) => {
      const data = {
        ...announcementData,
        title: announcementData.title.trim(),
        content: announcementData.content.trim(),
        category: announcementData.category.trim(),
        eventDate: announcementData.eventDate ? new Date(announcementData.eventDate) : null,
      };
      const response = await apiRequest("POST", "/api/announcements", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setIsCreateDialogOpen(false);
      setFormData({ title: "", content: "", category: "", eventDate: "" });
      toast({
        title: "Success",
        description: "Announcement created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  const categories = [
    "Academic",
    "Events",
    "Admissions",
    "Scholarships",
    "Examinations",
    "General",
    "Sports",
    "Cultural",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createAnnouncementMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
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

  const getCategoryColor = (category: string) => {
    const colors = {
      Academic: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Events: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Admissions: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Scholarships: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Examinations: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      General: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      Sports: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Cultural: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    };
    return colors[category as keyof typeof colors] || colors.General;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* <Navigation /> */}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Announcements</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Stay updated with the latest news and events from the university
              </p>
            </div>
            {user?.role === "admin" && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Announcement</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        placeholder="Enter announcement title"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="eventDate">Event Date (optional)</Label>
                        <Input
                          id="eventDate"
                          type="datetime-local"
                          value={formData.eventDate}
                          onChange={(e) => handleChange("eventDate", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="content">Content *</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => handleChange("content", e.target.value)}
                        placeholder="Enter announcement content"
                        required
                        rows={6}
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
                        disabled={createAnnouncementMutation.isPending}
                      >
                        {createAnnouncementMutation.isPending ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading announcements...</div>
          </div>
        ) : announcements && announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((announcement: any) => (
              <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                        <Megaphone className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getCategoryColor(announcement.category)}>
                          {announcement.category}
                        </Badge>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                        {announcement.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                        {announcement.content}
                      </p>

                      {announcement.eventDate && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Event Date: {format(new Date(announcement.eventDate), "PPP 'at' p")}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={announcement.author?.avatar} />
                          <AvatarFallback className="bg-gray-500 text-white text-xs">
                            {getInitials(announcement.author?.fullName || "Admin")}
                          </AvatarFallback>
                        </Avatar>
                        <span>Posted by {announcement.author?.fullName || "Administrator"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">No announcements yet</div>
            {user?.role === "admin" && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create the first announcement
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

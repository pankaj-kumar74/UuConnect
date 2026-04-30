import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Briefcase, Clock, Building, Search, ExternalLink } from "lucide-react";
import { formatDistanceToNow, format, isBefore } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog as DetailDialog, DialogContent as DetailDialogContent, DialogHeader as DetailDialogHeader, DialogTitle as DetailDialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";

interface Opportunity {
  id: number;
  title: string;
  description: string;
  category: string;
  company?: string;
  deadline?: string;
  createdAt: string;
  author?: {
    id: number;
    fullName: string;
    avatar?: string;
  } | null;
}

export default function Opportunities() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    company: "",
    deadline: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const { data: opportunities, isLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
  });

  const createOpportunityMutation = useMutation({
    mutationFn: async (opportunityData: typeof formData) => {
      const data = {
        ...opportunityData,
        deadline: opportunityData.deadline ? new Date(opportunityData.deadline) : null,
      };
      const response = await apiRequest("POST", "/api/opportunities", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setIsCreateDialogOpen(false);
      setFormData({ title: "", description: "", category: "", company: "", deadline: "" });
      toast({
        title: "Success",
        description: "Opportunity posted successfully!",
      });
    },
    onError: (error: any) => {
      let errorMsg = error?.message || "Failed to post opportunity";
      // Try to parse backend error if possible
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed && parsed.message) errorMsg = parsed.message;
      } catch {}
      console.error("Opportunity post error:", error);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  const categories = [
    "All Categories",
    "Internship",
    "Full-time Job",
    "Part-time Job",
    "Freelance",
    "Research",
    "Startup",
    "Remote",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createOpportunityMutation.mutate(formData);
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
      Internship: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Full-time Job": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Part-time Job": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Freelance: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Research: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      Startup: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Remote: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const filteredOpportunities = opportunities?.filter((opportunity: any) => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opportunity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (opportunity.company && opportunity.company.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || selectedCategory === "" || opportunity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Opportunities</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Discover internships, jobs, and freelance opportunities shared by the community
              </p>
            </div>
            {user?.role === "admin" && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Post Opportunity
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Post New Opportunity</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        placeholder="e.g., Software Engineer Intern at TechCorp"
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
                            {categories.slice(1).map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="company">Company (optional)</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => handleChange("company", e.target.value)}
                          placeholder="Company name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="deadline">Application Deadline (optional)</Label>
                      <Input
                        id="deadline"
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => handleChange("deadline", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Describe the opportunity, requirements, how to apply, etc."
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
                        disabled={createOpportunityMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {createOpportunityMutation.isPending ? "Posting..." : "Post Opportunity"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem 
                    key={category} 
                    value={category === "All Categories" ? "all" : category}
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Opportunities Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading opportunities...</div>
          </div>
        ) : filteredOpportunities && filteredOpportunities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity: Opportunity) => (
              <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge className={getCategoryColor(opportunity.category)}>
                        {opportunity.category}
                      </Badge>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-2 line-clamp-2">
                        {opportunity.title}
                      </h3>
                      {opportunity.company && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Building className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {opportunity.company}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {opportunity.description}
                  </p>

                  {opportunity.deadline && (
                    <div className="flex items-center space-x-1 mb-4">
                      <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className={`text-sm ${
                        isBefore(new Date(opportunity.deadline), new Date()) 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        Deadline: {format(new Date(opportunity.deadline), "PPP")}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={opportunity.author?.avatar} />
                        <AvatarFallback className="bg-green-500 text-white text-xs">
                          {getInitials(opportunity.author?.fullName || "Unknown")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {opportunity.author?.fullName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(opportunity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <Button
                    asChild
                    className="mt-4 w-full"
                    variant="outline"
                  >
                    <Link href={`/opportunities/${opportunity.id}`}>
                      View More
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery || selectedCategory ? "No opportunities found matching your criteria" : "No opportunities posted yet"}
            </div>
            {user?.role === "admin" && !searchQuery && !selectedCategory && (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Post the first opportunity
              </Button>
            )}
          </div>
        )}
      </main>
      {/* Opportunity Details Dialog */}
      <DetailDialog open={!!selectedOpportunity} onOpenChange={() => setSelectedOpportunity(null)}>
        <DetailDialogContent className="max-w-lg">
          <DetailDialogHeader>
            <DetailDialogTitle>{selectedOpportunity?.title}</DetailDialogTitle>
          </DetailDialogHeader>
          {selectedOpportunity && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge className={getCategoryColor(selectedOpportunity.category)}>
                  {selectedOpportunity.category}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Posted {formatDistanceToNow(new Date(selectedOpportunity.createdAt), { addSuffix: true })}
                </span>
              </div>
              {selectedOpportunity.company && (
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedOpportunity.company}
                  </span>
                </div>
              )}
              {selectedOpportunity.deadline && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className={`text-sm ${
                    isBefore(new Date(selectedOpportunity.deadline), new Date())
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    Deadline: {format(new Date(selectedOpportunity.deadline), "PPP")}
                  </span>
                </div>
              )}
              <div>
                <Label>Description</Label>
                <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap mt-1">
                  {selectedOpportunity.description}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedOpportunity.author?.avatar} />
                  <AvatarFallback className="bg-green-500 text-white text-xs">
                    {getInitials(selectedOpportunity.author?.fullName || "Unknown")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedOpportunity.author?.fullName}
                </span>
              </div>
            </div>
          )}
        </DetailDialogContent>
      </DetailDialog>
    </div>
  );
}

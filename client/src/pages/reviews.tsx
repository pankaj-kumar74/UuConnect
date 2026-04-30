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
import { Plus, Star, ThumbsUp, ImageIcon, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Reviews() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [formData, setFormData] = useState({
    category: "placeholder",
    rating: 5,
    comment: "",
    image: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["/api/reviews"],
  });

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: typeof formData & { userId: number }) => {
      const response = await apiRequest("POST", "/api/reviews", reviewData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      setIsCreateDialogOpen(false);
      setFormData({ category: "placeholder", rating: 5, comment: "", image: "" });
      toast({
        title: "Success",
        description: "Review submitted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const categories = [
    "Dining Services",
    "Library",
    "Sports Facilities",
    "Academic Services",
    "Campus Infrastructure",
    "Hostel Services",
    "Transportation",
    "IT Services",
    "Student Support",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || formData.category === "placeholder" || !formData.comment.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a review.",
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate({ ...formData, userId: user.id });
  };

  const handleChange = (field: string, value: string | number) => {
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
      "Dining Services": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      "Library": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Sports Facilities": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Academic Services": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Campus Infrastructure": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      "Hostel Services": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      "Transportation": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      "IT Services": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      "Student Support": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
    return colors[category as keyof typeof colors] || colors["Campus Infrastructure"];
  };

  const renderStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${
          index < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300 dark:text-gray-600'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive && onRatingChange ? () => onRatingChange(index + 1) : undefined}
      />
    ));
  };

  // Ensure reviews is always an array
  const safeReviews = Array.isArray(reviews) ? reviews : [];

  const filteredReviews = safeReviews.filter((review: any) => {
    const matchesSearch = review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === "All Categories" || review.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate average rating
  const averageRating = safeReviews.length > 0 
    ? safeReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / safeReviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* <Navigation /> */}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Campus Reviews</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Share your experiences and help improve campus services
              </p>
              {safeReviews.length > 0 && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1">
                    {renderStars(Math.round(averageRating))}
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    ({safeReviews.length} reviews)
                  </span>
                </div>
              )}
            </div>
            {user && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-yellow-500 hover:bg-yellow-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Write Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="category">Service Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="placeholder" disabled>Select service category</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Rating *</Label>
                      <div className="flex items-center space-x-1 mt-2">
                        {renderStars(formData.rating, true, (rating) => handleChange("rating", rating))}
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                          ({formData.rating} out of 5)
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="comment">Your Review *</Label>
                      <Textarea
                        id="comment"
                        value={formData.comment}
                        onChange={(e) => handleChange("comment", e.target.value)}
                        placeholder="Share your experience with this service..."
                        required
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="image">Image URL (optional)</Label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="image"
                          value={formData.image}
                          onChange={(e) => handleChange("image", e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="pl-10"
                        />
                      </div>
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
                        disabled={createReviewMutation.isPending}
                        className="bg-yellow-500 hover:bg-yellow-600"
                      >
                        {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
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
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory || "All Categories"} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Categories">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem 
                    key={category} 
                    value={category}
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading reviews...</div>
          </div>
        ) : filteredReviews && filteredReviews.length > 0 ? (
          <div className="space-y-6">
            {filteredReviews.map((review: any) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={review.author?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
                        {getInitials(review.author?.fullName || "Unknown")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {review.author?.fullName}
                        </h3>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </span>
                        <Badge className={getCategoryColor(review.category)}>
                          {review.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {review.rating}/5
                        </span>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                        {review.comment}
                      </p>

                      {review.image && (
                        <img 
                          src={review.image} 
                          alt="Review"
                          className="rounded-lg w-full max-w-md h-48 object-cover mb-4"
                        />
                      )}
                      
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-500">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{review.upvotes}</span>
                          <span className="text-sm">Helpful</span>
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
            <Star className="h-16 w-16 text-yellow-300 mx-auto mb-4" />
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery || selectedCategory ? "No reviews found matching your criteria" : "No reviews yet"}
            </div>
            {user && !searchQuery && !selectedCategory && (
              <Button 
                className="bg-yellow-500 hover:bg-yellow-600"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Write the first review
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

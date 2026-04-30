import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Plus, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Blog {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  image?: string;
  likes: number;
  commentsCount: number;
  createdAt: string;
  author?: {
    id: number;
    fullName: string;
    avatar?: string;
  } | null;
}

export default function Blogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: blogs, isLoading } = useQuery<Blog[]>({
    queryKey: ["/api/blogs", { search: searchQuery, category: selectedCategory === "all" ? "" : selectedCategory }],
    queryFn: async ({ queryKey }) => {
      const [baseUrl, params] = queryKey as [string, any];
      const url = new URL(baseUrl, window.location.origin);
      if (params.search) url.searchParams.set("search", params.search);
      if (params.category) url.searchParams.set("category", params.category);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const categories = [
    "All Categories",
    "Achievements",
    "Events", 
    "Projects",
    "Academic",
    "Campus Life",
    "Technology",
    "Sports",
  ];

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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Campus Blogs</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Share your experiences, achievements, and thoughts with the community
              </p>
            </div>
            <Link href="/add-blog">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Write Blog
              </Button>
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search blogs..."
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

        {/* Blogs Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading blogs...</div>
          </div>
        ) : blogs && blogs.length > 0 ? (
          <div className="space-y-6">
            {blogs.map((blog: Blog) => (
              <Card key={blog.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={blog.author?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                        {getInitials(blog.author?.fullName || "Unknown")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {blog.author?.fullName}
                        </h3>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                        </span>
                        <Badge>{blog.category}</Badge>
                      </div>
                      
                      <Link href={`/blogs/${blog.id}`}>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 hover:text-primary cursor-pointer">
                          {blog.title}
                        </h4>
                      </Link>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                        {blog.excerpt}
                      </p>
                      
                      {blog.image && (
                        <img 
                          src={blog.image} 
                          alt={blog.title}
                          className="rounded-lg w-full h-64 object-cover mb-4"
                        />
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-red-500">
                            <Heart className="h-4 w-4" />
                            <span>{blog.likes}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500">
                            <MessageCircle className="h-4 w-4" />
                            <span>{blog.commentsCount}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-500">
                            <Share2 className="h-4 w-4" />
                            <span>Share</span>
                          </button>
                        </div>
                        <Link href={`/blogs/${blog.id}`}>
                          <Button variant="ghost" size="sm">
                            Read More →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">No blogs found</div>
            <Link href="/add-blog">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Write the first blog
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

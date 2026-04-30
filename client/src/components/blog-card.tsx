import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BlogCardProps {
  blog: {
    id: number;
    title: string;
    excerpt: string;
    category: string;
    image?: string;
    likes: number;
    commentsCount: number;
    createdAt: string;
    author: {
      fullName: string;
      avatar?: string;
    };
  };
  onLike?: (blogId: number) => void;
  isLiked?: boolean;
}

export default function BlogCard({ blog, onLike, isLiked }: BlogCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar>
            <AvatarImage 
              src={blog.author?.avatar && blog.author.avatar.trim() !== "" ? blog.author.avatar : undefined} 
              alt={blog.author?.fullName || "Unknown"}
            />
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
                <button 
                  className={`flex items-center space-x-2 hover:text-red-500 ${
                    isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                  }`}
                  onClick={() => onLike?.(blog.id)}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{blog.likes}</span>
                </button>
                <Link href={`/blogs/${blog.id}#comments`} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500">
                  <MessageCircle className="h-4 w-4" />
                  <span>{blog.commentsCount}</span>
                </Link>
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
  );
}

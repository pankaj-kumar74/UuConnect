import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, FileText, MessageCircle, Briefcase } from "lucide-react";
import { Link } from "wouter";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/blogs", { search: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search UUConnect</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search blogs, questions, opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              autoFocus
            />
          </div>

          {searchQuery.length > 2 && (
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Searching...
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((blog: any) => (
                  <Card key={blog.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Link href={`/blogs/${blog.id}`} onClick={onClose}>
                      <div className="flex items-start space-x-3">
                        <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {blog.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {blog.excerpt}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              by {blog.author?.fullName}
                            </span>
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                              {blog.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))
              ) : searchQuery.length > 2 ? (
                <div className="text-center py-8 text-gray-500">
                  No results found for "{searchQuery}"
                </div>
              ) : null}
            </div>
          )}

          {searchQuery.length <= 2 && (
            <div className="text-center py-8 text-gray-500">
              Start typing to search blogs, questions, and opportunities...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

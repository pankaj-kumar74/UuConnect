import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building, Clock, ArrowLeft } from "lucide-react";
import { formatDistanceToNow, format, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function OpportunityDetail() {
  const { id } = useParams();
  const { data: opportunity, isLoading } = useQuery({
    queryKey: ["/api/opportunities", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/opportunities/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading opportunity...</div>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Opportunity not found
            </h1>
            <Link href="/opportunities">
              <Button>Back to Opportunities</Button>
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
          <Link href="/opportunities">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Opportunities
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={opportunity.author?.avatar} />
                <AvatarFallback className="bg-green-500 text-white text-xs">
                  {getInitials(opportunity.author?.fullName || "Unknown")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {opportunity.author?.fullName}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {formatDistanceToNow(new Date(opportunity.createdAt), { addSuffix: true })}
                  </span>
                  <Badge>{opportunity.category}</Badge>
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {opportunity.title}
            </h1>
            {opportunity.company && (
              <div className="flex items-center space-x-2 mb-4">
                <Building className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="text-lg text-gray-700 dark:text-gray-200">
                  {opportunity.company}
                </span>
              </div>
            )}
            {opportunity.deadline && (
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className={`text-md ${
                  isBefore(new Date(opportunity.deadline), new Date())
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-200'
                }`}>
                  Deadline: {format(new Date(opportunity.deadline), "PPP")}
                </span>
              </div>
            )}
            <div className="mb-6">
              <Label>Description</Label>
              <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap mt-1">
                {opportunity.description}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
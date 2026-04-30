import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, FileText, Send, ImageIcon, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, History } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function Complaints() {
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    attachment: "",
    isAnonymous: true,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);

  // Fetch user's own complaints
  const { data: myComplaints } = useQuery({
    queryKey: ["/api/complaints/my"],
    enabled: !!user,
    onSuccess: (data) => {
      console.log('Received my complaints:', data);
    },
    onError: (error) => {
      console.log('Error fetching my complaints:', error);
    }
  });

  const submitComplaintMutation = useMutation({
    mutationFn: async (complaintData: typeof formData) => {
      const response = await apiRequest("POST", "/api/complaints", complaintData);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      setFormData({ category: "", description: "", attachment: "", isAnonymous: true });
      queryClient.invalidateQueries({ queryKey: ["/api/complaints/my"] });
      toast({
        title: "Success",
        description: "Your complaint has been submitted successfully and will be reviewed by administrators.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit complaint",
        variant: "destructive",
      });
    },
  });

  const categories = [
    "Academic Issues",
    "Campus Infrastructure",
    "Dining Services",
    "Hostel Services",
    "Transportation",
    "Library Services",
    "IT Services",
    "Sports Facilities",
    "Administrative Issues",
    "Safety & Security",
    "Financial Services",
    "Other",
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "in_progress": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <Clock className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    submitComplaintMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* <Navigation /> */}
        <div className="flex items-center justify-center py-12">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Authentication Required
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please sign in to submit a complaint or suggestion
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* <Navigation /> */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Complaint Submitted Successfully
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Thank you for your feedback. Your complaint has been submitted {formData.isAnonymous ? 'anonymously' : ''} 
                and will be reviewed by our administrative team. You can expect a response within 3-5 business days.
              </p>
              <div className="space-y-2">
                <Button onClick={() => setIsSubmitted(false)} className="w-full">
                  Submit Another Complaint
                </Button>
                <Button variant="outline" onClick={() => window.history.back()} className="w-full">
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* <Navigation /> */}
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <span>Submit Feedback</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
              Your voice matters. Submit complaints, suggestions, or feedback to help us improve campus services. 
              All submissions are treated confidentially and can be made anonymously.
            </p>
          </div>
        </div>

        {/* My Complaints Sidebar - Fixed Position */}
        {myComplaints && myComplaints.length > 0 && (
          <div className="hidden lg:block fixed left-4 top-24 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                My Complaints
              </h2>
              <div className="space-y-3">
                {myComplaints.map((complaint: any) => (
                  <div key={complaint.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">{complaint.category}</Badge>
                        <Badge className={`text-xs ${getStatusColor(complaint.status)}`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(complaint.status)}
                            <span className="capitalize">{complaint.status.replace('_', ' ')}</span>
                          </div>
                        </Badge>
                        {complaint.isAnonymous && (
                          <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                        {complaint.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Complaints Section */}
        {myComplaints && myComplaints.length > 0 && (
          <div className="lg:hidden mb-8">
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsMobileHistoryOpen(!isMobileHistoryOpen)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>My Complaints ({myComplaints.length})</span>
                  </CardTitle>
                  {isMobileHistoryOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
              {isMobileHistoryOpen && (
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {myComplaints.slice(0, 3).map((complaint: any) => (
                      <div key={complaint.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">{complaint.category}</Badge>
                            <Badge className={`text-xs ${getStatusColor(complaint.status)}`}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(complaint.status)}
                                <span className="capitalize">{complaint.status.replace('_', ' ')}</span>
                              </div>
                            </Badge>
                            {complaint.isAnonymous && (
                              <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                            {complaint.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {myComplaints.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{myComplaints.length - 3} more complaints
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Complaint Form - Stays in Original Position */}
        <div className="max-w-2xl mx-auto">
          {/* Privacy Notice */}
          <Alert className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Privacy Protection:</strong> Your submission is secure and confidential. 
              Anonymous submissions cannot be traced back to you. We take all feedback seriously 
              and work to address legitimate concerns promptly.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Complaint/Suggestion Form</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    <div>
                      <Label htmlFor="isAnonymous" className="font-medium">
                        Submit Anonymously
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your identity will be completely protected
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="isAnonymous"
                    checked={formData.isAnonymous}
                    onCheckedChange={(checked) => handleChange("isAnonymous", checked)}
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the category that best describes your concern" />
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

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Please provide a detailed description of your complaint or suggestion. Include specific incidents, dates, locations, and any other relevant information that will help us understand and address your concern."
                    required
                    rows={6}
                    className="min-h-[150px]"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Be specific and factual. The more details you provide, the better we can assist you.
                  </p>
                </div>

                {/* File Attachment */}
                <div>
                  <Label htmlFor="attachment">Supporting Evidence (optional)</Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="attachment"
                      value={formData.attachment}
                      onChange={(e) => handleChange("attachment", e.target.value)}
                      placeholder="URL to image, document, or other supporting evidence"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    You can provide a link to images, documents, or other evidence that supports your complaint.
                  </p>
                </div>

                {/* Submission Guidelines */}
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Before Submitting:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Ensure your concern hasn't been resolved through direct communication</li>
                      <li>• Provide constructive feedback rather than personal attacks</li>
                      <li>• Include specific details to help us investigate effectively</li>
                      <li>• Remember that false or malicious complaints may face consequences</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitComplaintMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {submitComplaintMutation.isPending ? "Submitting..." : "Submit Complaint"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="max-w-2xl mx-auto mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Alternative Contact Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">For Urgent Issues:</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Campus Security: +91-XXX-XXX-XXXX (24/7)
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Student Affairs Office:</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Email: studentaffairs@uu.ac.in<br />
                    Phone: +91-XXX-XXX-XXXX<br />
                    Office Hours: Monday-Friday, 9:00 AM - 5:00 PM
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Anonymous Tip Line:</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    For sensitive matters: tips@uu.ac.in
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

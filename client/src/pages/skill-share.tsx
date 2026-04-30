import { useState, useEffect, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Users, MessageCircle, Search, Filter, X, Smile, Plus, GraduationCap, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../contexts/auth-context";
import { ChatContext } from "../App";
import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import { useRef } from "react";
import { useToast } from "../hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { apiRequest } from "../lib/queryClient";
import ChatWindow from "../components/chat-window";

export default function SkillShare() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState({
    skillTitle: "",
    description: "",
    isHelpRequest: false,
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sentRequests, setSentRequests] = useState<number[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<any[]>([]);
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const [sidebarUserInfo, setSidebarUserInfo] = useState<{ [userId: number]: { fullName: string; avatar?: string } }>({});
  
  // Simple local state for chat functionality
  const [localShowChats, setLocalShowChats] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get ChatContext (but don't rely on it working)
  const chatContextValue = useContext(ChatContext);
  console.log('SkillShare - ChatContext __debug:', chatContextValue.__debug);
  
  // Use simple local state approach
  const showChats = localShowChats;
  const setShowChats = setLocalShowChats;
  
  console.log('SkillShare - Using local chat state, showChats:', showChats);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: skills, isLoading } = useQuery({
    queryKey: ["/api/skills"],
  });

  useEffect(() => {
    if (!user) return;
    fetch("/api/connection-requests/sent", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => setSentRequests(data.map((r: any) => r.skillId)));
    // Debug: Fetch and log notifications for the current user
    fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched notifications for user', user.id, data);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/connection-requests/accepted", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Skill Share - Accepted connections:', data);
        setAcceptedConnections(data);
      });
  }, [user, refreshKey]);

  // Open chat modal if /chat/:id route
  useEffect(() => {
    if (params.id && acceptedConnections.length > 0) {
      const conn = acceptedConnections.find((c: any) => String(c.id) === params.id);
      if (conn) {
        setShowChats(true);
        setSelectedConnection(conn);
      }
    }
  }, [params.id, acceptedConnections, setShowChats]);

  // Fetch sidebar user info for all accepted connections
  useEffect(() => {
    const idsToFetch = acceptedConnections
      .map((conn: any) => (conn.senderId === user?.id ? conn.receiverId : conn.senderId))
      .filter((id: number, idx: number, arr: number[]) => arr.indexOf(id) === idx && !sidebarUserInfo[id]);
    if (idsToFetch.length === 0) return;
    idsToFetch.forEach((id: number) => {
      fetch(`/api/users/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setSidebarUserInfo((prev) => ({ ...prev, [id]: { fullName: data.username || data.fullName || "User", avatar: data.avatar } }));
        });
    });
  }, [acceptedConnections, user]);

  // Debug: Monitor showChats changes
  useEffect(() => {
    console.log('Skill Share - showChats changed to:', showChats);
  }, [showChats]);

  // Auto-refresh messages every 10 seconds when a connection is selected
  useEffect(() => {
    if (!selectedConnection) return;
    
    const fetchMessages = () => {
      setIsLoadingMessages(true);
      fetch(`/api/messages/${selectedConnection.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setMessages(data);
          setIsLoadingMessages(false);
        })
        .catch(() => setIsLoadingMessages(false));
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [selectedConnection]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Enhanced send message function
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConnection) return;
    
    fetch(`/api/messages/${selectedConnection.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ content: newMessage }),
    })
      .then((res) => res.json())
      .then((msg) => {
        setMessages((prev: any) => [...prev, msg]);
        setNewMessage("");
        setShowEmoji(false);
      })
      .catch((error) => {
        console.error("Failed to send message:", error);
      });
  };

  // Enhanced key press handler
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newMessage.trim()) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Emoji picker handler
  const onEmojiClick = (emojiData: any) => {
    setNewMessage((prev: string) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const createSkillMutation = useMutation({
    mutationFn: async (skillData: typeof formData & { userId: number }) => {
      const response = await apiRequest("POST", "/api/skills", skillData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setIsCreateDialogOpen(false);
      setFormData({ skillTitle: "", description: "", isHelpRequest: false });
      toast({
        title: "Success",
        description: "Skill post created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create skill post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.skillTitle.trim() || !formData.description.trim()) {
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
        description: "You must be logged in to share a skill.",
        variant: "destructive",
      });
      return;
    }

    createSkillMutation.mutate({ ...formData, userId: user.id });
  };

  const handleChange = (field: string, value: string | boolean) => {
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

  // Ensure skills is always an array
  const safeSkills = Array.isArray(skills) ? skills : [];

  const filteredSkills = safeSkills.filter((skill: any) => {
    const matchesSearch = skill.skillTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || 
                      (activeTab === "offering" && !skill.isHelpRequest) ||
                      (activeTab === "seeking" && skill.isHelpRequest);
    return matchesSearch && matchesTab;
  });

  const offeringSkills = safeSkills.filter((skill: any) => !skill.isHelpRequest);
  const seekingSkills = safeSkills.filter((skill: any) => skill.isHelpRequest);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* <Navigation /> */}
      {showChats && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex justify-end" onClick={() => setShowChats(false)}>
          <div className="w-96 h-full bg-white dark:bg-gray-800 border-l flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chats</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChats(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Connection List */}
          <div className="flex-1 overflow-y-auto p-4">
            {acceptedConnections.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">No chat connections yet</p>
                <p className="text-sm">Connect with others to start chatting</p>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Connections</h3>
                {acceptedConnections.map((conn: any) => {
                  const otherUserId = conn.senderId === user?.id ? conn.receiverId : conn.senderId;
                  const otherUser = sidebarUserInfo[otherUserId] || {};
                  return (
                    <div
                      key={conn.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        selectedConnection?.id === conn.id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : ''
                      }`}
                      onClick={() => setSelectedConnection(conn)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUser?.avatar} />
                        <AvatarFallback className="bg-gray-500 text-white">
                          {(otherUser?.fullName || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-gray-900 dark:text-gray-100">
                          {otherUser?.fullName || "User"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          Click to start chatting
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enhanced Message Interface */}
          {selectedConnection && (
            <div className="flex flex-col h-full border-t border-gray-200 dark:border-gray-700">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConnection(null)}
                    className="text-gray-500 hover:text-blue-500"
                  >
                    ←
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={sidebarUserInfo[selectedConnection.senderId === user?.id ? selectedConnection.receiverId : selectedConnection.senderId]?.avatar} />
                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                      {(sidebarUserInfo[selectedConnection.senderId === user?.id ? selectedConnection.receiverId : selectedConnection.senderId]?.fullName || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {sidebarUserInfo[selectedConnection.senderId === user?.id ? selectedConnection.receiverId : selectedConnection.senderId]?.fullName || "User"}
                  </span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900" style={{ minHeight: 200 }}>
                {isLoadingMessages ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-lg">No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg: any) => {
                    const isCurrentUser = msg.senderId === user?.id;
                    const messageAuthor = sidebarUserInfo[msg.senderId] || {};
                    const authorName = messageAuthor.fullName || "Unknown User";
                    
                    return (
                      <div key={msg.id} className={`mb-3 flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                        {!isCurrentUser && (
                          <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                            <AvatarImage src={messageAuthor.avatar} />
                            <AvatarFallback className="bg-gray-500 text-white text-sm">
                              {authorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`px-4 py-2 rounded-2xl shadow-md text-sm max-w-xs break-words ${
                          isCurrentUser 
                            ? "bg-blue-500 text-white" 
                            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        }`} style={{ 
                          borderBottomRightRadius: isCurrentUser ? 4 : 16, 
                          borderBottomLeftRadius: isCurrentUser ? 16 : 4 
                        }}>
                          {!isCurrentUser && (
                            <div className="text-xs font-medium opacity-75 mb-1">
                              {authorName}
                            </div>
                          )}
                          <div>{msg.content || msg.message || "No content"}</div>
                          {msg.createdAt && (
                            <div className="text-xs opacity-75 mt-1">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                        {isCurrentUser && (
                          <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
                            <AvatarImage src={user?.avatar} alt={user?.fullName || user?.username || "You"} />
                            <AvatarFallback className="bg-blue-500 text-white text-sm">
                              {(user?.fullName || user?.username || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Message Input */}
              <div className="flex items-center border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2 text-gray-500 hover:text-blue-500"
                  onClick={() => setShowEmoji(!showEmoji)}
                >
                  <Smile className="h-5 w-5" />
                </Button>
                {showEmoji && (
                  <div className="absolute bottom-12 left-2 z-50">
                    <EmojiPicker 
                      onEmojiClick={onEmojiClick} 
                      theme={document.documentElement.classList.contains('dark') ? 'dark' as EmojiTheme : 'light' as EmojiTheme} 
                    />
                  </div>
                )}
                <Input
                  className="flex-1 mr-2 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Send
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Skill Share</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Connect with peers to offer or seek help, share skills, and collaborate on projects
              </p>
            </div>
            {user && (
              <div className="flex gap-2">
                {/* Test button for debugging ChatContext */}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('TEST BUTTON - Current context:', { showChats, setShowChats });
                    console.log('TEST BUTTON - Forcing showChats to true');
                    setShowChats(true);
                  }}
                >
                  Test Chat Context
                </Button>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Share Skill
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Share Your Skills or Request Help</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isHelpRequest"
                          checked={formData.isHelpRequest}
                          onCheckedChange={(checked) => handleChange("isHelpRequest", checked)}
                        />
                        <Label htmlFor="isHelpRequest">
                          {formData.isHelpRequest ? "I'm seeking help to learn this skill" : "I can teach this skill"}
                        </Label>
                      </div>

                      <div>
                        <Label htmlFor="skillTitle">Skill Name *</Label>
                        <Input
                          id="skillTitle"
                          value={formData.skillTitle}
                          onChange={(e) => handleChange("skillTitle", e.target.value)}
                          placeholder="e.g., Python Programming, Photoshop, Guitar"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleChange("description", e.target.value)}
                          placeholder={
                            formData.isHelpRequest 
                              ? "Describe what you want to learn and your current level..."
                              : "Describe your expertise, what you can teach, and how others can reach you..."
                          }
                          required
                          rows={4}
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
                          disabled={createSkillMutation.isPending}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          {createSkillMutation.isPending ? "Posting..." : "Post"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* You can add a filter dropdown here if needed */}
          </div>
        </div>
        {/* Skills Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading skills...</div>
          </div>
        ) : filteredSkills && filteredSkills.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill: any) => {
              const isOwner = user?.id && skill.author && user.id === skill.author.id;
              const alreadySent = sentRequests && sentRequests.includes(skill.id);
              const safeAcceptedConnections = Array.isArray(acceptedConnections) ? acceptedConnections : [];
              const acceptedConn = safeAcceptedConnections.find((c: any) => (c.skillId === skill.id && (c.senderId === user?.id || c.receiverId === user?.id)));
              return (
                <Card key={skill.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className={skill.isHelpRequest ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}>
                          {skill.isHelpRequest ? "Seeking Help" : "Offering Help"}
                        </Badge>
                        <div className="flex items-center space-x-2 mt-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={skill.author?.avatar} />
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {getInitials(skill.author?.fullName || "Unknown")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {skill.author?.fullName}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-2 line-clamp-2">
                          {skill.skillTitle}
                        </h3>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                      {skill.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto mb-2">
                      <span />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(skill.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" className="w-full" disabled={isOwner || alreadySent || acceptedConn} onClick={() => {
                        fetch("/api/connection-requests", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                          },
                          body: JSON.stringify({ receiverId: skill.userId, skillId: skill.id }),
                        })
                          .then((res) => {
                            if (!res.ok) throw new Error("Failed to send request");
                            setSentRequests((prev: number[]) => [...prev, skill.id]);
                            alert("Connection request sent!");
                          })
                          .catch(() => alert("Failed to send request"));
                      }}>
                        <Users className="h-4 w-4 mr-2" />
                        {isOwner ? "Your Skill" : alreadySent ? "Request Sent" : acceptedConn ? "Connected" : "Connect"}
                      </Button>
                      {/* Restore Message button if acceptedConn exists */}
                      {acceptedConn && (
                        <Button size="sm" variant="default" className="w-full" onClick={(e) => {
                          // Prevent default behavior and stop event propagation
                          e.preventDefault();
                          e.stopPropagation();
                          
                          console.log('=== MESSAGE BUTTON CLICKED ===');
                          console.log('acceptedConn:', acceptedConn);
                          console.log('ChatContext functions available:');
                          console.log('- setShowChats:', typeof setShowChats);
                          console.log('- showChats current value:', showChats);
                          
                          // Try the context approach first
                          setShowChats(true);
                        }}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? "No skills found matching your criteria" : "No skills posted yet"}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

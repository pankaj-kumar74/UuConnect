import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Moon, 
  Sun, 
  Search, 
  Menu,
  Home,
  FileText,
  Megaphone,
  MessageCircle,
  Briefcase,
  Users,
  Heart,
  Star,
  AlertTriangle,
  Calendar,
  User,
  LogOut,
  Settings,
  Bell
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SearchModal from "./search-modal";
import { useContext } from "react";
import { ChatContext } from "../App";

export default function Navigation() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifDropdownRef = useRef(null);
  const [senderInfo, setSenderInfo] = useState<{ [userId: number]: { fullName: string; avatar?: string } }>({});
  const [receiverInfo, setReceiverInfo] = useState<{ [userId: number]: { fullName: string; avatar?: string } }>({});
  const chatContext = useContext(ChatContext);
  const { setShowChats, showChats, setActiveChatConnection } = chatContext || {};

  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data as any[]);
          setUnreadCount((data as any[]).filter((n: any) => !n.isRead).length);
        } else {
          setNotifications([]);
          setUnreadCount(0);
          // Optionally, handle/display the error message from data.message
        }
      });
  }, [user, notifOpen]);

  // Fetch sender info for connection request notifications
  useEffect(() => {
    const senderIds = notifications
      .filter((notif: any) => notif.type === "connection_request" && notif.data && notif.data.senderId)
      .map((notif: any) => notif.data.senderId)
      .filter((id: number, idx: number, arr: number[]) => arr.indexOf(id) === idx && !senderInfo[id]);
    if (senderIds.length === 0) return;
    senderIds.forEach((id: number) => {
      fetch(`/api/users/${id}`)
        .then((res) => res.json())
        .then((user) => {
          setSenderInfo((prev) => ({ ...prev, [id]: { fullName: user.fullName, avatar: user.avatar } }));
        });
    });
  }, [notifications]);

  // Fetch receiver info for connection_accepted notifications
  useEffect(() => {
    const receiverIds = notifications
      .filter((notif: any) => notif.type === "connection_accepted" && notif.data && notif.data.receiverId)
      .map((notif: any) => notif.data.receiverId)
      .filter((id: number, idx: number, arr: number[]) => arr.indexOf(id) === idx && !receiverInfo[id]);
    if (receiverIds.length === 0) return;
    receiverIds.forEach((id: number) => {
      fetch(`/api/users/${id}`)
        .then((res) => res.json())
        .then((user) => {
          setReceiverInfo((prev) => ({ ...prev, [id]: { fullName: user.fullName, avatar: user.avatar } }));
        });
    });
  }, [notifications]);

  const markAsRead = (id: any) => {
    fetch(`/api/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then(() => {
      setNotifications((prev: any[]) => prev.map((n: any) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
    });
  };

  const handleConnectionAction = (notif: any, action: any) => {
    fetch(`/api/connection-requests/${notif.data.requestId}/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ action }),
    }).then(() => {
      markAsRead(notif.id);
    });
  };

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/blogs", label: "Blogs", icon: FileText },
    { href: "/announcements", label: "Announcements", icon: Megaphone },
    { href: "/complaints", label: "Complaints", icon: AlertTriangle },
    { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  ];

  const moreItems = [
    { href: "/qna", label: "Ask Senior", icon: MessageCircle },
    { href: "/skill-share", label: "Skill Sharing", icon: Users },
    { href: "/mental-health", label: "Mental Health", icon: Heart },
    { href: "/reviews", label: "Reviews", icon: Star },
    { href: "/calendar", label: "Calendar", icon: Calendar },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  // Remove the authentication requirement for navigation - show navigation for all users

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex-shrink-0">
                <div>
                  <h1 className="text-2xl font-bold text-primary">UUConnect</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Uttaranchal University</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={location === item.href ? "default" : "ghost"}
                    className="font-medium"
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="font-medium">
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {moreItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center space-x-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={toggleTheme} className="flex items-center space-x-2">
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span>Toggle Theme</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative p-2">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto" ref={notifDropdownRef}>
                  {/* Connection Requests Section */}
                  {notifications.some((notif) => notif.type === "connection_request") && (
                    <div className="p-2 border-b bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                      <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-2">Requests</div>
                      {notifications.filter((notif) => notif.type === "connection_request").map((notif) => (
                        <div key={notif.id} className={`flex items-center justify-between p-2 mb-2 rounded-lg ${!notif.isRead ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}>
                          <div className="flex items-center gap-3">
                            {/* Avatar or Initials */}
                            {notif.data && notif.data.senderId && (
                              <Link href={`/profile/${notif.data.senderId}`}>
                                <Avatar className="h-8 w-8">
                                  {senderInfo[notif.data.senderId]?.avatar && senderInfo[notif.data.senderId].avatar.trim() !== "" ? (
                                    <AvatarImage src={senderInfo[notif.data.senderId].avatar} alt={senderInfo[notif.data.senderId].fullName} />
                                  ) : (
                                    <AvatarFallback>{getInitials(senderInfo[notif.data.senderId]?.fullName || "Unknown")}</AvatarFallback>
                                  )}
                                </Avatar>
                              </Link>
                            )}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {senderInfo[notif.data?.senderId]?.fullName || "New Connection Request"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">wants to connect</div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {!notif.isRead ? (
                              <>
                                <Button size="sm" onClick={() => handleConnectionAction(notif, "accept")}>Accept</Button>
                                <Button size="sm" variant="outline" onClick={() => handleConnectionAction(notif, "decline")}>Reject</Button>
                              </>
                            ) : (
                              <Link href={notif.data && notif.data.requestId ? `/chat/${notif.data.requestId}` : "#"}>
                                <Button size="sm" variant="default">Message</Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Sent Requests Section */}
                  {notifications.some((notif) => notif.type === "connection_accepted") && (
                    <div className="p-2 border-b bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                      <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-2">Sent Requests</div>
                      {notifications.filter((notif) => notif.type === "connection_accepted").map((notif) => (
                        <div key={notif.id} className={`flex items-center justify-between p-2 mb-2 rounded-lg ${!notif.isRead ? "bg-green-50 dark:bg-green-900/30" : ""}`}>
                          <div className="flex items-center gap-3">
                            {/* Avatar or Initials for receiver */}
                            {notif.data && notif.data.receiverId && (
                              <Link href={`/profile/${notif.data.receiverId}`}>
                                <Avatar className="h-8 w-8">
                                  {receiverInfo[notif.data.receiverId]?.avatar && receiverInfo[notif.data.receiverId]?.avatar.trim() !== "" ? (
                                    <AvatarImage src={receiverInfo[notif.data.receiverId]?.avatar} alt={receiverInfo[notif.data.receiverId]?.fullName || "User"} />
                                  ) : (
                                    <AvatarFallback>{getInitials(receiverInfo[notif.data.receiverId]?.fullName || "Unknown")}</AvatarFallback>
                                  )}
                                </Avatar>
                              </Link>
                            )}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {receiverInfo[notif.data?.receiverId]?.fullName || "Request Accepted"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">accepted your connection request</div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Link href={notif.data && notif.data.requestId ? `/chat/${notif.data.requestId}` : "#"}>
                              <Button size="sm" variant="default">Message</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Other Notifications */}
                  {notifications.filter((notif) => notif.type !== "connection_request").length === 0 && notifications.filter((notif) => notif.type === "connection_request").length === 0 && (
                    <div className="p-2 text-sm text-gray-500 dark:text-gray-400">No notifications</div>
                  )}
                  {notifications.filter((notif) => notif.type !== "connection_request").map((notif) => (
                    <div key={notif.id} className={`p-2 border-b last:border-0 ${!notif.isRead ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}>
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">{notif.message}</div>
                        {!notif.isRead && (
                          <Button size="sm" variant="ghost" onClick={() => markAsRead(notif.id)}>Mark as read</Button>
                        )}
                      </div>
                      {/* Add more notification types here if needed */}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Chat Icon Button */}
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2"
                onClick={() => {
                  if (setShowChats) {
                    setShowChats(true);
                  }
                }}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>

              {/* Search */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                className="p-2"
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* User Profile or Login */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={user.avatar && user.avatar.trim() !== "" ? user.avatar : undefined} 
                          alt={user.fullName}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block font-medium">{user.fullName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user.id}`} className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center space-x-2">
                          <Settings className="h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">
                      Register
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden p-2">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col space-y-4 mt-8">
                    {/* Chat Button for Mobile */}
                    {user && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          if (setShowChats) {
                            setShowChats(true);
                          }
                          setIsMobileMenuOpen(false);
                          // Force a small delay to ensure the component mounts before refreshing
                          setTimeout(() => {
                            const event = new CustomEvent('refreshChatConnections');
                            window.dispatchEvent(event);
                          }, 100);
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    )}
                    {[...navigationItems, ...moreItems].map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={location === item.href ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

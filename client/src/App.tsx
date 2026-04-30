import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./contexts/auth-context";
import NotFound from "@/pages/not-found";
import { createContext, useState, useEffect } from "react";
import SkillShare from "@/pages/skill-share";
import SkillShareChatRoot from "./pages/skill-share-chat-root";

// Import pages
import Home from "@/pages/home";
import Blogs from "@/pages/blogs";
import BlogDetail from "@/pages/blog-detail";
import AddBlog from "@/pages/add-blog";
import Announcements from "@/pages/announcements";
import QnA from "@/pages/qna";
import Opportunities from "@/pages/opportunities";
import MentalHealth from "@/pages/mental-health";
import Reviews from "@/pages/reviews";
import Complaints from "@/pages/complaints";
import Calendar from "@/pages/calendar";
import Profile from "@/pages/profile";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AdminDashboard from "@/pages/admin/dashboard";
import OpportunityDetail from "@/pages/opportunity-detail";
import Navigation from "@/components/navigation";

export const ChatContext = createContext<{ 
  showChats: boolean; 
  setShowChats: (v: boolean) => void;
  activeChatConnection: any;
  setActiveChatConnection: (conn: any) => void;
  __debug?: string;
}>({ 
  showChats: false, 
  setShowChats: () => {},
  activeChatConnection: null,
  setActiveChatConnection: () => {},
  __debug: "DEFAULT"
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/blogs" component={Blogs} />
      <Route path="/blogs/:id" component={BlogDetail} />
      <Route path="/add-blog" component={AddBlog} />
      <Route path="/announcements" component={Announcements} />
      <Route path="/qna" component={QnA} />
      <Route path="/opportunities" component={Opportunities} />
      <Route path="/opportunities/:id" component={OpportunityDetail} />
      <Route path="/skill-share" component={SkillShare} />
      <Route path="/chat/:id" component={SkillShare} />
      <Route path="/mental-health" component={MentalHealth} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/complaints" component={Complaints} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/profile/:id?" component={Profile} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showChats, setShowChats] = useState(false);
  const [activeChatConnection, setActiveChatConnection] = useState<any>(null);

  // Set showChats state
  const setShowChatsWithLog = (value: boolean) => {
    console.log('App.tsx - setShowChats called with:', value);
    setShowChats(value);
  };

  // Set activeChatConnection with logging
  const setActiveChatConnectionWithLog = (conn: any) => {
    console.log('App.tsx - setActiveChatConnection called with:', conn);
    setActiveChatConnection(conn);
  };

  // Debug the context values
  const contextValue = {
    showChats,
    setShowChats: setShowChatsWithLog,
    activeChatConnection,
    setActiveChatConnection: setActiveChatConnectionWithLog,
    __debug: "PROVIDER"
  };

  console.log('App.tsx - ChatContext provider values:', contextValue);

  // Expose setShowChats globally for testing
  if (typeof window !== 'undefined') {
    (window as any).openChat = () => {
      setShowChats(true);
    };
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <ChatContext.Provider value={contextValue}>
              {/* Move Navigation here so it always has context */}
              <Navigation />
              <Router />
              {/* Global Chat Sidebar/Window */}
              <SkillShareChatRoot />
            </ChatContext.Provider>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

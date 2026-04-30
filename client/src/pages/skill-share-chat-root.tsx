import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import ChatWindow from "../components/chat-window";
import { useContext } from "react";
import { ChatContext } from "../App";

console.log("SkillShareChatRoot rendered");

// Simple global chat component that always renders when showChats is true
export default function SkillShareChatRoot() {
  const { user } = useAuth();
  const { showChats, setShowChats, activeChatConnection, setActiveChatConnection } = useContext(ChatContext);
  const [acceptedConnections, setAcceptedConnections] = useState<any[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatConnection, setChatConnection] = useState<any>(null);
  const [sidebarUserInfo, setSidebarUserInfo] = useState<{ [userId: number]: { fullName: string; avatar?: string } }>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Temporary test: Force show the chat window for debugging
  const forceShow = false; // Set to false to use normal state management

  // Expose global functions for testing
  if (typeof window !== 'undefined') {
    (window as any).forceOpenChat = (connection?: any) => {
      console.log('FORCE OPEN CHAT called with:', connection);
      setShowChats(true);
      if (connection) {
        setChatConnection(connection);
        setChatOpen(true);
      }
    };
    
    (window as any).debugChatState = () => {
      console.log('=== CHAT DEBUG STATE ===');
      console.log('showChats:', showChats);
      console.log('chatOpen:', chatOpen);
      console.log('chatConnection:', chatConnection);
      console.log('acceptedConnections:', acceptedConnections);
      console.log('activeChatConnection:', activeChatConnection);
      console.log('========================');
    };
  }

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (!user) return;
    fetch("/api/connection-requests/accepted", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setAcceptedConnections(data);
      })
      .catch((error) => {
        console.error('Error fetching accepted connections:', error);
      });
  }, [user, refreshKey]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('refreshChatConnections', handleRefresh);
    return () => {
      window.removeEventListener('refreshChatConnections', handleRefresh);
    };
  }, []);

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

  // Auto-open chat when activeChatConnection is set
  useEffect(() => {
    console.log('activeChatConnection changed:', activeChatConnection);
    console.log('acceptedConnections:', acceptedConnections);
    
    if (activeChatConnection) {
      // Find the connection in acceptedConnections
      const conn = acceptedConnections.find((c: any) => c.id === activeChatConnection.id);
      console.log('Found connection:', conn);
      
      if (conn) {
        setChatConnection(conn);
        setChatOpen(true);
        console.log('Chat should be opening now');
        // Don't reset activeChatConnection immediately - let it stay for debugging
        // setActiveChatConnection(null);
      } else {
        // If we can't find the connection, try using the activeChatConnection directly
        setChatConnection(activeChatConnection);
        setChatOpen(true);
        console.log('Using activeChatConnection directly');
      }
    }
  }, [activeChatConnection, acceptedConnections]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Now we can do conditional returns after all hooks are called
  if (!showChats && !forceShow) {
    return <div style={{ display: 'none' }}>Chat component mounted but hidden</div>;
  }

  if (!user) {
    return <div style={{ display: 'none' }}>Chat component mounted but no user</div>;
  }

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={() => setShowChats(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md h-[80vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Chats</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChats(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-4">
            {acceptedConnections.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold text-red-500">No chat connections yet</p>
                <p className="text-sm">Connect with others to start chatting</p>
                <p className="text-xs text-blue-500 mt-2">Chat window is working! Just need connections.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {acceptedConnections.map((connection: any) => {
                  const otherUserId = connection.senderId === user?.id ? connection.receiverId : connection.senderId;
                  const otherUser = sidebarUserInfo[otherUserId];
                  return (
                    <div
                      key={connection.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setChatConnection(connection);
                        setChatOpen(true);
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUser?.avatar} />
                        <AvatarFallback>
                          {otherUser?.fullName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {otherUser?.fullName || "User"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          Click to start chatting
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        {chatOpen && chatConnection && (
          <ChatWindow
            connection={chatConnection}
            onClose={() => setChatOpen(false)}
            user={user}
          />
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex justify-end" onClick={() => setShowChats(false)}>
      {/* Chat Sidebar */}
      <div className="w-96 h-full bg-white dark:bg-gray-800 border-l flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Chats</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChats(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4">
          {acceptedConnections.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold text-red-500">No chat connections yet</p>
              <p className="text-sm">Connect with others to start chatting</p>
              <p className="text-xs text-blue-500 mt-2">Chat window is working! Just need connections.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {acceptedConnections.map((connection: any) => {
                const otherUserId = connection.senderId === user?.id ? connection.receiverId : connection.senderId;
                const otherUser = sidebarUserInfo[otherUserId];
                return (
                  <div
                    key={connection.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setChatConnection(connection);
                      setChatOpen(true);
                    }}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherUser?.avatar} />
                      <AvatarFallback>
                        {otherUser?.fullName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {otherUser?.fullName || "User"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Click to start chatting
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white dark:bg-gray-800">
        {chatOpen && chatConnection ? (
          <ChatWindow
            connection={chatConnection}
            onClose={() => setChatOpen(false)}
            user={user}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
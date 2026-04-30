import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import { Smile } from "lucide-react";

console.log("ChatWindow rendered");

export default function ChatWindow({ connection, onClose, user }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<{ [userId: number]: { fullName: string; avatar?: string } }>({});
  const [newMsg, setNewMsg] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/messages/${connection.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => setMessages(data));
    const interval = setInterval(() => {
      fetch(`/api/messages/${connection.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => res.json())
        .then((data) => setMessages(data));
    }, 10000);
    return () => clearInterval(interval);
  }, [connection.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch user info for all message senders
  useEffect(() => {
    const senderIds = messages
      .map((msg: any) => msg.senderId)
      .filter((id: number, idx: number, arr: number[]) => arr.indexOf(id) === idx && !userInfo[id]);
    if (senderIds.length === 0) return;
    senderIds.forEach((id: number) => {
      fetch(`/api/users/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setUserInfo((prev) => ({ ...prev, [id]: { fullName: data.username || data.fullName || "User", avatar: data.avatar } }));
        });
    });
  }, [messages]);

  const sendMessage = () => {
    if (!newMsg.trim()) return;
    fetch(`/api/messages/${connection.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ content: newMsg }),
    })
      .then((res) => res.json())
      .then((msg) => {
        setMessages((prev: any) => [...prev, msg]);
        setNewMsg("");
      });
  };

  // Emoji picker handler
  const onEmojiClick = (emojiData: any) => {
    setNewMsg((prev: string) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button onClick={onClose} className="text-gray-500 hover:text-blue-500 focus:outline-none mr-2">←</button>
          {(() => {
            const otherUserId = connection.senderId === user.id ? connection.receiverId : connection.senderId;
            const otherUser = userInfo[otherUserId] || {};
            return (
              <>
                <Avatar className="h-8 w-8">
                  {otherUser.avatar && otherUser.avatar.trim() !== "" ? (
                    <AvatarImage src={otherUser.avatar} alt={otherUser.fullName || "User"} />
                  ) : (
                    <AvatarFallback>{(otherUser.fullName || "U").charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{otherUser.fullName || "User"}</span>
              </>
            );
          })()}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-b-lg" style={{ minHeight: 200 }}>
        {messages.map((msg: any) => {
          const isMe = msg.senderId === user.id;
          const info = userInfo[msg.senderId] || {};
          return (
            <div key={msg.id} className={`mb-2 flex ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <Avatar className="h-8 w-8 mr-2">
                  {info.avatar && info.avatar.trim() !== "" ? (
                    <AvatarImage src={info.avatar} alt={info.fullName || "User"} />
                  ) : (
                    <AvatarFallback>{(info.fullName || "U").charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
              )}
              <div className={`px-4 py-2 rounded-2xl shadow-md text-sm max-w-xs break-words ${isMe ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"}`} style={{ borderBottomRightRadius: isMe ? 0 : 16, borderBottomLeftRadius: isMe ? 16 : 0 }}>
                {msg.content}
              </div>
              {isMe && (
                <Avatar className="h-8 w-8 ml-2">
                  {user.avatar && user.avatar.trim() !== "" ? (
                    <AvatarImage src={user.avatar} alt={user.fullName || user.username || "You"} />
                  ) : (
                    <AvatarFallback>{(user.fullName || user.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* Chat input row with emoji picker */}
      <div className="flex items-center border-t border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-900 relative">
        <button
          type="button"
          className="mr-2 text-gray-500 hover:text-blue-500 focus:outline-none"
          onClick={() => setShowEmoji((v) => !v)}
        >
          <Smile className="h-6 w-6" />
        </button>
        {showEmoji && (
          <div className="absolute bottom-12 left-2 z-50">
            <EmojiPicker onEmojiClick={onEmojiClick} theme={document.documentElement.classList.contains('dark') ? 'dark' as EmojiTheme : 'light' as EmojiTheme} />
          </div>
        )}
        <input
          type="text"
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="Type a message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newMsg.trim()) sendMessage();
          }}
        />
        <Button onClick={sendMessage} disabled={!newMsg.trim()} size="sm">
          Send
        </Button>
      </div>
    </div>
  );
} 
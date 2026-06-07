import { 
  User, InsertUser,
  Blog, InsertBlog,
  Comment, InsertComment,
  Announcement, InsertAnnouncement,
  QnaThread, InsertQnaThread,
  QnaReply, InsertQnaReply,
  Skill, InsertSkill,
  MentalHealthPost, InsertMentalHealthPost,
  Opportunity, InsertOpportunity,
  Review, InsertReview,
  Complaint, InsertComplaint,
  Notification, InsertNotification,
  ConnectionRequest, InsertConnectionRequest,
  Message, InsertMessage
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

  // Blogs
  getBlogs(limit?: number, offset?: number): Promise<Blog[]>;
  getBlog(id: number): Promise<Blog | undefined>;
  getBlogsByUser(userId: number): Promise<Blog[]>;
  getBlogsByCategory(category: string): Promise<Blog[]>;
  searchBlogs(query: string): Promise<Blog[]>;
  createBlog(blog: InsertBlog): Promise<Blog>;
  updateBlog(id: number, blog: Partial<Blog>): Promise<Blog | undefined>;
  deleteBlog(id: number): Promise<boolean>;
  likeBlog(blogId: number, userId: number): Promise<boolean>;
  unlikeBlog(blogId: number, userId: number): Promise<boolean>;
  isBlogLiked(blogId: number, userId: number): Promise<boolean>;

  // Comments
  getCommentsByBlog(blogId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;

  // Announcements
  getAnnouncements(limit?: number): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement & { userId: number }): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<boolean>;

  // Q&A
  getQnaThreads(limit?: number): Promise<QnaThread[]>;
  getQnaThread(id: number): Promise<QnaThread | undefined>;
  createQnaThread(thread: InsertQnaThread): Promise<QnaThread>;
  getQnaReplies(threadId: number): Promise<QnaReply[]>;
  createQnaReply(reply: InsertQnaReply): Promise<QnaReply>;

  // Skills
  getSkills(limit?: number): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  deleteSkill(id: number): Promise<boolean>;

  // Mental Health
  getMentalHealthPosts(limit?: number): Promise<MentalHealthPost[]>;
  createMentalHealthPost(post: InsertMentalHealthPost): Promise<MentalHealthPost>;

  // Opportunities
  getOpportunities(limit?: number): Promise<Opportunity[]>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  deleteOpportunity(id: number): Promise<boolean>;
  getOpportunity(id: number): Promise<Opportunity | undefined>;

  // Reviews
  getReviews(limit?: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Complaints
  getComplaints(): Promise<Complaint[]>;
  getComplaintsByUser(userId: number): Promise<Complaint[]>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaintStatus(id: number, status: string): Promise<boolean>;

  // Notifications
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(notificationId: number): Promise<boolean>;

  // Connection Requests
  createConnectionRequest(request: InsertConnectionRequest): Promise<ConnectionRequest>;
  getConnectionRequestsByReceiver(receiverId: number): Promise<ConnectionRequest[]>;
  getConnectionRequestsBySender(senderId: number): Promise<ConnectionRequest[]>;
  updateConnectionRequestStatus(requestId: number, status: 'pending' | 'accepted' | 'declined'): Promise<boolean>;

  // Messages (chat)
  getMessages(connectionRequestId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Utility
  resyncAllBlogCommentCounts(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private blogs: Map<number, Blog>;
  private comments: Map<number, Comment>;
  private blogLikes: Map<string, boolean>; // "blogId-userId" -> true
  private announcements: Map<number, Announcement>;
  private qnaThreads: Map<number, QnaThread>;
  private qnaReplies: Map<number, QnaReply>;
  private skills: Map<number, Skill>;
  private mentalHealthPosts: Map<number, MentalHealthPost>;
  private opportunities: Map<number, Opportunity>;
  private reviews: Map<number, Review>;
  private complaints: Map<number, Complaint>;
  private notifications: Map<number, Notification>;
  private connectionRequests: Map<number, ConnectionRequest>;
  private messages: Map<number, Message>;
  
  private currentUserId: number;
  private currentBlogId: number;
  private currentCommentId: number;
  private currentAnnouncementId: number;
  private currentQnaThreadId: number;
  private currentQnaReplyId: number;
  private currentSkillId: number;
  private currentMentalHealthPostId: number;
  private currentOpportunityId: number;
  private currentReviewId: number;
  private currentComplaintId: number;
  private currentNotificationId: number;
  private currentConnectionRequestId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.blogs = new Map();
    this.comments = new Map();
    this.blogLikes = new Map();
    this.announcements = new Map();
    this.qnaThreads = new Map();
    this.qnaReplies = new Map();
    this.skills = new Map();
    this.mentalHealthPosts = new Map();
    this.opportunities = new Map();
    this.reviews = new Map();
    this.complaints = new Map();
    this.notifications = new Map();
    this.connectionRequests = new Map();
    this.messages = new Map();
    
    this.currentUserId = 1;
    this.currentBlogId = 1;
    this.currentCommentId = 1;
    this.currentAnnouncementId = 1;
    this.currentQnaThreadId = 1;
    this.currentQnaReplyId = 1;
    this.currentSkillId = 1;
    this.currentMentalHealthPostId = 1;
    this.currentOpportunityId = 1;
    this.currentReviewId = 1;
    this.currentComplaintId = 1;
    this.currentNotificationId = 1;
    this.currentConnectionRequestId = 1;
    this.currentMessageId = 1;

    this.seedData();
  }

  private seedData() {
    // Create default admin user
    const admin: User = {
      id: this.currentUserId++,
      username: "admin",
      email: "admin@uu.ac.in",
      password: "$2b$10$xCNRKGzKnP6h3qgJIfGlZOoHvBLIzwuBG3C7aWjMmNEU7dQstldgS", // "admin123" hashed
      fullName: "Administrator",
      role: "admin",
      bio: "System Administrator",
      avatar: null,
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Create default student user
    const student: User = {
      id: this.currentUserId++,
      username: "student",
      email: "student@uu.ac.in",
      password: "$2b$10$y8N9w5iZKI6e7MW7ota.UusmJaSfLFmU1wu.M1iNM4Ri5p66A2o3K", // "student123" hashed
      fullName: "John Student",
      role: "student",
      bio: "Computer Science Student",
      avatar: null,
      createdAt: new Date(),
    };
    this.users.set(student.id, student);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      role: insertUser.role || "student",
      bio: insertUser.bio || null,
      avatar: insertUser.avatar || null,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Blogs
  async getBlogs(limit = 50, offset = 0): Promise<Blog[]> {
    const allBlogs = Array.from(this.blogs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
    return allBlogs;
  }

  async getBlog(id: number): Promise<Blog | undefined> {
    return this.blogs.get(id);
  }

  async getBlogsByUser(userId: number): Promise<Blog[]> {
    return Array.from(this.blogs.values()).filter(blog => blog.userId === userId);
  }

  async getBlogsByCategory(category: string): Promise<Blog[]> {
    return Array.from(this.blogs.values()).filter(blog => blog.category === category);
  }

  async searchBlogs(query: string): Promise<Blog[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.blogs.values()).filter(blog => 
      blog.title.toLowerCase().includes(searchTerm) ||
      blog.content.toLowerCase().includes(searchTerm) ||
      blog.excerpt.toLowerCase().includes(searchTerm)
    );
  }

  async createBlog(insertBlog: InsertBlog): Promise<Blog> {
    const blog: Blog = {
      ...insertBlog,
      id: this.currentBlogId++,
      image: insertBlog.image || null,
      likes: 0,
      commentsCount: 0,
      createdAt: new Date(),
    };
    this.blogs.set(blog.id, blog);
    return blog;
  }

  async updateBlog(id: number, updates: Partial<Blog>): Promise<Blog | undefined> {
    const blog = this.blogs.get(id);
    if (!blog) return undefined;
    
    const updatedBlog = { ...blog, ...updates };
    this.blogs.set(id, updatedBlog);
    return updatedBlog;
  }

  async deleteBlog(id: number): Promise<boolean> {
    return this.blogs.delete(id);
  }

  async likeBlog(blogId: number, userId: number): Promise<boolean> {
    const key = `${blogId}-${userId}`;
    const blog = this.blogs.get(blogId);
    if (!blog) return false;

    if (!this.blogLikes.has(key)) {
      this.blogLikes.set(key, true);
      blog.likes++;
      this.blogs.set(blogId, blog);
      return true;
    }
    return false;
  }

  async unlikeBlog(blogId: number, userId: number): Promise<boolean> {
    const key = `${blogId}-${userId}`;
    const blog = this.blogs.get(blogId);
    if (!blog) return false;

    if (this.blogLikes.has(key)) {
      this.blogLikes.delete(key);
      blog.likes = Math.max(0, blog.likes - 1);
      this.blogs.set(blogId, blog);
      return true;
    }
    return false;
  }

  async isBlogLiked(blogId: number, userId: number): Promise<boolean> {
    const key = `${blogId}-${userId}`;
    return this.blogLikes.has(key);
  }

  // Comments
  async getCommentsByBlog(blogId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.blogId === blogId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const comment: Comment = {
      ...insertComment,
      id: this.currentCommentId++,
      likes: 0,
      createdAt: new Date(),
    };
    this.comments.set(comment.id, comment);
    
    // Update blog comments count
    const blog = this.blogs.get(comment.blogId);
    if (blog) {
      blog.commentsCount++;
      this.blogs.set(blog.id, blog);
    }
    
    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    const comment = this.comments.get(id);
    if (!comment) return false;
    
    // Update blog comments count
    const blog = this.blogs.get(comment.blogId);
    if (blog) {
      blog.commentsCount = Math.max(0, blog.commentsCount - 1);
      this.blogs.set(blog.id, blog);
    }
    
    return this.comments.delete(id);
  }

  // Announcements
  async getAnnouncements(limit = 50): Promise<Announcement[]> {
    return Array.from(this.announcements.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement & { userId: number }): Promise<Announcement> {
    const announcement: Announcement = {
      id: this.currentAnnouncementId++,
      userId: insertAnnouncement.userId,
      title: insertAnnouncement.title,
      content: insertAnnouncement.content,
      category: insertAnnouncement.category,
      eventDate: insertAnnouncement.eventDate || null,
      createdAt: new Date(),
    };
    this.announcements.set(announcement.id, announcement);
    return announcement;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    return this.announcements.delete(id);
  }

  // Q&A
  async getQnaThreads(limit = 50): Promise<QnaThread[]> {
    return Array.from(this.qnaThreads.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getQnaThread(id: number): Promise<QnaThread | undefined> {
    return this.qnaThreads.get(id);
  }

  async createQnaThread(insertThread: InsertQnaThread): Promise<QnaThread> {
    const thread: QnaThread = {
      ...insertThread,
      id: this.currentQnaThreadId++,
      tags: insertThread.tags || null,
      answersCount: 0,
      createdAt: new Date(),
    };
    this.qnaThreads.set(thread.id, thread);
    return thread;
  }

  async getQnaReplies(threadId: number): Promise<QnaReply[]> {
    return Array.from(this.qnaReplies.values())
      .filter(reply => reply.threadId === threadId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createQnaReply(insertReply: InsertQnaReply): Promise<QnaReply> {
    const reply: QnaReply = {
      ...insertReply,
      id: this.currentQnaReplyId++,
      likes: 0,
      createdAt: new Date(),
    };
    this.qnaReplies.set(reply.id, reply);
    
    // Update thread answers count
    const thread = this.qnaThreads.get(reply.threadId);
    if (thread) {
      thread.answersCount++;
      this.qnaThreads.set(thread.id, thread);
    }
    
    return reply;
  }

  // Skills
  async getSkills(limit = 50): Promise<Skill[]> {
    return Array.from(this.skills.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createSkill(insertSkill: InsertSkill): Promise<Skill> {
    const skill: Skill = {
      ...insertSkill,
      id: this.currentSkillId++,
      createdAt: new Date(),
    };
    this.skills.set(skill.id, skill);
    return skill;
  }

  async deleteSkill(id: number): Promise<boolean> {
    return this.skills.delete(id);
  }

  // Mental Health
  async getMentalHealthPosts(limit = 50): Promise<MentalHealthPost[]> {
    return Array.from(this.mentalHealthPosts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createMentalHealthPost(insertPost: InsertMentalHealthPost): Promise<MentalHealthPost> {
    const post: MentalHealthPost = {
      ...insertPost,
      id: this.currentMentalHealthPostId++,
      userId: insertPost.userId || null,
      isAnonymous: insertPost.isAnonymous || false,
      likes: 0,
      commentsCount: 0,
      createdAt: new Date(),
    };
    this.mentalHealthPosts.set(post.id, post);
    return post;
  }

  // Opportunities
  async getOpportunities(limit = 50): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const opportunity: Opportunity = {
      ...insertOpportunity,
      id: this.currentOpportunityId++,
      userId: insertOpportunity.userId!,
      company: insertOpportunity.company || null,
      deadline: insertOpportunity.deadline || null,
      createdAt: new Date(),
    };
    this.opportunities.set(opportunity.id, opportunity);
    return opportunity;
  }

  async deleteOpportunity(id: number): Promise<boolean> {
    return this.opportunities.delete(id);
  }

  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    return this.opportunities.get(id);
  }

  // Reviews
  async getReviews(limit = 50): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = {
      ...insertReview,
      id: this.currentReviewId++,
      image: insertReview.image || null,
      upvotes: 0,
      createdAt: new Date(),
    };
    this.reviews.set(review.id, review);
    return review;
  }

  // Complaints
  async getComplaints(): Promise<Complaint[]> {
    return Array.from(this.complaints.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getComplaintsByUser(userId: number): Promise<Complaint[]> {
    return Array.from(this.complaints.values())
      .filter(complaint => complaint.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createComplaint(insertComplaint: InsertComplaint): Promise<Complaint> {
    const complaint: Complaint = {
      ...insertComplaint,
      id: this.currentComplaintId++,
      userId: insertComplaint.userId || null,
      isAnonymous: insertComplaint.isAnonymous || false,
      attachment: insertComplaint.attachment || null,
      status: "open",
      createdAt: new Date(),
    };
    this.complaints.set(complaint.id, complaint);
    return complaint;
  }

  async updateComplaintStatus(id: number, status: string): Promise<boolean> {
    const complaint = this.complaints.get(id);
    if (!complaint) return false;
    complaint.status = status;
    this.complaints.set(id, complaint);
    return true;
  }

  // Notifications
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(n => n.userId === userId);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const notif: Notification = {
      ...notification,
      id: this.currentNotificationId++,
      isRead: notification.isRead ?? false,
      createdAt: new Date(),
    };
    this.notifications.set(notif.id, notif);
    return notif;
  }

  async markNotificationRead(notificationId: number): Promise<boolean> {
    const notif = this.notifications.get(notificationId);
    if (!notif) return false;
    notif.isRead = true;
    this.notifications.set(notificationId, notif);
    return true;
  }

  // Connection Requests
  async createConnectionRequest(request: InsertConnectionRequest): Promise<ConnectionRequest> {
    const req: ConnectionRequest = {
      ...request,
      id: this.currentConnectionRequestId++,
      status: request.status ?? 'pending',
      createdAt: new Date(),
    };
    this.connectionRequests.set(req.id, req);
    return req;
  }

  async getConnectionRequestsByReceiver(receiverId: number): Promise<ConnectionRequest[]> {
    return Array.from(this.connectionRequests.values()).filter(r => r.receiverId === receiverId);
  }

  async getConnectionRequestsBySender(senderId: number): Promise<ConnectionRequest[]> {
    return Array.from(this.connectionRequests.values()).filter(r => r.senderId === senderId);
  }

  async updateConnectionRequestStatus(requestId: number, status: 'pending' | 'accepted' | 'declined'): Promise<boolean> {
    const req = this.connectionRequests.get(requestId);
    if (!req) return false;
    req.status = status;
    this.connectionRequests.set(requestId, req);
    return true;
  }

  // Messages (chat)
  async getMessages(connectionRequestId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(m => m.connectionRequestId === connectionRequestId);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const msg: Message = {
      ...message,
      id: this.currentMessageId++,
      createdAt: new Date(),
    };
    this.messages.set(msg.id, msg);
    return msg;
  }

  // Utility
  async resyncAllBlogCommentCounts(): Promise<void> {
    // Implementation of resyncAllBlogCommentCounts method
  }
}

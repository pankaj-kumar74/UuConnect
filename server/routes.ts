import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import type { IStorage } from "./storage";
import { 
  insertUserSchema, insertBlogSchema, insertCommentSchema,
  insertAnnouncementSchema, insertQnaThreadSchema, insertQnaReplySchema,
  insertSkillSchema, insertMentalHealthPostSchema, insertOpportunitySchema,
  insertReviewSchema, insertComplaintSchema,
  InsertAnnouncement
} from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
console.log('JWT_SECRET:', JWT_SECRET); // Debug log

interface AuthenticatedRequest extends Request {
  userId?: number;
  user?: any;
}

// Middleware to verify JWT token
const authenticateToken = (storageRef?: IStorage) => {
  // return middleware that closes over the provided storage reference
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Accept token from Authorization header, x-access-token header, or cookie
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined;
    const altToken = req.headers['x-access-token'] as string | undefined;
    const cookieToken = (req as any).cookies ? (req as any).cookies['token'] : undefined;

    const token = headerToken || altToken || cookieToken;

    if (!token) {
      console.log('No auth token provided. Headers:', {
        authorization: req.headers['authorization'],
        'x-access-token': req.headers['x-access-token'],
      });
      return res.status(401).json({ message: 'Access token required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log('Decoded token:', decoded); // Debug log
      req.userId = decoded.userId;
      console.log('Set userId:', req.userId); // Debug log
      // use provided storageRef or try to read storage from closure via fallback
      const store = storageRef as IStorage | undefined;
      if (!store) {
        console.log('No storage available in authenticateToken middleware');
        return res.status(500).json({ message: 'Server configuration error' });
      }
      req.user = await store.getUser(decoded.userId);
      next();
    } catch (error) {
      console.log('JWT verification error:', error); // Debug log
      return res.status(403).json({ message: 'Invalid token' });
    }
  };
};

// Middleware to check admin role
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export async function registerRoutes(app: Express, storage: IStorage): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      // set token cookie as a fallback so requests will include it automatically
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        // set token cookie as a fallback so requests will include it automatically
        res.cookie('token', token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
          user: { ...user, password: undefined },
          token,
        });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    res.json({ ...req.user, password: undefined });
  });

  // Blog routes
  app.get("/api/blogs", async (req, res) => {
    try {
      const { limit = 20, offset = 0, category, search, userId } = req.query;
      
      let blogs;
      if (search) {
        blogs = await storage.searchBlogs(search as string);
      } else if (category) {
        blogs = await storage.getBlogsByCategory(category as string);
      } else if (userId) {
        blogs = await storage.getBlogsByUser(Number(userId));
      } else {
        blogs = await storage.getBlogs(Number(limit), Number(offset));
      }

      // Get authors for each blog
      const blogsWithAuthors = await Promise.all(
        blogs.map(async (blog) => {
          const author = await storage.getUser(blog.userId);
          return {
            ...blog,
            author: author ? { ...author, password: undefined } : null,
          };
        })
      );

      res.json(blogsWithAuthors);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/blogs/:id", async (req, res) => {
    try {
      const blog = await storage.getBlog(Number(req.params.id));
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      const author = await storage.getUser(blog.userId);
      res.json({
        ...blog,
        author: author ? { ...author, password: undefined } : null,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/blogs", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      console.log('Request body:', req.body); // Debug log
      const blogData = insertBlogSchema.parse(req.body);
      console.log('Parsed blog data:', blogData); // Debug log
      const blog = await storage.createBlog({
        ...blogData,
        userId: req.userId!,
      });

      const author = await storage.getUser(blog.userId);
      res.json({
        ...blog,
        author: author ? { ...author, password: undefined } : null,
      });
    } catch (error: any) {
      console.log('Validation error:', error); // Debug log
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/blogs/:id/like", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const blogId = Number(req.params.id);
      const isLiked = await storage.isBlogLiked(blogId, req.userId!);
      
      if (isLiked) {
        await storage.unlikeBlog(blogId, req.userId!);
      } else {
        await storage.likeBlog(blogId, req.userId!);
      }

      // Fetch the blog with explicit column selection to avoid circular structure
      const blog = await storage.getBlog(blogId);
      console.log('Fetched blog after like/unlike:', blog); // Debug log
      res.json({ 
        liked: !isLiked,
        likes: blog?.likes || 0 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Comments routes
  app.get("/api/blogs/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByBlog(Number(req.params.id));
      
      const commentsWithAuthors = await Promise.all(
        comments.map(async (comment) => {
          const author = await storage.getUser(comment.userId);
          return {
            ...comment,
            author: author ? { ...author, password: undefined } : null,
          };
        })
      );

      res.json(commentsWithAuthors);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/blogs/:id/comments", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      console.log('Incoming comment body:', req.body); // Debug log
      const { content } = req.body;
      const parsed = z.object({ content: z.string().min(1) }).parse({ content });
      const commentObj = {
        content: parsed.content,
        blogId: Number(req.params.id),
        userId: req.userId!,
      };
      console.log('Constructed comment object before save:', commentObj); // Debug log
      const comment = await storage.createComment(commentObj);

      const author = await storage.getUser(comment.userId);
      res.json({
        ...comment,
        author: author ? { ...author, password: undefined } : null,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Announcements routes
  app.get("/api/announcements", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const announcements = await storage.getAnnouncements(limit);
      const announcementsWithAuthors = await Promise.all(
        announcements.map(async (announcement) => {
          const author = await storage.getUser(announcement.userId);
          return {
            ...announcement,
            author: author ? { ...author, password: undefined } : null,
          };
        })
      );
      res.json(announcementsWithAuthors);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/announcements", authenticateToken(storage), requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      // Convert eventDate string to Date if present
      if (req.body.eventDate) {
        req.body.eventDate = new Date(req.body.eventDate);
      }
      console.log("Request body before validation:", req.body); // Debug log
      // Remove userId if present in req.body to avoid linter error
      const { userId, ...rest } = req.body;
      const announcementData = insertAnnouncementSchema.parse(rest);
      console.log("Parsed announcementData:", announcementData); // Debug log
      const announcement = await storage.createAnnouncement({
        ...announcementData,
        userId: req.userId!,
      } as any);

      const author = await storage.getUser(announcement.userId);
      res.json({
        ...announcement,
        author: author ? { ...author, password: undefined } : null,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Q&A routes
  app.get("/api/qna", async (req, res) => {
    try {
      const threads = await storage.getQnaThreads();
      
      const threadsWithAuthors = await Promise.all(
        threads.map(async (thread) => {
          const author = await storage.getUser(thread.userId);
          return {
            ...thread,
            author: author ? { ...author, password: undefined } : null,
          };
        })
      );

      res.json(threadsWithAuthors);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/qna", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const threadData = insertQnaThreadSchema.parse(req.body);
      const thread = await storage.createQnaThread({
        ...threadData,
        userId: req.userId!,
      });

      const author = await storage.getUser(thread.userId);
      res.json({
        ...thread,
        author: author ? { ...author, password: undefined } : null,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/qna/:id/replies", async (req, res) => {
    try {
      const replies = await storage.getQnaReplies(Number(req.params.id));
      
      const repliesWithAuthors = await Promise.all(
        replies.map(async (reply) => {
          const author = await storage.getUser(reply.userId);
          return {
            ...reply,
            author: author ? { ...author, password: undefined } : null,
          };
        })
      );

      res.json(repliesWithAuthors);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/qna/:id/replies", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const replyData = insertQnaReplySchema.parse(req.body);
      const reply = await storage.createQnaReply({
        ...replyData,
        threadId: Number(req.params.id),
        userId: req.userId!,
      });

      const author = await storage.getUser(reply.userId);
      res.json({
        ...reply,
        author: author ? { ...author, password: undefined } : null,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Skills routes
  app.get("/api/skills", async (req, res) => {
    try {
      const skills = await storage.getSkills();
      
      const skillsWithAuthors = await Promise.all(
        skills.map(async (skill) => {
          const author = await storage.getUser(skill.userId);
          return {
            ...skill,
            author: author ? { ...author, password: undefined } : null,
          };
        })
      );

      res.json(skillsWithAuthors);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/skills", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const skillData = insertSkillSchema.parse(req.body);
      const skill = await storage.createSkill({
        ...skillData,
        userId: req.userId!,
      });

      const author = await storage.getUser(skill.userId);
      res.json({
        ...skill,
        author: author ? { ...author, password: undefined } : null,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Mental Health routes
  app.get("/api/mental-health", async (req, res) => {
    try {
      const posts = await storage.getMentalHealthPosts();
      
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          if (post.isAnonymous) {
            return {
              ...post,
              author: { fullName: "Anonymous", avatar: null },
            };
          }
          
          const author = await storage.getUser(post.userId!);
          return {
            ...post,
            author: author ? { ...author, password: undefined } : null,
          };
        })
      );

      res.json(postsWithAuthors);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/mental-health", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const postData = insertMentalHealthPostSchema.parse(req.body);
      const post = await storage.createMentalHealthPost({
        ...postData,
        userId: postData.isAnonymous ? undefined : req.userId!,
      });

      let author;
      if (post.isAnonymous) {
        author = { fullName: "Anonymous", avatar: null };
      } else {
        const user = await storage.getUser(post.userId!);
        author = user ? { ...user, password: undefined } : null;
      }

      res.json({
        ...post,
        author,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Opportunities routes
  app.get("/api/opportunities", async (req, res) => {
    try {
      const opportunities = await storage.getOpportunities();
      
      const opportunitiesWithAuthors = await Promise.all(
        opportunities.map(async (opportunity) => {
          const author = await storage.getUser(opportunity.userId);
          return {
            ...opportunity,
            author: author ? { ...author, password: undefined } : null,
          };
        })
      );

      res.json(opportunitiesWithAuthors);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/opportunities", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      // Convert deadline to Date if present
      if (req.body.deadline) {
        req.body.deadline = new Date(req.body.deadline);
      }
      // Use insertOpportunitySchema directly (userId already omitted)
      const opportunityData = insertOpportunitySchema.parse(req.body);
      const opportunity = await storage.createOpportunity({
        ...opportunityData,
        userId: req.userId!,
      } as any);

      const author = await storage.getUser(opportunity.userId);
      res.json({
        ...opportunity,
        author: author ? { ...author, password: undefined } : null,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/opportunities/:id", async (req, res) => {
    try {
      const opportunity = await storage.getOpportunity(Number(req.params.id));
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      const author = await storage.getUser(opportunity.userId);
      res.json({
        ...opportunity,
        author: author ? { ...author, password: undefined } : null,
      });
    } catch (error) {
      res.status(400).json({ message: (error as any).message });
    }
  });

  // Reviews routes
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviews();
      
      const reviewsWithAuthors = await Promise.all(
        reviews.map(async (review) => {
          const author = await storage.getUser(review.userId);
          return {
            ...review,
            author: author ? { ...author, password: undefined } : null,
          };
        })
      );

      res.json(reviewsWithAuthors);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/reviews", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview({
        ...reviewData,
        userId: req.userId!,
      });

      const author = await storage.getUser(review.userId);
      res.json({
        ...review,
        author: author ? { ...author, password: undefined } : null,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Complaints routes
  app.get("/api/complaints", authenticateToken(storage), async (req, res) => {
    try {
      const complaints = await storage.getComplaints();
      
      const complaintsWithAuthors = await Promise.all(
        complaints.map(async (complaint) => {
          if (complaint.isAnonymous) {
            return {
              ...complaint,
              author: { fullName: "Anonymous" },
            };
          }
          
          const author = await storage.getUser(complaint.userId!);
          return {
            ...complaint,
            author: author ? { ...author, password: undefined } : null,
          };
        })
      );

      res.json(complaintsWithAuthors);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/complaints", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      console.log('Creating complaint for user:', userId);
      console.log('Request body:', req.body);
      
      const complaintData = insertComplaintSchema.parse(req.body);
      console.log('Parsed complaint data:', complaintData);
      
      const complaint = await storage.createComplaint({
        ...complaintData,
        userId: userId, // Always store userId for tracking
      });
      
      console.log('Created complaint:', complaint);

      res.json({ message: "Complaint submitted successfully" });
    } catch (error: any) {
      console.log('Error creating complaint:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get user's own complaints (including anonymous ones)
  app.get("/api/complaints/my", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      console.log('Fetching complaints for user:', req.userId);
      const complaints = await storage.getComplaintsByUser(req.userId!);
      console.log('Found complaints:', complaints);
      
      const complaintsWithAuthors = await Promise.all(
        complaints.map(async (complaint) => {
          if (complaint.isAnonymous) {
            return {
              ...complaint,
              author: { fullName: "Anonymous (You)" },
            };
          }
          
          const author = await storage.getUser(complaint.userId!);
          return {
            ...complaint,
            author: author ? { ...author, password: undefined } : null,
          };
        })
      );

      console.log('Returning complaints with authors:', complaintsWithAuthors);
      res.json(complaintsWithAuthors);
    } catch (error: any) {
      console.log('Error fetching user complaints:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/complaints/:id/status", authenticateToken(storage), requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const updated = await storage.updateComplaintStatus(Number(req.params.id), status);
      if (!updated) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: (error as any).message });
    }
  });

  // User profile routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userBlogs = await storage.getBlogsByUser(user.id);
      
      res.json({
        ...user,
        password: undefined,
        blogsCount: userBlogs.length,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/users/:id", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = Number(req.params.id);
      
      // Users can only update their own profile (or admin can update any)
      if (req.userId !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updates = req.body;
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...updatedUser, password: undefined });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Stats endpoint for dashboard
  app.get("/api/stats", async (req, res) => {
    try {
      const blogs = await storage.getBlogs();
      const announcements = await storage.getAnnouncements();
      const qnaThreads = await storage.getQnaThreads();
      const opportunities = await storage.getOpportunities();
      const users = await storage.getUsers();
      console.log('User count:', users.length, 'Users:', users);

      res.json({
        totalBlogs: blogs.length,
        totalAnnouncements: announcements.length,
        totalQuestions: qnaThreads.length,
        totalOpportunities: opportunities.length,
        totalUsers: users.length,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/blogs/:id", authenticateToken(storage), requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteBlog(Number(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Blog not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // --- Connection Requests & Notifications ---

  // Send a connection request
  app.post("/api/connection-requests", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const { receiverId, skillId } = req.body;
      if (!receiverId || !skillId) return res.status(400).json({ message: "receiverId and skillId required" });
      const request = await storage.createConnectionRequest({ senderId: req.userId!, receiverId, skillId });
      console.log('Created connection request:', request); // Debug log
      // Notify the receiver
      const notif = await storage.createNotification({
        userId: receiverId,
        type: 'connection_request',
        message: `You have a new connection request`,
        data: { senderId: req.userId!, skillId, requestId: request.id },
      });
      console.log('Created notification for receiver:', notif); // Debug log
      res.json(request);
    } catch (error: any) {
      console.log('Error in connection request:', error); // Debug log
      res.status(400).json({ message: error.message });
    }
  });

  // Accept or decline a connection request
  app.post("/api/connection-requests/:id/respond", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = Number(req.params.id);
      const { action } = req.body; // 'accept' or 'decline'
      if (!['accept', 'decline'].includes(action)) return res.status(400).json({ message: "Invalid action" });
      const reqs = await storage.getConnectionRequestsByReceiver(req.userId!);
      const request = reqs.find(r => r.id === requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      await storage.updateConnectionRequestStatus(requestId, action === 'accept' ? 'accepted' : 'declined');
      // Notify the sender if accepted
      if (action === 'accept') {
        await storage.createNotification({
          userId: request.senderId,
          type: 'connection_accepted',
          message: `Your connection request was accepted!`,
          data: { receiverId: req.userId!, skillId: request.skillId, requestId: request.id },
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get notifications for the logged-in user
  app.get("/api/notifications", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.userId!);
      res.json(notifications);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Mark a notification as read
  app.post("/api/notifications/:id/read", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const notifId = Number(req.params.id);
      await storage.markNotificationRead(notifId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // --- Chat Messages ---
  app.get("/api/messages/:connectionRequestId", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const connectionRequestId = Number(req.params.connectionRequestId);
      const reqObj = (await storage.getConnectionRequestsByReceiver(req.userId!)).find(r => r.id === connectionRequestId)
        || (await storage.getConnectionRequestsBySender(req.userId!)).find(r => r.id === connectionRequestId);
      if (!reqObj || reqObj.status !== 'accepted') return res.status(403).json({ message: "Not allowed" });
      const messages = await storage.getMessages(connectionRequestId);
      res.json(messages);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/messages/:connectionRequestId", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const connectionRequestId = Number(req.params.connectionRequestId);
      const { content } = req.body;
      if (!content || !content.trim()) return res.status(400).json({ message: "Message content required" });
      const reqObj = (await storage.getConnectionRequestsByReceiver(req.userId!)).find(r => r.id === connectionRequestId)
        || (await storage.getConnectionRequestsBySender(req.userId!)).find(r => r.id === connectionRequestId);
      if (!reqObj || reqObj.status !== 'accepted') return res.status(403).json({ message: "Not allowed" });
      const otherUserId = reqObj.senderId === req.userId! ? reqObj.receiverId : reqObj.senderId;
      const message = await storage.createMessage({
        senderId: req.userId!,
        receiverId: otherUserId,
        content,
        connectionRequestId,
      });
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // --- Get accepted connections for chat ---
  app.get("/api/connection-requests/accepted", authenticateToken(storage), async (req: AuthenticatedRequest, res) => {
    try {
      const sent = await storage.getConnectionRequestsBySender(req.userId!);
      const received = await storage.getConnectionRequestsByReceiver(req.userId!);
      const accepted = [...sent, ...received].filter(r => r.status === 'accepted');
      res.json(accepted);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

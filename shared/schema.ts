import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("student"), // student, admin
  bio: text("bio"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blogs = pgTable("blogs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  category: text("category").notNull(),
  image: text("image"),
  likes: integer("likes").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  blogId: integer("blog_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blogLikes = pgTable("blog_likes", {
  id: serial("id").primaryKey(),
  blogId: integer("blog_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  eventDate: timestamp("event_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const qnaThreads = pgTable("qna_threads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  question: text("question").notNull(),
  tags: text("tags").array(),
  answersCount: integer("answers_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const qnaReplies = pgTable("qna_replies", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull(),
  userId: integer("user_id").notNull(),
  answer: text("answer").notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  isHelpRequest: boolean("is_help_request").notNull(),
  skillTitle: text("skill_title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mentalHealthPosts = pgTable("mental_health_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").default(true).notNull(),
  likes: integer("likes").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // internship, job, freelance
  company: text("company"),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  image: text("image"),
  upvotes: integer("upvotes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  attachment: text("attachment"),
  status: text("status").default("open").notNull(), // open, in_progress, resolved
  isAnonymous: boolean("is_anonymous").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  data: json("data"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const connectionRequests = pgTable("connection_requests", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  skillId: integer("skill_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  connectionRequestId: integer("connection_request_id").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBlogSchema = createInsertSchema(blogs).omit({
  id: true,
  userId: true,
  likes: true,
  commentsCount: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  likes: true,
  createdAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  userId: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().min(1, "Category is required"),
});

export const insertQnaThreadSchema = createInsertSchema(qnaThreads).omit({
  id: true,
  answersCount: true,
  createdAt: true,
});

export const insertQnaReplySchema = createInsertSchema(qnaReplies).omit({
  id: true,
  likes: true,
  createdAt: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
});

export const insertMentalHealthPostSchema = createInsertSchema(mentalHealthPosts).omit({
  id: true,
  likes: true,
  commentsCount: true,
  createdAt: true,
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  upvotes: true,
  createdAt: true,
});

export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  status: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Blog = typeof blogs.$inferSelect;
export type InsertBlog = z.infer<typeof insertBlogSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type QnaThread = typeof qnaThreads.$inferSelect;
export type InsertQnaThread = z.infer<typeof insertQnaThreadSchema>;
export type QnaReply = typeof qnaReplies.$inferSelect;
export type InsertQnaReply = z.infer<typeof insertQnaReplySchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type MentalHealthPost = typeof mentalHealthPosts.$inferSelect;
export type InsertMentalHealthPost = z.infer<typeof insertMentalHealthPostSchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema> & { userId?: number };
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;

// Notification type
export interface Notification {
  id: number;
  userId: number; // Who receives the notification
  type: 'connection_request' | 'connection_accepted';
  message: string;
  data?: any; // Extra data (e.g., senderId, skillId)
  isRead: boolean;
  createdAt: Date;
}

export type InsertNotification = Omit<Notification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean };

// ConnectionRequest type
export interface ConnectionRequest {
  id: number;
  senderId: number;
  receiverId: number;
  skillId: number;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export type InsertConnectionRequest = Omit<ConnectionRequest, 'id' | 'createdAt' | 'status'> & { status?: 'pending' | 'accepted' | 'declined' };

// Message type for chat
export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: Date;
  connectionRequestId: number; // Link to the accepted connection
}

export type InsertMessage = Omit<Message, 'id' | 'createdAt'>;

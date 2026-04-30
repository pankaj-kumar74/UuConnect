import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { 
  users, blogs, comments, blogLikes, announcements, qnaThreads, qnaReplies,
  skills, mentalHealthPosts, opportunities, reviews, complaints, notifications, connectionRequests, messages
} from '@shared/schema';
import { eq, desc, like, and, or, ilike, sql } from 'drizzle-orm';
import { IStorage } from './storage';
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
  Complaint, InsertComplaint
} from '@shared/schema';

const neonSql = neon(process.env.DATABASE_URL!);
const db = drizzle(neonSql);

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Blogs
  async getBlogs(limit = 50, offset = 0): Promise<Blog[]> {
    return await db.select({
      id: blogs.id,
      userId: blogs.userId,
      title: blogs.title,
      content: blogs.content,
      excerpt: blogs.excerpt,
      category: blogs.category,
      image: blogs.image,
      likes: blogs.likes,
      commentsCount: blogs.commentsCount,
      createdAt: blogs.createdAt,
    }).from(blogs).orderBy(desc(blogs.createdAt)).limit(limit).offset(offset);
  }

  async getBlog(id: number): Promise<Blog | undefined> {
    const result = await db.select({
      id: blogs.id,
      userId: blogs.userId,
      title: blogs.title,
      content: blogs.content,
      excerpt: blogs.excerpt,
      category: blogs.category,
      image: blogs.image,
      likes: blogs.likes,
      commentsCount: blogs.commentsCount,
      createdAt: blogs.createdAt,
    }).from(blogs).where(eq(blogs.id, id)).limit(1);
    return result[0];
  }

  async getBlogsByUser(userId: number): Promise<Blog[]> {
    return await db.select({
      id: blogs.id,
      userId: blogs.userId,
      title: blogs.title,
      content: blogs.content,
      excerpt: blogs.excerpt,
      category: blogs.category,
      image: blogs.image,
      likes: blogs.likes,
      commentsCount: blogs.commentsCount,
      createdAt: blogs.createdAt,
    }).from(blogs).where(eq(blogs.userId, userId)).orderBy(desc(blogs.createdAt));
  }

  async getBlogsByCategory(category: string): Promise<Blog[]> {
    return await db.select({
      id: blogs.id,
      userId: blogs.userId,
      title: blogs.title,
      content: blogs.content,
      excerpt: blogs.excerpt,
      category: blogs.category,
      image: blogs.image,
      likes: blogs.likes,
      commentsCount: blogs.commentsCount,
      createdAt: blogs.createdAt,
    }).from(blogs).where(ilike(blogs.category, category)).orderBy(desc(blogs.createdAt));
  }

  async searchBlogs(query: string): Promise<Blog[]> {
    return await db.select({
      id: blogs.id,
      userId: blogs.userId,
      title: blogs.title,
      content: blogs.content,
      excerpt: blogs.excerpt,
      category: blogs.category,
      image: blogs.image,
      likes: blogs.likes,
      commentsCount: blogs.commentsCount,
      createdAt: blogs.createdAt,
    }).from(blogs)
      .where(or(
        like(blogs.title, `%${query}%`),
        like(blogs.content, `%${query}%`),
        like(blogs.excerpt, `%${query}%`)
      ))
      .orderBy(desc(blogs.createdAt));
  }

  async createBlog(blog: InsertBlog): Promise<Blog> {
    const result = await db.insert(blogs).values(blog).returning({
      id: blogs.id,
      userId: blogs.userId,
      title: blogs.title,
      content: blogs.content,
      excerpt: blogs.excerpt,
      category: blogs.category,
      image: blogs.image,
      likes: blogs.likes,
      commentsCount: blogs.commentsCount,
      createdAt: blogs.createdAt,
    });
    return result[0];
  }

  async updateBlog(id: number, updates: Partial<Blog>): Promise<Blog | undefined> {
    const result = await db.update(blogs).set(updates).where(eq(blogs.id, id)).returning({
      id: blogs.id,
      userId: blogs.userId,
      title: blogs.title,
      content: blogs.content,
      excerpt: blogs.excerpt,
      category: blogs.category,
      image: blogs.image,
      likes: blogs.likes,
      commentsCount: blogs.commentsCount,
      createdAt: blogs.createdAt,
    });
    return result[0];
  }

  async deleteBlog(id: number): Promise<boolean> {
    const result = await db.delete(blogs).where(eq(blogs.id, id));
    return result.rowCount > 0;
  }

  async likeBlog(blogId: number, userId: number): Promise<boolean> {
    await db.insert(blogLikes).values({ blogId, userId });
    await db.execute(sql`UPDATE blogs SET likes = likes + 1 WHERE id = ${blogId}`);
    return true;
  }

  async unlikeBlog(blogId: number, userId: number): Promise<boolean> {
    await db.delete(blogLikes).where(and(eq(blogLikes.blogId, blogId), eq(blogLikes.userId, userId)));
    await db.execute(sql`UPDATE blogs SET likes = likes - 1 WHERE id = ${blogId}`);
    return true;
  }

  async isBlogLiked(blogId: number, userId: number): Promise<boolean> {
    const result = await db.select().from(blogLikes)
      .where(and(eq(blogLikes.blogId, blogId), eq(blogLikes.userId, userId)))
      .limit(1);
    return result.length > 0;
  }

  // Comments
  async getCommentsByBlog(blogId: number): Promise<Comment[]> {
    return await db.select({
      id: comments.id,
      blogId: comments.blogId,
      userId: comments.userId,
      content: comments.content,
      likes: comments.likes,
      createdAt: comments.createdAt,
    }).from(comments).where(eq(comments.blogId, blogId)).orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning({
      id: comments.id,
      blogId: comments.blogId,
      userId: comments.userId,
      content: comments.content,
      likes: comments.likes,
      createdAt: comments.createdAt,
    });
    // Update blog comment count
    await db.execute(sql`UPDATE blogs SET comments_count = comments_count + 1 WHERE id = ${comment.blogId}`);
    return result[0];
  }

  async deleteComment(id: number): Promise<boolean> {
    const comment = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    if (comment.length === 0) return false;
    
    await db.delete(comments).where(eq(comments.id, id));
    await db.execute(sql`UPDATE blogs SET comments_count = comments_count - 1 WHERE id = ${comment[0].blogId}`);
    return true;
  }

  // Announcements
  async getAnnouncements(limit = 50): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(limit);
  }

  async createAnnouncement(announcement: InsertAnnouncement & { userId: number }): Promise<Announcement> {
    const result = await db.insert(announcements).values(announcement).returning();
    return result[0];
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return result.rowCount > 0;
  }

  // Q&A
  async getQnaThreads(limit = 50): Promise<QnaThread[]> {
    return await db.select().from(qnaThreads).orderBy(desc(qnaThreads.createdAt)).limit(limit);
  }

  async getQnaThread(id: number): Promise<QnaThread | undefined> {
    const result = await db.select().from(qnaThreads).where(eq(qnaThreads.id, id)).limit(1);
    return result[0];
  }

  async createQnaThread(thread: InsertQnaThread): Promise<QnaThread> {
    const result = await db.insert(qnaThreads).values(thread).returning();
    return result[0];
  }

  async getQnaReplies(threadId: number): Promise<QnaReply[]> {
    return await db.select().from(qnaReplies).where(eq(qnaReplies.threadId, threadId)).orderBy(desc(qnaReplies.createdAt));
  }

  async createQnaReply(reply: InsertQnaReply): Promise<QnaReply> {
    const result = await db.insert(qnaReplies).values(reply).returning();
    // Update thread answer count
    await db.update(qnaThreads).set({ answersCount: sql`${qnaThreads.answersCount} + 1` }).where(eq(qnaThreads.id, reply.threadId));
    return result[0];
  }

  // Skills
  async getSkills(limit = 50): Promise<Skill[]> {
    return await db.select().from(skills).orderBy(desc(skills.createdAt)).limit(limit);
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const result = await db.insert(skills).values(skill).returning();
    return result[0];
  }

  async deleteSkill(id: number): Promise<boolean> {
    const result = await db.delete(skills).where(eq(skills.id, id));
    return result.rowCount > 0;
  }

  // Mental Health
  async getMentalHealthPosts(limit = 50): Promise<MentalHealthPost[]> {
    return await db.select().from(mentalHealthPosts).orderBy(desc(mentalHealthPosts.createdAt)).limit(limit);
  }

  async createMentalHealthPost(post: InsertMentalHealthPost): Promise<MentalHealthPost> {
    const result = await db.insert(mentalHealthPosts).values(post).returning();
    return result[0];
  }

  // Opportunities
  async getOpportunities(limit = 50): Promise<Opportunity[]> {
    return await db.select().from(opportunities).orderBy(desc(opportunities.createdAt)).limit(limit);
  }

  async createOpportunity(opportunity: InsertOpportunity & { userId: number }): Promise<Opportunity> {
    const result = await db.insert(opportunities).values(opportunity).returning();
    return result[0];
  }

  async deleteOpportunity(id: number): Promise<boolean> {
    const result = await db.delete(opportunities).where(eq(opportunities.id, id));
    return result.rowCount > 0;
  }

  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    const result = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
    return result[0];
  }

  // Reviews
  async getReviews(limit = 50): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(limit);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  }

  // Complaints
  async getComplaints(): Promise<Complaint[]> {
    return await db.select().from(complaints).orderBy(desc(complaints.createdAt));
  }

  async getComplaintsByUser(userId: number): Promise<Complaint[]> {
    return await db.select().from(complaints).where(eq(complaints.userId, userId)).orderBy(desc(complaints.createdAt));
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const result = await db.insert(complaints).values(complaint).returning();
    return result[0];
  }

  async updateComplaintStatus(id: number, status: string): Promise<boolean> {
    const result = await db.update(complaints).set({ status }).where(eq(complaints.id, id));
    return result.rowCount > 0;
  }

  // Utility: Resync comments_count for all blogs
  async resyncAllBlogCommentCounts(): Promise<void> {
    await db.execute(sql`
      UPDATE blogs
      SET comments_count = (
        SELECT COUNT(*) FROM comments WHERE comments.blog_id = blogs.id
      )
    `);
  }

  async getNotificationsByUser(userId: number): Promise<any[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: any): Promise<any> {
    const result = await db.insert(notifications).values({
      userId: notification.userId,
      type: notification.type,
      message: notification.message,
      data: notification.data ?? null,
      isRead: notification.isRead ?? false,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async markNotificationRead(notificationId: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
    return result.rowCount > 0;
  }

  async createConnectionRequest(request: any): Promise<any> {
    const result = await db.insert(connectionRequests).values({
      senderId: request.senderId,
      receiverId: request.receiverId,
      skillId: request.skillId,
      status: request.status ?? 'pending',
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async getConnectionRequestsByReceiver(receiverId: number): Promise<any[]> {
    return await db.select().from(connectionRequests).where(eq(connectionRequests.receiverId, receiverId)).orderBy(desc(connectionRequests.createdAt));
  }

  async getConnectionRequestsBySender(senderId: number): Promise<any[]> {
    return await db.select().from(connectionRequests).where(eq(connectionRequests.senderId, senderId)).orderBy(desc(connectionRequests.createdAt));
  }

  async updateConnectionRequestStatus(requestId: number, status: 'pending' | 'accepted' | 'declined'): Promise<boolean> {
    const result = await db.update(connectionRequests)
      .set({ status })
      .where(eq(connectionRequests.id, requestId));
    return result.rowCount > 0;
  }

  async getMessages(connectionRequestId: number): Promise<any[]> {
    return await db.select().from(messages).where(eq(messages.connectionRequestId, connectionRequestId)).orderBy(messages.createdAt);
  }

  async createMessage(message: any): Promise<any> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }
}

export function createDatabaseStorage(): IStorage {
  return new DatabaseStorage();
} 
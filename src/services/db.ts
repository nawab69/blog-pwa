// Database service for handling blog posts storage
import { openDB } from "idb";

export interface BlogPost {
  id?: number;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  coverImage?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
}

export interface Comment {
  id?: number;
  postId: number;
  author: string;
  content: string;
  createdAt: Date;
}

const dbName = "blog-pwa-db";
const dbVersion = 1;
const postStoreName = "posts";
const commentStoreName = "comments";

// Initialize the database
export const initDB = async () => {
  const db = await openDB(dbName, dbVersion, {
    upgrade(db) {
      // Create posts store
      const postStore = db.createObjectStore(postStoreName, {
        keyPath: "id",
        autoIncrement: true,
      });
      postStore.createIndex("createdAt", "createdAt");
      postStore.createIndex("tags", "tags", { multiEntry: true });

      // Create comments store
      const commentStore = db.createObjectStore(commentStoreName, {
        keyPath: "id",
        autoIncrement: true,
      });
      commentStore.createIndex("postId", "postId");
    },
  });
  return db;
};

// Blog Post Operations
export const addPost = async (
  post: Omit<BlogPost, "id">
): Promise<IDBValidKey> => {
  const db = await initDB();
  const postWithTimestamps = {
    ...post,
    createdAt: post.createdAt || new Date(),
    updatedAt: post.updatedAt || new Date(),
  };
  return db.add(postStoreName, postWithTimestamps);
};

export const getAllPosts = async (
  publishedOnly = true
): Promise<BlogPost[]> => {
  const db = await initDB();
  const posts = await db.getAllFromIndex(postStoreName, "createdAt");

  if (publishedOnly) {
    return posts
      .filter((post) => post.published)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  return posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getPostsByTag = async (tag: string): Promise<BlogPost[]> => {
  const db = await initDB();
  const posts = await db.getAllFromIndex(postStoreName, "tags", tag);
  return posts
    .filter((post) => post.published)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

export const getPostById = async (
  id: number
): Promise<BlogPost | undefined> => {
  const db = await initDB();
  return db.get(postStoreName, id);
};

export const updatePost = async (post: BlogPost): Promise<IDBValidKey> => {
  const db = await initDB();
  const updatedPost = {
    ...post,
    updatedAt: new Date(),
  };
  return db.put(postStoreName, updatedPost);
};

export const deletePost = async (id: number): Promise<void> => {
  const db = await initDB();
  await db.delete(postStoreName, id);

  // Also delete all comments for this post
  const commentsToDelete = await getCommentsByPostId(id);
  const tx = db.transaction(commentStoreName, "readwrite");
  for (const comment of commentsToDelete) {
    if (comment.id) {
      await tx.store.delete(comment.id);
    }
  }
  await tx.done;
};

// Comment Operations
export const addComment = async (
  comment: Omit<Comment, "id">
): Promise<IDBValidKey> => {
  const db = await initDB();
  const commentWithTimestamp = {
    ...comment,
    createdAt: comment.createdAt || new Date(),
  };
  return db.add(commentStoreName, commentWithTimestamp);
};

export const getCommentsByPostId = async (
  postId: number
): Promise<Comment[]> => {
  const db = await initDB();
  const comments = await db.getAllFromIndex(commentStoreName, "postId", postId);
  return comments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const deleteComment = async (id: number): Promise<void> => {
  const db = await initDB();
  return db.delete(commentStoreName, id);
};

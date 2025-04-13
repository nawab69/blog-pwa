import { useState, useEffect } from "react";
import {
  BlogPost,
  Comment,
  addPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  addComment,
  getCommentsByPostId,
} from "./services/db";
import "./App.css";

function App() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [author, setAuthor] = useState("Guest Author");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
  const [view, setView] = useState<"list" | "detail" | "edit">("list");

  // Load posts on component mount
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const allPosts = await getAllPosts();
        setPosts(allPosts);
      } catch (error) {
        console.error("Failed to load posts:", error);
      }
    };

    loadPosts();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load comments when a post is selected
  useEffect(() => {
    const loadComments = async () => {
      if (selectedPost?.id) {
        try {
          const postComments = await getCommentsByPostId(selectedPost.id);
          setComments(postComments);
        } catch (error) {
          console.error("Failed to load comments:", error);
        }
      }
    };

    if (view === "detail" && selectedPost) {
      loadComments();
    }
  }, [selectedPost, view]);

  // Handle form submission for blog post
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !excerpt.trim()) return;

    try {
      if (editingId) {
        // Update existing post
        await updatePost({
          id: editingId,
          title,
          content,
          excerpt,
          author,
          coverImage,
          tags,
          createdAt:
            posts.find((post) => post.id === editingId)?.createdAt ||
            new Date(),
          updatedAt: new Date(),
          published: true,
        });
      } else {
        // Add new post
        await addPost({
          title,
          content,
          excerpt,
          author,
          coverImage,
          tags,
          createdAt: new Date(),
          updatedAt: new Date(),
          published: true,
        });
      }

      // Refresh posts list
      const allPosts = await getAllPosts();
      setPosts(allPosts);

      // Reset form
      resetForm();
      setView("list");
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };

  // Handle post deletion
  const handleDeletePost = async (id: number | undefined) => {
    if (id === undefined) return;

    try {
      await deletePost(id);
      setPosts(posts.filter((post) => post.id !== id));
      if (selectedPost?.id === id) {
        setSelectedPost(null);
        setView("list");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  // Handle edit mode
  const handleEditPost = (post: BlogPost) => {
    if (post.id === undefined) return;

    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setExcerpt(post.excerpt);
    setAuthor(post.author);
    setTags(post.tags);
    setCoverImage(post.coverImage || "");
    setView("edit");
  };

  // Handle post selection for viewing details
  const handleSelectPost = async (postId: number | undefined) => {
    if (postId === undefined) return;

    try {
      const post = await getPostById(postId);
      if (post) {
        setSelectedPost(post);
        setView("detail");
      }
    } catch (error) {
      console.error("Failed to get post details:", error);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentContent.trim() || !selectedPost?.id) return;

    try {
      await addComment({
        postId: selectedPost.id,
        author: commentAuthor || "Anonymous",
        content: commentContent,
        createdAt: new Date(),
      });

      // Refresh comments list
      const postComments = await getCommentsByPostId(selectedPost.id);
      setComments(postComments);

      // Reset form
      setCommentAuthor("");
      setCommentContent("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  // Handle tag addition
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag("");
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Reset form fields
  const resetForm = () => {
    setTitle("");
    setContent("");
    setExcerpt("");
    setAuthor("Guest Author");
    setTags([]);
    setCoverImage("");
    setEditingId(null);
  };

  // Render blog post form
  const renderPostForm = () => (
    <section className="blog-form">
      <h2>{editingId ? "Edit Post" : "Create New Post"}</h2>
      <form onSubmit={handleSubmitPost}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Excerpt</label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary of your post"
            rows={2}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content here..."
            rows={8}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="author">Author</label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="coverImage">Cover Image URL</label>
          <input
            type="url"
            id="coverImage"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tag-input">
            {tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)}>
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add a tag and press Enter"
              style={{ border: "none", outline: "none", flex: "1" }}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {editingId ? "Update Post" : "Publish Post"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              resetForm();
              setView("list");
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );

  // Render blog posts list
  const renderPosts = () => (
    <section>
      <div className="page-header">
        <h2 className="page-title">Latest Posts</h2>
        <button onClick={() => setView("edit")} className="btn-primary">
          Create New Post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <h3>No posts yet</h3>
          <p>Be the first to create a blog post!</p>
        </div>
      ) : (
        <div className="blog-posts">
          {posts.map((post) => (
            <div key={post.id} className="blog-post-card">
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="post-cover"
                />
              )}
              <div className="post-content">
                <h3 className="post-title">{post.title}</h3>
                <div className="post-meta">
                  <span className="post-author">By {post.author}</span>
                  <span className="post-date">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="post-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="post-excerpt">{post.excerpt}</p>
                <div className="post-actions">
                  <a
                    href="#"
                    className="read-more"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectPost(post.id);
                    }}
                  >
                    Read more
                  </a>
                  <div>
                    <button
                      onClick={() => handleEditPost(post)}
                      className="btn-accent"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="btn-danger"
                      style={{ marginLeft: "0.5rem" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // Render a single post detail view
  const renderPostDetail = () => {
    if (!selectedPost) return null;

    return (
      <section>
        <button
          onClick={() => setView("list")}
          className="btn-secondary"
          style={{ marginBottom: "1rem" }}
        >
          ← Back to Posts
        </button>

        <article className="blog-post-detail">
          <header className="post-header">
            <h1>{selectedPost.title}</h1>
            <div className="post-meta">
              <span className="post-author">By {selectedPost.author}</span>
              <span className="post-date">
                {new Date(selectedPost.createdAt).toLocaleDateString()}
              </span>
            </div>
            {selectedPost.tags.length > 0 && (
              <div className="post-tags">
                {selectedPost.tags.map((tag, index) => (
                  <span key={index} className="post-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {selectedPost.coverImage && (
            <img
              src={selectedPost.coverImage}
              alt={selectedPost.title}
              className="post-large-cover"
            />
          )}

          <div className="post-body">
            {/* For a real app, you might want to use a markdown renderer here */}
            {selectedPost.content
              .split("\n")
              .map((paragraph, idx) =>
                paragraph ? <p key={idx}>{paragraph}</p> : <br key={idx} />
              )}
          </div>

          <div className="post-footer">
            <span>
              Last updated: {new Date(selectedPost.updatedAt).toLocaleString()}
            </span>
            <div>
              <button
                onClick={() => handleEditPost(selectedPost)}
                className="btn-accent"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeletePost(selectedPost.id)}
                className="btn-danger"
                style={{ marginLeft: "0.5rem" }}
              >
                Delete
              </button>
            </div>
          </div>
        </article>

        <section className="comments-section">
          <h3>Comments</h3>

          <div className="comment-form">
            <form onSubmit={handleSubmitComment}>
              <div className="form-group">
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  placeholder="Your name (optional)"
                />
              </div>
              <div className="form-group">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write your comment here..."
                  rows={3}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">
                Post Comment
              </button>
            </form>
          </div>

          {comments.length === 0 ? (
            <p>No comments yet. Be the first to comment!</p>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author}</span>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="comment-body">{comment.content}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    );
  };

  return (
    <div className="app-container">
      <header>
        <div className="logo-container">
          <h1>BlogPWA</h1>
          <div className="connection-status">
            {onlineStatus ? (
              <span className="online">Online</span>
            ) : (
              <span className="offline">Offline</span>
            )}
          </div>
        </div>

        <nav className="nav-links">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setView("list");
            }}
          >
            Home
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setView("edit");
            }}
          >
            New Post
          </a>
        </nav>
      </header>

      <main>
        {view === "list" && renderPosts()}
        {view === "detail" && renderPostDetail()}
        {view === "edit" && renderPostForm()}
      </main>

      <footer>
        <p>BlogPWA - A progressive web app for blogging, works offline too!</p>
      </footer>
    </div>
  );
}

export default App;

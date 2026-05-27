package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"gzonesphere-cms/db"
	"gzonesphere-cms/models"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

func GetBlogs(c *gin.Context) {
	rows, err := db.DB.Query(`SELECT id, slug, title, COALESCE(excerpt,''), COALESCE(category,''), COALESCE(author_username,''), COALESCE(hero_image_url,''), is_featured, view_count, read_time_minutes, published_at FROM blog_posts WHERE status='published' ORDER BY published_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	blogs := []models.BlogPost{}
	for rows.Next() {
		var b models.BlogPost
		err := rows.Scan(&b.ID, &b.Slug, &b.Title, &b.Excerpt, &b.Category, &b.AuthorUsername, &b.HeroImageURL, &b.IsFeatured, &b.ViewCount, &b.ReadTimeMinutes, &b.PublishedAt)
		if err != nil {
			log.Printf("Error scanning blog: %v", err)
			continue
		}
		blogs = append(blogs, b)
	}

	c.JSON(http.StatusOK, gin.H{"data": blogs})
}

func GetFeaturedBlogs(c *gin.Context) {
	rows, err := db.DB.Query(`SELECT id, slug, title, COALESCE(excerpt,''), COALESCE(hero_image_url,'') FROM blog_posts WHERE is_featured=TRUE AND status='published' LIMIT 3`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	blogs := []gin.H{}
	for rows.Next() {
		var id, slug, title, excerpt, hero string
		rows.Scan(&id, &slug, &title, &excerpt, &hero)
		blogs = append(blogs, gin.H{"id": id, "slug": slug, "title": title, "excerpt": excerpt, "hero_image_url": hero})
	}

	c.JSON(http.StatusOK, gin.H{"data": blogs})
}

func GetBlogBySlug(c *gin.Context) {
	slug := c.Param("slug")
	var b models.BlogPost
	var tags []string
	err := db.DB.QueryRow(`SELECT id, slug, title, COALESCE(content,''), COALESCE(excerpt,''), COALESCE(category,''), COALESCE(author_username,''), COALESCE(hero_image_url,''), is_featured, view_count, like_count, read_time_minutes, COALESCE(tags, '{}'), published_at FROM blog_posts WHERE slug=$1 AND status='published'`, slug).Scan(
		&b.ID, &b.Slug, &b.Title, &b.Content, &b.Excerpt, &b.Category, &b.AuthorUsername, &b.HeroImageURL, &b.IsFeatured, &b.ViewCount, &b.LikeCount, &b.ReadTimeMinutes, pq.Array(&tags), &b.PublishedAt,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Blog post not found"})
		return
	}
	b.Tags = tags

	go func(s string) {
		db.DB.Exec("UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = $1", s)
	}(slug)

	c.JSON(http.StatusOK, gin.H{"data": b})
}

func LikeBlog(c *gin.Context) {
	slug := c.Param("slug")
	var count int
	err := db.DB.QueryRow("UPDATE blog_posts SET like_count = like_count + 1 WHERE slug = $1 RETURNING like_count", slug).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"liked": true, "like_count": count}})
}

func CreateBlog(c *gin.Context) {
	var b models.BlogPost
	if err := c.ShouldBindJSON(&b); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := db.DB.QueryRow("INSERT INTO blog_posts (slug, title, content, excerpt, category, author_id, author_username, hero_image_url, status, published_at, tags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, created_at",
		b.Slug, b.Title, b.Content, b.Excerpt, b.Category, b.AuthorID, b.AuthorUsername, b.HeroImageURL, b.Status, time.Now(), pq.Array(b.Tags),
	).Scan(&b.ID, &b.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": b})
}

func UpdateBlog(c *gin.Context) {
	id := c.Param("id")
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for k, v := range updates {
		_, err := db.DB.Exec("UPDATE blog_posts SET "+k+" = $1, updated_at = NOW() WHERE id = $2", v, id)
		if err != nil {
			log.Printf("Error updating blog field %s: %v", k, err)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Blog post updated"})
}

// GetMostReadBlogs — GET /api/cms/blogs/most-read?limit=6&period=30d
func GetMostReadBlogs(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "6"))
	if limit < 1 || limit > 50 {
		limit = 6
	}

	period := c.DefaultQuery("period", "30d")
	interval := "30 days"
	if period == "7d" {
		interval = "7 days"
	} else if period == "90d" {
		interval = "90 days"
	}

	query := fmt.Sprintf(
		`SELECT id, slug, title, excerpt, hero_image_url, category, blog_type,
		        view_count, like_count, read_time_minutes, author_username, published_at
		 FROM blog_posts
		 WHERE status='published' AND published_at > NOW() - INTERVAL '%s'
		 ORDER BY view_count DESC
		 LIMIT $1`,
		interval,
	)

	rows, err := db.DB.Query(query, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var blogs []gin.H
	for rows.Next() {
		var (
			id, slug, title, excerpt, hero, category, blogType, authorUsername string
			viewCount, likeCount, readTime                                      int
			publishedAt                                                          *time.Time
		)
		if err := rows.Scan(&id, &slug, &title, &excerpt, &hero, &category, &blogType,
			&viewCount, &likeCount, &readTime, &authorUsername, &publishedAt); err != nil {
			continue
		}
		blogs = append(blogs, gin.H{
			"id": id, "slug": slug, "title": title, "excerpt": excerpt,
			"hero_image_url": hero, "category": category, "blog_type": blogType,
			"view_count": viewCount, "like_count": likeCount,
			"read_time_minutes": readTime, "author_username": authorUsername,
			"published_at": publishedAt,
		})
	}
	if blogs == nil {
		blogs = []gin.H{}
	}

	c.JSON(http.StatusOK, gin.H{"data": blogs})
}

// GetTrendingBlogs — GET /api/cms/blogs/trending?limit=6
func GetTrendingBlogs(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "6"))
	if limit < 1 || limit > 50 {
		limit = 6
	}

	rows, err := db.DB.Query(
		`SELECT id, slug, title, excerpt, hero_image_url, category, blog_type,
		        view_count, like_count, read_time_minutes, author_username, published_at,
		        views_24h, likes_24h
		 FROM blog_posts
		 WHERE status='published'
		 ORDER BY (views_24h * 0.5 + likes_24h * 0.3) DESC, view_count DESC
		 LIMIT $1`,
		limit,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var blogs []gin.H
	for rows.Next() {
		var (
			id, slug, title, excerpt, hero, category, blogType, authorUsername string
			viewCount, likeCount, readTime, views24h, likes24h                 int
			publishedAt                                                          *time.Time
		)
		if err := rows.Scan(&id, &slug, &title, &excerpt, &hero, &category, &blogType,
			&viewCount, &likeCount, &readTime, &authorUsername, &publishedAt,
			&views24h, &likes24h); err != nil {
			continue
		}
		blogs = append(blogs, gin.H{
			"id": id, "slug": slug, "title": title, "excerpt": excerpt,
			"hero_image_url": hero, "category": category, "blog_type": blogType,
			"view_count": viewCount, "like_count": likeCount,
			"read_time_minutes": readTime, "author_username": authorUsername,
			"published_at": publishedAt,
			"views_24h": views24h, "likes_24h": likes24h,
		})
	}
	if blogs == nil {
		blogs = []gin.H{}
	}

	c.JSON(http.StatusOK, gin.H{"data": blogs})
}

// UpdateBlogSignals — PATCH /api/cms/admin/blogs/:id/signals
func UpdateBlogSignals(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Views24h *int `json:"views_24h"`
		Likes24h *int `json:"likes_24h"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	result, err := db.DB.Exec(
		`UPDATE blog_posts SET views_24h=COALESCE($1, views_24h), likes_24h=COALESCE($2, likes_24h), updated_at=NOW() WHERE id=$3`,
		body.Views24h, body.Likes24h, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Blog post not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"updated": true}})
}

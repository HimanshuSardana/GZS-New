package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"gzonesphere-cms/db"

	"github.com/gin-gonic/gin"
)

type BlogComment struct {
	ID              string     `json:"id"`
	BlogSlug        string     `json:"blog_slug"`
	UserID          string     `json:"user_id"`
	Username        string     `json:"username"`
	AvatarURL       *string    `json:"avatar_url"`
	SubProfileType  *string    `json:"sub_profile_type"`
	DomainBadge     *string    `json:"domain_badge"`
	Text            string     `json:"text"`
	ParentID        *string    `json:"parent_id"`
	LikeCount       int        `json:"like_count"`
	IsReported      bool       `json:"is_reported"`
	CreatedAt       time.Time  `json:"created_at"`
	Replies         []BlogComment `json:"replies,omitempty"`
}

// GetBlogComments — GET /api/cms/blogs/:slug/comments
func GetBlogComments(c *gin.Context) {
	slug := c.Param("slug")
	sort := c.DefaultQuery("sort", "liked")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	orderBy := "like_count DESC, created_at DESC"
	if sort == "recent" {
		orderBy = "created_at DESC"
	}

	// Count total top-level comments
	var total int
	db.DB.QueryRow(
		"SELECT COUNT(*) FROM blog_comments WHERE blog_slug=$1 AND parent_id IS NULL",
		slug,
	).Scan(&total)

	// Fetch top-level comments
	// #nosec G201 — orderBy constructed from an allowlist, not user input
	query := fmt.Sprintf(
		`SELECT id, blog_slug, user_id, username, avatar_url, sub_profile_type, domain_badge, text, parent_id, like_count, is_reported, created_at
		 FROM blog_comments
		 WHERE blog_slug=$1 AND parent_id IS NULL
		 ORDER BY %s
		 LIMIT $2 OFFSET $3`,
		orderBy,
	)

	rows, err := db.DB.Query(query, slug, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	comments := []BlogComment{}
	for rows.Next() {
		var cm BlogComment
		if err := rows.Scan(
			&cm.ID, &cm.BlogSlug, &cm.UserID, &cm.Username,
			&cm.AvatarURL, &cm.SubProfileType, &cm.DomainBadge,
			&cm.Text, &cm.ParentID, &cm.LikeCount, &cm.IsReported, &cm.CreatedAt,
		); err != nil {
			continue
		}
		cm.Replies = []BlogComment{}
		comments = append(comments, cm)
	}

	// Fetch all replies for these comments in one query
	if len(comments) > 0 {
		parentIDs := make([]interface{}, len(comments))
		placeholders := ""
		for i, cm := range comments {
			parentIDs[i] = cm.ID
			if i > 0 {
				placeholders += ","
			}
			placeholders += fmt.Sprintf("$%d", i+1)
		}

		// Add slug as additional param at the end
		parentIDs = append(parentIDs, slug)
		replyQuery := fmt.Sprintf(
			`SELECT id, blog_slug, user_id, username, avatar_url, sub_profile_type, domain_badge, text, parent_id, like_count, is_reported, created_at
			 FROM blog_comments
			 WHERE parent_id IN (%s) AND blog_slug=$%d
			 ORDER BY created_at ASC`,
			placeholders, len(parentIDs),
		)

		replyRows, err := db.DB.Query(replyQuery, parentIDs...)
		if err == nil {
			defer replyRows.Close()
			replyMap := map[string][]BlogComment{}
			for replyRows.Next() {
				var r BlogComment
				if err := replyRows.Scan(
					&r.ID, &r.BlogSlug, &r.UserID, &r.Username,
					&r.AvatarURL, &r.SubProfileType, &r.DomainBadge,
					&r.Text, &r.ParentID, &r.LikeCount, &r.IsReported, &r.CreatedAt,
				); err != nil {
					continue
				}
				if r.ParentID != nil {
					replyMap[*r.ParentID] = append(replyMap[*r.ParentID], r)
				}
			}
			for i := range comments {
				if replies, ok := replyMap[comments[i].ID]; ok {
					comments[i].Replies = replies
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": comments,
		"meta": gin.H{
			"total":    total,
			"has_more": offset+len(comments) < total,
		},
	})
}

// CreateBlogComment — POST /api/cms/blogs/:slug/comments
func CreateBlogComment(c *gin.Context) {
	slug := c.Param("slug")

	userIDVal, _ := c.Get("user_id")
	userID := fmt.Sprintf("%v", userIDVal)
	username, _ := c.Get("username")
	usernameStr, _ := username.(string)
	if usernameStr == "" {
		usernameStr = "anonymous"
	}

	var body struct {
		Text     string  `json:"text"`
		ParentID *string `json:"parent_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	if len([]rune(body.Text)) < 1 || len([]rune(body.Text)) > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Text must be between 1 and 1000 characters"})
		return
	}

	// Verify parent exists if provided
	if body.ParentID != nil && *body.ParentID != "" {
		var exists bool
		db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM blog_comments WHERE id=$1)", *body.ParentID).Scan(&exists)
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent comment not found"})
			return
		}
	} else {
		body.ParentID = nil
	}

	var cm BlogComment
	err := db.DB.QueryRow(
		`INSERT INTO blog_comments (blog_slug, user_id, username, text, parent_id)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, blog_slug, user_id, username, avatar_url, sub_profile_type, domain_badge, text, parent_id, like_count, is_reported, created_at`,
		slug, userID, usernameStr, body.Text, body.ParentID,
	).Scan(
		&cm.ID, &cm.BlogSlug, &cm.UserID, &cm.Username,
		&cm.AvatarURL, &cm.SubProfileType, &cm.DomainBadge,
		&cm.Text, &cm.ParentID, &cm.LikeCount, &cm.IsReported, &cm.CreatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	cm.Replies = []BlogComment{}

	c.JSON(http.StatusCreated, gin.H{"data": cm})
}

// LikeBlogComment — POST /api/cms/blogs/:slug/comments/:commentId/like
func LikeBlogComment(c *gin.Context) {
	commentID := c.Param("commentId")

	var newCount int
	err := db.DB.QueryRow(
		`UPDATE blog_comments SET like_count = like_count + 1 WHERE id=$1 RETURNING like_count`,
		commentID,
	).Scan(&newCount)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"like_count": newCount}})
}

// ReportBlogComment — POST /api/cms/blogs/:slug/comments/:commentId/report
func ReportBlogComment(c *gin.Context) {
	commentID := c.Param("commentId")

	var body struct {
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	allowed := map[string]bool{"spam": true, "harassment": true, "misinformation": true, "other": true}
	if !allowed[body.Reason] {
		body.Reason = "other"
	}

	result, err := db.DB.Exec(
		`UPDATE blog_comments SET is_reported=TRUE, report_reason=$1, updated_at=NOW() WHERE id=$2`,
		body.Reason, commentID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"reported": true}})
}

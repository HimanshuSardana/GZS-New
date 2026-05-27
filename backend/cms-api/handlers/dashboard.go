package handlers

import (
	"net/http"

	"gzonesphere-cms/db"

	"github.com/gin-gonic/gin"
)

// GetAdminDashboardQueues returns pending-work counts for the admin Dashboard.
//
// Fields owned by core-api (skill_verifications, disputes) are always empty
// slices so the frontend fallback shape remains valid.  CMS-owned counts:
//   - job_listings   → draft game posts (content awaiting publish)
//   - flagged_messages → user_reviews with status = 'flagged'
//   - pending_events  → gamepost.game_posts with status = 'draft'
func GetAdminDashboardQueues(c *gin.Context) {
	type queueItem struct {
		ID          int    `json:"id"`
		Title       string `json:"title"`
		SubmittedAt string `json:"submitted_at"`
		Priority    string `json:"priority"`
	}

	// Flagged user reviews awaiting moderation
	var flaggedMessages int
	db.DB.QueryRow(`SELECT COUNT(*) FROM user_reviews WHERE status = 'flagged'`).Scan(&flaggedMessages)

	// Draft gameposts not yet published
	var pendingEvents int
	db.DB.QueryRow(`SELECT COUNT(*) FROM gamepost.game_posts WHERE status = 'draft'`).Scan(&pendingEvents)

	// Draft gameposts as queue items for the "job listings" panel on the dashboard
	jobListings := []queueItem{}
	if rows, err := db.DB.Query(`
		SELECT gp.game_post_id, COALESCE(h.game_title, gp.slug), gp.created_at::TEXT
		FROM gamepost.game_posts gp
		LEFT JOIN gamepost.hero h ON h.game_post_id = gp.game_post_id
		WHERE gp.status = 'draft'
		ORDER BY gp.updated_at DESC
		LIMIT 10`); err == nil {
		defer rows.Close()
		for rows.Next() {
			var item queueItem
			rows.Scan(&item.ID, &item.Title, &item.SubmittedAt)
			item.Priority = "Normal"
			jobListings = append(jobListings, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"skill_verifications": []interface{}{},
			"job_listings":        jobListings,
			"disputes":            []interface{}{},
			"flagged_messages":    flaggedMessages,
			"pending_events":      pendingEvents,
		},
	})
}

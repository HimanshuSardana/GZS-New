package handlers

import (
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"gzonesphere-cms/db"
	"gzonesphere-cms/models"

	"github.com/gin-gonic/gin"
)

var (
	gameCache = make(map[string]interface{})
	cacheMutex sync.RWMutex
)

func GetGames(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	// Cache check (simplified)
	cacheKey := "games:list:" + c.Request.URL.RawQuery
	cacheMutex.RLock()
	if val, ok := gameCache[cacheKey]; ok {
		cacheMutex.RUnlock()
		c.JSON(http.StatusOK, val)
		return
	}
	cacheMutex.RUnlock()

	rows, err := db.DB.Query("SELECT id, slug, title, description, short_description, developer, publisher, release_date, status, is_featured, view_count, created_at, updated_at FROM games WHERE status='published' ORDER BY view_count DESC LIMIT $1", limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var games []models.Game
	for rows.Next() {
		var g models.Game
		err := rows.Scan(&g.ID, &g.Slug, &g.Title, &g.Description, &g.ShortDescription, &g.Developer, &g.Publisher, &g.ReleaseDate, &g.Status, &g.IsFeatured, &g.ViewCount, &g.CreatedAt, &g.UpdatedAt)
		if err != nil {
			log.Printf("Error scanning game: %v", err)
			continue
		}
		games = append(games, g)
	}

	response := models.GameResponse{
		Data: games,
		Meta: gin.H{"total": len(games)},
	}

	// Simple in-memory cache
	cacheMutex.Lock()
	gameCache[cacheKey] = response
	cacheMutex.Unlock()

	c.JSON(http.StatusOK, response)
}

func GetFeaturedGames(c *gin.Context) {
	rows, err := db.DB.Query(`
		SELECT id, slug, title, description, short_description, developer, publisher,
		       release_date, status, is_featured, view_count, created_at, updated_at
		FROM games
		WHERE status = 'published' AND is_featured = TRUE
		ORDER BY view_count DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var games []models.Game
	for rows.Next() {
		var g models.Game
		if err := rows.Scan(&g.ID, &g.Slug, &g.Title, &g.Description, &g.ShortDescription,
			&g.Developer, &g.Publisher, &g.ReleaseDate, &g.Status, &g.IsFeatured,
			&g.ViewCount, &g.CreatedAt, &g.UpdatedAt); err != nil {
			log.Printf("GetFeaturedGames scan: %v", err)
			continue
		}
		games = append(games, g)
	}

	if games == nil {
		games = []models.Game{}
	}

	c.JSON(http.StatusOK, models.GameResponse{
		Data: games,
		Meta: gin.H{"total": len(games)},
	})
}

func GetTrendingGames(c *gin.Context) {
	rows, err := db.DB.Query(`
		SELECT id, slug, title, short_description, view_count, trending_score
		FROM games
		WHERE status='published'
		ORDER BY (view_count * 0.4 + tournament_participants_7d * 0.35 + community_activity_7d * 0.25) DESC
		LIMIT 6`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var games []gin.H
	for rows.Next() {
		var id, slug, title, short string
		var views int
		var trendingScore float64
		rows.Scan(&id, &slug, &title, &short, &views, &trendingScore)
		games = append(games, gin.H{
			"id":               id,
			"slug":             slug,
			"title":            title,
			"short_description": short,
			"view_count":       views,
			"trending_score":   trendingScore,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": games})
}

type trendingSignalsRequest struct {
	TournamentParticipants7d int `json:"tournament_participants_7d"`
	CommunityActivity7d      int `json:"community_activity_7d"`
}

func UpdateTrendingSignals(c *gin.Context) {
	slug := c.Param("slug")

	var req trendingSignalsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := db.DB.Exec(`
		UPDATE games
		SET tournament_participants_7d = $1,
		    community_activity_7d      = $2,
		    trending_score             = (view_count * 0.4 + $1 * 0.35 + $2 * 0.25),
		    updated_at                 = NOW()
		WHERE slug = $3`,
		req.TournamentParticipants7d, req.CommunityActivity7d, slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Game not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Trending signals updated"})
}

func GetGameBySlug(c *gin.Context) {
	slug := c.Param("slug")
	var g models.Game
	err := db.DB.QueryRow("SELECT id, slug, title, description, short_description, developer, publisher, release_date, status, is_featured, view_count, created_at, updated_at FROM games WHERE slug=$1 AND status='published'", slug).Scan(
		&g.ID, &g.Slug, &g.Title, &g.Description, &g.ShortDescription, &g.Developer, &g.Publisher, &g.ReleaseDate, &g.Status, &g.IsFeatured, &g.ViewCount, &g.CreatedAt, &g.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Game not found"})
		return
	}

	// Async view count increment
	go func(s string) {
		db.DB.Exec("UPDATE games SET view_count = view_count + 1 WHERE slug = $1", s)
	}(slug)

	c.JSON(http.StatusOK, gin.H{"data": g})
}

func GetGameReviews(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
}

func CreateGame(c *gin.Context) {
	var g models.Game
	if err := c.ShouldBindJSON(&g); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := db.DB.QueryRow("INSERT INTO games (slug, title, description, short_description, developer, publisher, release_date, status, is_featured) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, created_at, updated_at",
		g.Slug, g.Title, g.Description, g.ShortDescription, g.Developer, g.Publisher, time.Now(), g.Status, g.IsFeatured,
	).Scan(&g.ID, &g.CreatedAt, &g.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": g})
}

func UpdateGame(c *gin.Context) {
	id := c.Param("id")
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Simplified update logic
	for k, v := range updates {
		_, err := db.DB.Exec("UPDATE games SET "+k+" = $1, updated_at = NOW() WHERE id = $2", v, id)
		if err != nil {
			log.Printf("Error updating game field %s: %v", k, err)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Game updated"})
}

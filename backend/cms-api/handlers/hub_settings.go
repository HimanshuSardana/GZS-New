package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"gzonesphere-cms/db"

	"github.com/gin-gonic/gin"
)

type CategoryConfig struct {
	Name    string `json:"name"`
	Enabled bool   `json:"enabled"`
}

type HubSettingsPayload struct {
	GalleryGameSlugs     []string         `json:"gallery_game_slugs"`
	GalleryAutoScroll    bool             `json:"gallery_auto_scroll"`
	TrendingPinnedSlugs  []string         `json:"trending_pinned_slugs"`
	ShowCategoryTabs     bool             `json:"show_category_tabs"`
	CategoriesConfig     []CategoryConfig `json:"categories_config"`
	BlogsGridMode        string           `json:"blogs_grid_mode"`
	BlogsGridManualSlugs []string         `json:"blogs_grid_manual_slugs"`
}

func GetHubSettings(c *gin.Context) {
	section := c.DefaultQuery("section", "games")
	var settingsJSON string
	err := db.DB.QueryRow(`
		SELECT settings_json FROM cms.hub_settings WHERE section = $1
	`, section).Scan(&settingsJSON)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"data": gin.H{}, "section": section})
		return
	}
	var data interface{}
	json.Unmarshal([]byte(settingsJSON), &data)
	c.JSON(http.StatusOK, gin.H{"data": data, "section": section})
}

func SaveHubSettings(c *gin.Context) {
	section := c.DefaultQuery("section", "games")

	var payload HubSettingsPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(payload.GalleryGameSlugs) > 12 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gallery supports maximum 12 games"})
		return
	}

	if len(payload.TrendingPinnedSlugs) > 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Trending pin limit is 2 games maximum"})
		return
	}

	if payload.BlogsGridMode != "" && payload.BlogsGridMode != "auto" && payload.BlogsGridMode != "manual" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "blogs_grid_mode must be 'auto' or 'manual'"})
		return
	}

	if len(payload.BlogsGridManualSlugs) > 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Blog grid supports maximum 6 blogs"})
		return
	}

	allSlugsToValidate := append(payload.GalleryGameSlugs, payload.TrendingPinnedSlugs...)
	if err := validateGameSlugs(allSlugsToValidate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	jsonBytes, _ := json.Marshal(payload)
	_, err := db.DB.Exec(`
		INSERT INTO cms.hub_settings (section, settings_json, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (section) DO UPDATE SET settings_json = $2, updated_at = NOW()
	`, section, string(jsonBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "section": section})
}

func validateGameSlugs(slugs []string) error {
	if len(slugs) == 0 {
		return nil
	}

	seen := make(map[string]bool)
	var unique []string
	for _, s := range slugs {
		if !seen[s] {
			seen[s] = true
			unique = append(unique, s)
		}
	}

	placeholders := make([]string, len(unique))
	args := make([]interface{}, len(unique))
	for i, s := range unique {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = s
	}
	query := "SELECT slug FROM games WHERE slug IN (" + strings.Join(placeholders, ",") + ")"

	rows, err := db.DB.Query(query, args...)
	if err != nil {
		return nil
	}
	defer rows.Close()

	found := make(map[string]bool)
	for rows.Next() {
		var slug string
		if rows.Scan(&slug) == nil {
			found[slug] = true
		}
	}

	for _, slug := range unique {
		if !found[slug] {
			return fmt.Errorf("Game slug '%s' not found", slug)
		}
	}
	return nil
}

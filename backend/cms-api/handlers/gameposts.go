package handlers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"gzonesphere-cms/db"
	"gzonesphere-cms/models"

	"github.com/gin-gonic/gin"
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

func nullStr(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

// scan a nullable TEXT column into a Go string
func scanStr(dest *string) interface{} { return dest }

// ─── Public: GET /api/cms/gameposts ──────────────────────────────────────────
// Returns a lightweight list (no per-game sub-arrays) for browse/listing pages
func GetGamePosts(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	status := c.DefaultQuery("status", "published")

	rows, err := db.DB.Query(`
		SELECT
			gp.game_post_id, gp.slug, gp.status, gp.brand_color,
			gp.is_featured, gp.view_count, gp.created_at, gp.updated_at,
			h.game_title, h.game_desc_short, h.background_img, h.logo_img,
			gi.developer, gi.publisher, gi.genres, gi.platforms
		FROM gamepost.game_posts gp
		LEFT JOIN gamepost.hero      h  ON h.game_post_id  = gp.game_post_id
		LEFT JOIN gamepost.game_info gi ON gi.game_post_id = gp.game_post_id
		WHERE gp.status = $1
		ORDER BY gp.is_featured DESC, gp.view_count DESC
		LIMIT $2 OFFSET $3`,
		status, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type ListItem struct {
		models.GamePost
		GameTitle     string `json:"game_title"`
		ShortDesc     string `json:"game_desc_short"`
		BackgroundImg string `json:"background_img"`
		LogoImg       string `json:"logo_img"`
		Developer     string `json:"developer"`
		Publisher     string `json:"publisher"`
		Genres        string `json:"genres"`
		Platforms     string `json:"platforms"`
	}

	var items []ListItem
	for rows.Next() {
		var it ListItem
		if err := rows.Scan(
			&it.GamePostID, &it.Slug, &it.Status, &it.BrandColor,
			&it.IsFeatured, &it.ViewCount, &it.CreatedAt, &it.UpdatedAt,
			&it.GameTitle, &it.ShortDesc, &it.BackgroundImg, &it.LogoImg,
			&it.Developer, &it.Publisher, &it.Genres, &it.Platforms,
		); err != nil {
			log.Printf("scan error: %v", err)
			continue
		}
		items = append(items, it)
	}

	var total int
	db.DB.QueryRow(`SELECT COUNT(*) FROM gamepost.game_posts WHERE status=$1`, status).Scan(&total)

	c.JSON(http.StatusOK, gin.H{
		"data": items,
		"meta": gin.H{"total": total, "limit": limit, "offset": offset},
	})
}

// ─── fetchFullGamePost ────────────────────────────────────────────────────────
// Loads every section for a game post by its integer ID (any status).
func fetchFullGamePost(id int) (models.FullGamePost, error) {
	var gp models.FullGamePost
	if err := db.DB.QueryRow(`
		SELECT game_post_id, slug, status, brand_color, is_featured, view_count, created_at, updated_at
		FROM gamepost.game_posts WHERE game_post_id = $1`, id).
		Scan(&gp.GamePostID, &gp.Slug, &gp.Status, &gp.BrandColor,
			&gp.IsFeatured, &gp.ViewCount, &gp.CreatedAt, &gp.UpdatedAt); err != nil {
		return gp, err
	}

	// Hero
	var h models.Hero
	if err := db.DB.QueryRow(`
		SELECT game_post_id, COALESCE(game_title,''), COALESCE(game_desc_short,''),
		       COALESCE(background_img,''), COALESCE(logo_img,''),
		       COALESCE(cta_label,'Get Access'), COALESCE(cta_href,''), COALESCE(trailer_url,'')
		FROM gamepost.hero WHERE game_post_id=$1`, id).
		Scan(&h.GamePostID, &h.GameTitle, &h.GameDescShort,
			&h.BackgroundImg, &h.LogoImg, &h.CTALabel, &h.CTAHref, &h.TrailerURL); err == nil {
		gp.Hero = &h
	}

	// Game Info
	var gi models.GameInfo
	if err := db.DB.QueryRow(`
		SELECT game_post_id, COALESCE(developer,''), COALESCE(publisher,''),
		       COALESCE(release_date::TEXT,''), COALESCE(genres,''),
		       COALESCE(platforms,''), COALESCE(profile_size_photo,'')
		FROM gamepost.game_info WHERE game_post_id=$1`, id).
		Scan(&gi.GamePostID, &gi.Developer, &gi.Publisher,
			&gi.ReleaseDate, &gi.Genres, &gi.Platforms, &gi.ProfileSizePhoto); err == nil {
		gp.GameInfo = &gi
	}

	// Storyline
	var sl models.Storyline
	if err := db.DB.QueryRow(`
		SELECT game_post_id, COALESCE(paragraphs,''), COALESCE(summary,'')
		FROM gamepost.storyline WHERE game_post_id=$1`, id).
		Scan(&sl.GamePostID, &sl.Paragraphs, &sl.Summary); err == nil {
		gp.Storyline = &sl
	}

	// Carousel
	if rows, err := db.DB.Query(`
		SELECT carousel_id, game_post_id, media_type,
		       COALESCE(yt_url,''), COALESCE(upload_url,''), COALESCE(caption,''), display_order
		FROM gamepost.carousel WHERE game_post_id=$1 ORDER BY display_order`, id); err == nil {
		defer rows.Close()
		for rows.Next() {
			var ci models.CarouselItem
			rows.Scan(&ci.CarouselID, &ci.GamePostID, &ci.MediaType,
				&ci.YTUrl, &ci.UploadURL, &ci.Caption, &ci.DisplayOrder)
			gp.Carousel = append(gp.Carousel, ci)
		}
	}

	// Gameplay
	var ga models.Gameplay
	if err := db.DB.QueryRow(`
		SELECT game_post_id, COALESCE(paragraph,''),
		       COALESCE(gameplay_title,''), COALESCE(gameplay_title_desc,'')
		FROM gamepost.gameplay WHERE game_post_id=$1`, id).
		Scan(&ga.GamePostID, &ga.Paragraph, &ga.GameplayTitle, &ga.GameplayTitleDesc); err == nil {
		gp.Gameplay = &ga
	}

	// Gameplay Mechanics
	if rows, err := db.DB.Query(`
		SELECT mechanic_id, game_post_id, COALESCE(title,''), COALESCE(description,''), display_order
		FROM gamepost.gameplay_mechanics WHERE game_post_id=$1 ORDER BY display_order`, id); err == nil {
		defer rows.Close()
		for rows.Next() {
			var m models.GameplayMechanic
			rows.Scan(&m.MechanicID, &m.GamePostID, &m.Title, &m.Description, &m.DisplayOrder)
			gp.GameplayMechanics = append(gp.GameplayMechanics, m)
		}
	}

	// QCO
	var qco models.QuickControlOverview
	if err := db.DB.QueryRow(`
		SELECT game_post_id, COALESCE(qco_title,''), COALESCE(qco_title_desc,'')
		FROM gamepost.quick_control_overview WHERE game_post_id=$1`, id).
		Scan(&qco.GamePostID, &qco.QCOTitle, &qco.QCOTitleDesc); err == nil {
		gp.QuickControlOverview = &qco
	}

	// Control Cards
	if rows, err := db.DB.Query(`
		SELECT card_id, game_post_id, COALESCE(category,''), COALESCE(description,''), display_order
		FROM gamepost.control_cards WHERE game_post_id=$1 ORDER BY display_order`, id); err == nil {
		defer rows.Close()
		for rows.Next() {
			var cc models.ControlCard
			rows.Scan(&cc.CardID, &cc.GamePostID, &cc.Category, &cc.Description, &cc.DisplayOrder)
			gp.ControlCards = append(gp.ControlCards, cc)
		}
	}

	// Modes
	if rows, err := db.DB.Query(`
		SELECT modes_id, game_post_id, COALESCE(mode_title,''), COALESCE(mode_titledesc,''), display_order
		FROM gamepost.modes WHERE game_post_id=$1 ORDER BY display_order`, id); err == nil {
		defer rows.Close()
		for rows.Next() {
			var gm models.GameMode
			rows.Scan(&gm.ModesID, &gm.GamePostID, &gm.ModeTitle, &gm.ModeTitleDesc, &gm.DisplayOrder)
			gp.Modes = append(gp.Modes, gm)
		}
	}

	// System Requirements
	var sr models.SystemRequirement
	if err := db.DB.QueryRow(`
		SELECT game_post_id, show_section,
		       COALESCE(os_min,''), COALESCE(os_rec,''),
		       COALESCE(processor_min,''), COALESCE(processor_rec,''),
		       COALESCE(memory_min,''), COALESCE(memory_rec,''),
		       COALESCE(graphics_min,''), COALESCE(graphics_rec,''),
		       COALESCE(storage_min,''), COALESCE(storage_rec,''),
		       COALESCE(directx_min,''), COALESCE(directx_rec,'')
		FROM gamepost.system_requirement WHERE game_post_id=$1`, id).
		Scan(&sr.GamePostID, &sr.ShowSection,
			&sr.OsMin, &sr.OsRec, &sr.ProcessorMin, &sr.ProcessorRec,
			&sr.MemoryMin, &sr.MemoryRec, &sr.GraphicsMin, &sr.GraphicsRec,
			&sr.StorageMin, &sr.StorageRec, &sr.DirectxMin, &sr.DirectxRec); err == nil {
		gp.SystemRequirement = &sr
	}

	// Expert Reviews
	if rows, err := db.DB.Query(`
		SELECT review_id, game_post_id, reviewer_name, COALESCE(outlet,''),
		       COALESCE(rating,0), COALESCE(max_rating,10),
		       COALESCE(quote,''), COALESCE(review_url,''), display_order
		FROM gamepost.expert_reviews WHERE game_post_id=$1 ORDER BY display_order`, id); err == nil {
		defer rows.Close()
		for rows.Next() {
			var er models.ExpertReview
			rows.Scan(&er.ReviewID, &er.GamePostID, &er.ReviewerName, &er.Outlet,
				&er.Rating, &er.MaxRating, &er.Quote, &er.ReviewURL, &er.DisplayOrder)
			gp.ExpertReviews = append(gp.ExpertReviews, er)
		}
	}

	// Get Game
	if rows, err := db.DB.Query(`
		SELECT get_game_id, game_post_id, COALESCE(platform_name,''),
		       COALESCE(affiliate_link,''), COALESCE(price_label,''), display_order
		FROM gamepost.get_game WHERE game_post_id=$1 ORDER BY display_order`, id); err == nil {
		defer rows.Close()
		for rows.Next() {
			var gg models.GetGame
			rows.Scan(&gg.GetGameID, &gg.GamePostID, &gg.PlatformName,
				&gg.AffiliateLink, &gg.PriceLabel, &gg.DisplayOrder)
			gp.GetGame = append(gp.GetGame, gg)
		}
	}

	// DLCs
	if rows, err := db.DB.Query(`
		SELECT dlc_id, game_post_id, dlc_title, COALESCE(dlc_type,'DLC'),
		       COALESCE(release_date::TEXT,''), COALESCE(description,''),
		       COALESCE(price_label,''), COALESCE(store_link,''), display_order
		FROM gamepost.dlcs WHERE game_post_id=$1 ORDER BY display_order`, id); err == nil {
		defer rows.Close()
		for rows.Next() {
			var d models.DLC
			rows.Scan(&d.DLCID, &d.GamePostID, &d.DLCTitle, &d.DLCType,
				&d.ReleaseDate, &d.Description, &d.PriceLabel, &d.StoreLink, &d.DisplayOrder)
			gp.DLCs = append(gp.DLCs, d)
		}
	}

	// Awards
	if rows, err := db.DB.Query(`
		SELECT aa_id, game_post_id, aa_title, COALESCE(aa_type,'Award'),
		       COALESCE(year,0), COALESCE(organisation,''), display_order
		FROM gamepost.awards_and_achievements WHERE game_post_id=$1 ORDER BY display_order`, id); err == nil {
		defer rows.Close()
		for rows.Next() {
			var a models.Award
			rows.Scan(&a.AAID, &a.GamePostID, &a.Title, &a.Type,
				&a.Year, &a.Organisation, &a.DisplayOrder)
			gp.Awards = append(gp.Awards, a)
		}
	}

	// Related Games
	if rows, err := db.DB.Query(`
		SELECT related_id, game_post_id, related_slug, display_order
		FROM gamepost.related_games WHERE game_post_id=$1 ORDER BY display_order`, id); err == nil {
		defer rows.Close()
		for rows.Next() {
			var rg models.RelatedGame
			rows.Scan(&rg.RelatedID, &rg.GamePostID, &rg.RelatedSlug, &rg.DisplayOrder)
			gp.RelatedGames = append(gp.RelatedGames, rg)
		}
	}

	// Community Hub
	var ch models.CommunityHub
	if err := db.DB.QueryRow(`
		SELECT game_post_id, COALESCE(community_branch_slug,''), show_live_chat, show_tournament_widget
		FROM gamepost.community_hub WHERE game_post_id=$1`, id).
		Scan(&ch.GamePostID, &ch.CommunityBranchSlug, &ch.ShowLiveChat, &ch.ShowTournamentWidget); err == nil {
		gp.CommunityHub = &ch
	}

	// Join Our Community
	if rows, err := db.DB.Query(`
		SELECT community_id, game_post_id, platform_name, platform_link, display_order
		FROM gamepost.join_our_community WHERE game_post_id=$1 ORDER BY display_order`, id); err == nil {
		defer rows.Close()
		for rows.Next() {
			var jc models.JoinCommunityLink
			rows.Scan(&jc.CommunityID, &jc.GamePostID, &jc.PlatformName,
				&jc.PlatformLink, &jc.DisplayOrder)
			gp.JoinOurCommunity = append(gp.JoinOurCommunity, jc)
		}
	}

	// Critic Rating
	var cr models.CriticRating
	if err := db.DB.QueryRow(`
		SELECT game_post_id, COALESCE(score,0), COALESCE(label,''), COALESCE(signup_href,'/signup')
		FROM gamepost.critic_rating WHERE game_post_id=$1`, id).
		Scan(&cr.GamePostID, &cr.Score, &cr.Label, &cr.SignupHref); err == nil {
		gp.CriticRating = &cr
	}

	return gp, nil
}

// ─── Public: GET /api/cms/gameposts/:slug ─────────────────────────────────────
func GetGamePostBySlug(c *gin.Context) {
	slug := c.Param("slug")

	var id int
	err := db.DB.QueryRow(`
		SELECT game_post_id FROM gamepost.game_posts
		WHERE slug = $1 AND status = 'published'`, slug).Scan(&id)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Game post not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	go db.DB.Exec(`UPDATE gamepost.game_posts SET view_count = view_count+1 WHERE game_post_id=$1`, id)

	gp, err := fetchFullGamePost(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gp})
}

// ─── Admin: POST /api/cms/admin/gameposts ─────────────────────────────────────
// Creates a new game post with all sections in a single transaction
func CreateGamePost(c *gin.Context) {
	var payload models.FullGamePost
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer tx.Rollback()

	// 1. Root
	var id int
	err = tx.QueryRow(`
		INSERT INTO gamepost.game_posts (slug, status, brand_color, is_featured)
		VALUES ($1, $2, $3, $4) RETURNING game_post_id`,
		payload.Slug,
		coalesce(payload.Status, "draft"),
		coalesce(payload.BrandColor, "#E53935"),
		payload.IsFeatured,
	).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "slug already exists or DB error: " + err.Error()})
		return
	}

	// 2. Admin row
	tx.Exec(`INSERT INTO admin_gamepost.admin (game_post_id, saved_as_draft) VALUES ($1, TRUE)`, id)

	// 3. Hero
	if h := payload.Hero; h != nil {
		tx.Exec(`INSERT INTO gamepost.hero (game_post_id,game_title,game_desc_short,background_img,logo_img,cta_label,cta_href,trailer_url)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
			id, h.GameTitle, h.GameDescShort, h.BackgroundImg, h.LogoImg, h.CTALabel, h.CTAHref, h.TrailerURL)
	}

	// 4. Game Info
	if gi := payload.GameInfo; gi != nil {
		tx.Exec(`INSERT INTO gamepost.game_info (game_post_id,developer,publisher,release_date,genres,platforms,profile_size_photo)
			VALUES ($1,$2,$3,$4::date,$5,$6,$7)`,
			id, gi.Developer, gi.Publisher, nullStr(gi.ReleaseDate), gi.Genres, gi.Platforms, gi.ProfileSizePhoto)
	}

	// 5. Storyline
	if sl := payload.Storyline; sl != nil {
		tx.Exec(`INSERT INTO gamepost.storyline (game_post_id,paragraphs,summary) VALUES ($1,$2,$3)`,
			id, sl.Paragraphs, sl.Summary)
	}

	// 6. Carousel
	for _, ci := range payload.Carousel {
		tx.Exec(`INSERT INTO gamepost.carousel (game_post_id,media_type,yt_url,upload_url,caption,display_order)
			VALUES ($1,$2,$3,$4,$5,$6)`,
			id, ci.MediaType, ci.YTUrl, ci.UploadURL, ci.Caption, ci.DisplayOrder)
	}

	// 7. Gameplay
	if ga := payload.Gameplay; ga != nil {
		tx.Exec(`INSERT INTO gamepost.gameplay (game_post_id,paragraph,gameplay_title,gameplay_title_desc)
			VALUES ($1,$2,$3,$4)`, id, ga.Paragraph, ga.GameplayTitle, ga.GameplayTitleDesc)
	}

	// 8. Mechanics
	for _, m := range payload.GameplayMechanics {
		tx.Exec(`INSERT INTO gamepost.gameplay_mechanics (game_post_id,title,description,display_order)
			VALUES ($1,$2,$3,$4)`, id, m.Title, m.Description, m.DisplayOrder)
	}

	// 9. QCO
	if qco := payload.QuickControlOverview; qco != nil {
		tx.Exec(`INSERT INTO gamepost.quick_control_overview (game_post_id,qco_title,qco_title_desc)
			VALUES ($1,$2,$3)`, id, qco.QCOTitle, qco.QCOTitleDesc)
	}

	// 10. Control Cards
	for _, cc := range payload.ControlCards {
		tx.Exec(`INSERT INTO gamepost.control_cards (game_post_id,category,description,display_order)
			VALUES ($1,$2,$3,$4)`, id, cc.Category, cc.Description, cc.DisplayOrder)
	}

	// 11. Modes
	for _, m := range payload.Modes {
		tx.Exec(`INSERT INTO gamepost.modes (game_post_id,mode_title,mode_titledesc,display_order)
			VALUES ($1,$2,$3,$4)`, id, m.ModeTitle, m.ModeTitleDesc, m.DisplayOrder)
	}

	// 12. System Requirements
	if sr := payload.SystemRequirement; sr != nil {
		tx.Exec(`INSERT INTO gamepost.system_requirement
			(game_post_id,show_section,os_min,os_rec,processor_min,processor_rec,memory_min,memory_rec,graphics_min,graphics_rec,storage_min,storage_rec,directx_min,directx_rec)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
			id, sr.ShowSection, sr.OsMin, sr.OsRec, sr.ProcessorMin, sr.ProcessorRec,
			sr.MemoryMin, sr.MemoryRec, sr.GraphicsMin, sr.GraphicsRec,
			sr.StorageMin, sr.StorageRec, sr.DirectxMin, sr.DirectxRec)
	}

	// 13. Expert Reviews
	for _, er := range payload.ExpertReviews {
		tx.Exec(`INSERT INTO gamepost.expert_reviews (game_post_id,reviewer_name,outlet,rating,max_rating,quote,review_url,display_order)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
			id, er.ReviewerName, er.Outlet, er.Rating, er.MaxRating, er.Quote, er.ReviewURL, er.DisplayOrder)
	}

	// 14. Get Game
	for _, gg := range payload.GetGame {
		tx.Exec(`INSERT INTO gamepost.get_game (game_post_id,platform_name,affiliate_link,price_label,display_order)
			VALUES ($1,$2,$3,$4,$5)`, id, gg.PlatformName, gg.AffiliateLink, gg.PriceLabel, gg.DisplayOrder)
	}

	// 15. DLCs
	for _, d := range payload.DLCs {
		tx.Exec(`INSERT INTO gamepost.dlcs (game_post_id,dlc_title,dlc_type,release_date,description,price_label,store_link,display_order)
			VALUES ($1,$2,$3,$4::date,$5,$6,$7,$8)`,
			id, d.DLCTitle, d.DLCType, nullStr(d.ReleaseDate), d.Description, d.PriceLabel, d.StoreLink, d.DisplayOrder)
	}

	// 16. Awards
	for _, a := range payload.Awards {
		tx.Exec(`INSERT INTO gamepost.awards_and_achievements (game_post_id,aa_title,aa_type,year,organisation,display_order)
			VALUES ($1,$2,$3,$4,$5,$6)`, id, a.Title, a.Type, a.Year, a.Organisation, a.DisplayOrder)
	}

	// 17. Related Games
	for _, rg := range payload.RelatedGames {
		tx.Exec(`INSERT INTO gamepost.related_games (game_post_id,related_slug,display_order)
			VALUES ($1,$2,$3)`, id, rg.RelatedSlug, rg.DisplayOrder)
	}

	// 18. Community Hub
	if ch := payload.CommunityHub; ch != nil {
		tx.Exec(`INSERT INTO gamepost.community_hub (game_post_id,community_branch_slug,show_live_chat,show_tournament_widget)
			VALUES ($1,$2,$3,$4)`, id, ch.CommunityBranchSlug, ch.ShowLiveChat, ch.ShowTournamentWidget)
	}

	// 19. Join Our Community
	for _, jc := range payload.JoinOurCommunity {
		tx.Exec(`INSERT INTO gamepost.join_our_community (game_post_id,platform_name,platform_link,display_order)
			VALUES ($1,$2,$3,$4)`, id, jc.PlatformName, jc.PlatformLink, jc.DisplayOrder)
	}

	// 20. Critic Rating
	if cr := payload.CriticRating; cr != nil {
		tx.Exec(`INSERT INTO gamepost.critic_rating (game_post_id,score,label,signup_href)
			VALUES ($1,$2,$3,$4)`, id, cr.Score, cr.Label, cr.SignupHref)
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": gin.H{"game_post_id": id, "slug": payload.Slug}})
}

// ─── Admin: PUT /api/cms/admin/gameposts/:id/publish ─────────────────────────
func PublishGamePost(c *gin.Context) {
	id := c.Param("id")
	db.DB.Exec(`UPDATE gamepost.game_posts SET status='published', updated_at=NOW() WHERE game_post_id=$1`, id)
	db.DB.Exec(`UPDATE admin_gamepost.admin SET saved_as_draft=FALSE, published_at=NOW() WHERE game_post_id=$1`, id)
	c.JSON(http.StatusOK, gin.H{"message": "Game post published"})
}

// ─── Admin: DELETE /api/cms/admin/gameposts/:id ───────────────────────────────
func DeleteGamePost(c *gin.Context) {
	id := c.Param("id")
	_, err := db.DB.Exec(`DELETE FROM gamepost.game_posts WHERE game_post_id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Game post deleted"})
}

// ─── Admin: GET /api/cms/admin/gameposts ─────────────────────────────────────
func AdminGetGamePosts(c *gin.Context) {
	rows, err := db.DB.Query(`
		SELECT gp.game_post_id, gp.slug, gp.status, gp.is_featured, gp.view_count,
		       gp.created_at, gp.updated_at,
		       COALESCE(h.game_title,'') AS game_title,
		       COALESCE(adm.saved_as_draft, TRUE) AS saved_as_draft,
		       adm.published_at
		FROM gamepost.game_posts gp
		LEFT JOIN gamepost.hero h ON h.game_post_id = gp.game_post_id
		LEFT JOIN admin_gamepost.admin adm ON adm.game_post_id = gp.game_post_id
		ORDER BY gp.updated_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type AdminItem struct {
		GamePostID   int         `json:"game_post_id"`
		Slug         string      `json:"slug"`
		Status       string      `json:"status"`
		IsFeatured   bool        `json:"is_featured"`
		ViewCount    int         `json:"view_count"`
		CreatedAt    interface{} `json:"created_at"`
		UpdatedAt    interface{} `json:"updated_at"`
		GameTitle    string      `json:"game_title"`
		SavedAsDraft bool        `json:"saved_as_draft"`
		PublishedAt  interface{} `json:"published_at"`
	}

	var items []AdminItem
	for rows.Next() {
		var it AdminItem
		var publishedAt sql.NullTime
		rows.Scan(&it.GamePostID, &it.Slug, &it.Status, &it.IsFeatured,
			&it.ViewCount, &it.CreatedAt, &it.UpdatedAt,
			&it.GameTitle, &it.SavedAsDraft, &publishedAt)
		if publishedAt.Valid {
			it.PublishedAt = publishedAt.Time
		}
		items = append(items, it)
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

// ─── Admin: PUT /api/cms/admin/gameposts/:id ──────────────────────────────────
func UpdateGamePost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var payload models.FullGamePost
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Confirm record exists and get current slug
	var existingSlug string
	if err := db.DB.QueryRow(`SELECT slug FROM gamepost.game_posts WHERE game_post_id=$1`, id).
		Scan(&existingSlug); err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Game post not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Check slug uniqueness if it is being changed
	newSlug := coalesce(payload.Slug, existingSlug)
	if newSlug != existingSlug {
		var conflictID int
		if err := db.DB.QueryRow(
			`SELECT game_post_id FROM gamepost.game_posts WHERE slug=$1 AND game_post_id!=$2`,
			newSlug, id).Scan(&conflictID); err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "slug already in use"})
			return
		}
	}

	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer tx.Rollback()

	// Root
	if _, err := tx.Exec(`
		UPDATE gamepost.game_posts
		SET slug=$1, status=$2, brand_color=$3, is_featured=$4, updated_at=NOW()
		WHERE game_post_id=$5`,
		newSlug, coalesce(payload.Status, "draft"),
		coalesce(payload.BrandColor, "#E53935"), payload.IsFeatured, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Hero (upsert)
	if h := payload.Hero; h != nil {
		tx.Exec(`
			INSERT INTO gamepost.hero
			    (game_post_id,game_title,game_desc_short,background_img,logo_img,cta_label,cta_href,trailer_url)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
			ON CONFLICT (game_post_id) DO UPDATE SET
			    game_title=$2, game_desc_short=$3, background_img=$4, logo_img=$5,
			    cta_label=$6, cta_href=$7, trailer_url=$8`,
			id, h.GameTitle, h.GameDescShort, h.BackgroundImg, h.LogoImg,
			h.CTALabel, h.CTAHref, h.TrailerURL)
	}

	// Game Info (upsert)
	if gi := payload.GameInfo; gi != nil {
		tx.Exec(`
			INSERT INTO gamepost.game_info
			    (game_post_id,developer,publisher,release_date,genres,platforms,profile_size_photo)
			VALUES ($1,$2,$3,$4::date,$5,$6,$7)
			ON CONFLICT (game_post_id) DO UPDATE SET
			    developer=$2, publisher=$3, release_date=$4::date,
			    genres=$5, platforms=$6, profile_size_photo=$7`,
			id, gi.Developer, gi.Publisher, nullStr(gi.ReleaseDate),
			gi.Genres, gi.Platforms, gi.ProfileSizePhoto)
	}

	// Storyline (upsert)
	if sl := payload.Storyline; sl != nil {
		tx.Exec(`
			INSERT INTO gamepost.storyline (game_post_id,paragraphs,summary) VALUES ($1,$2,$3)
			ON CONFLICT (game_post_id) DO UPDATE SET paragraphs=$2, summary=$3`,
			id, sl.Paragraphs, sl.Summary)
	}

	// Carousel (replace)
	tx.Exec(`DELETE FROM gamepost.carousel WHERE game_post_id=$1`, id)
	for _, ci := range payload.Carousel {
		tx.Exec(`INSERT INTO gamepost.carousel
			(game_post_id,media_type,yt_url,upload_url,caption,display_order)
			VALUES ($1,$2,$3,$4,$5,$6)`,
			id, ci.MediaType, ci.YTUrl, ci.UploadURL, ci.Caption, ci.DisplayOrder)
	}

	// Gameplay (upsert)
	if ga := payload.Gameplay; ga != nil {
		tx.Exec(`
			INSERT INTO gamepost.gameplay
			    (game_post_id,paragraph,gameplay_title,gameplay_title_desc)
			VALUES ($1,$2,$3,$4)
			ON CONFLICT (game_post_id) DO UPDATE SET
			    paragraph=$2, gameplay_title=$3, gameplay_title_desc=$4`,
			id, ga.Paragraph, ga.GameplayTitle, ga.GameplayTitleDesc)
	}

	// Gameplay Mechanics (replace)
	tx.Exec(`DELETE FROM gamepost.gameplay_mechanics WHERE game_post_id=$1`, id)
	for _, m := range payload.GameplayMechanics {
		tx.Exec(`INSERT INTO gamepost.gameplay_mechanics
			(game_post_id,title,description,display_order) VALUES ($1,$2,$3,$4)`,
			id, m.Title, m.Description, m.DisplayOrder)
	}

	// QCO (upsert)
	if qco := payload.QuickControlOverview; qco != nil {
		tx.Exec(`
			INSERT INTO gamepost.quick_control_overview (game_post_id,qco_title,qco_title_desc)
			VALUES ($1,$2,$3)
			ON CONFLICT (game_post_id) DO UPDATE SET qco_title=$2, qco_title_desc=$3`,
			id, qco.QCOTitle, qco.QCOTitleDesc)
	}

	// Control Cards (replace)
	tx.Exec(`DELETE FROM gamepost.control_cards WHERE game_post_id=$1`, id)
	for _, cc := range payload.ControlCards {
		tx.Exec(`INSERT INTO gamepost.control_cards
			(game_post_id,category,description,display_order) VALUES ($1,$2,$3,$4)`,
			id, cc.Category, cc.Description, cc.DisplayOrder)
	}

	// Modes (replace)
	tx.Exec(`DELETE FROM gamepost.modes WHERE game_post_id=$1`, id)
	for _, m := range payload.Modes {
		tx.Exec(`INSERT INTO gamepost.modes
			(game_post_id,mode_title,mode_titledesc,display_order) VALUES ($1,$2,$3,$4)`,
			id, m.ModeTitle, m.ModeTitleDesc, m.DisplayOrder)
	}

	// System Requirements (upsert)
	if sr := payload.SystemRequirement; sr != nil {
		tx.Exec(`
			INSERT INTO gamepost.system_requirement
			    (game_post_id,show_section,os_min,os_rec,processor_min,processor_rec,
			     memory_min,memory_rec,graphics_min,graphics_rec,storage_min,storage_rec,
			     directx_min,directx_rec)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
			ON CONFLICT (game_post_id) DO UPDATE SET
			    show_section=$2, os_min=$3, os_rec=$4, processor_min=$5, processor_rec=$6,
			    memory_min=$7, memory_rec=$8, graphics_min=$9, graphics_rec=$10,
			    storage_min=$11, storage_rec=$12, directx_min=$13, directx_rec=$14`,
			id, sr.ShowSection, sr.OsMin, sr.OsRec, sr.ProcessorMin, sr.ProcessorRec,
			sr.MemoryMin, sr.MemoryRec, sr.GraphicsMin, sr.GraphicsRec,
			sr.StorageMin, sr.StorageRec, sr.DirectxMin, sr.DirectxRec)
	}

	// Expert Reviews (replace)
	tx.Exec(`DELETE FROM gamepost.expert_reviews WHERE game_post_id=$1`, id)
	for _, er := range payload.ExpertReviews {
		tx.Exec(`INSERT INTO gamepost.expert_reviews
			(game_post_id,reviewer_name,outlet,rating,max_rating,quote,review_url,display_order)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
			id, er.ReviewerName, er.Outlet, er.Rating, er.MaxRating,
			er.Quote, er.ReviewURL, er.DisplayOrder)
	}

	// Get Game (replace)
	tx.Exec(`DELETE FROM gamepost.get_game WHERE game_post_id=$1`, id)
	for _, gg := range payload.GetGame {
		tx.Exec(`INSERT INTO gamepost.get_game
			(game_post_id,platform_name,affiliate_link,price_label,display_order)
			VALUES ($1,$2,$3,$4,$5)`,
			id, gg.PlatformName, gg.AffiliateLink, gg.PriceLabel, gg.DisplayOrder)
	}

	// DLCs (replace)
	tx.Exec(`DELETE FROM gamepost.dlcs WHERE game_post_id=$1`, id)
	for _, d := range payload.DLCs {
		tx.Exec(`INSERT INTO gamepost.dlcs
			(game_post_id,dlc_title,dlc_type,release_date,description,price_label,store_link,display_order)
			VALUES ($1,$2,$3,$4::date,$5,$6,$7,$8)`,
			id, d.DLCTitle, d.DLCType, nullStr(d.ReleaseDate),
			d.Description, d.PriceLabel, d.StoreLink, d.DisplayOrder)
	}

	// Awards (replace)
	tx.Exec(`DELETE FROM gamepost.awards_and_achievements WHERE game_post_id=$1`, id)
	for _, a := range payload.Awards {
		tx.Exec(`INSERT INTO gamepost.awards_and_achievements
			(game_post_id,aa_title,aa_type,year,organisation,display_order)
			VALUES ($1,$2,$3,$4,$5,$6)`,
			id, a.Title, a.Type, a.Year, a.Organisation, a.DisplayOrder)
	}

	// Related Games (replace)
	tx.Exec(`DELETE FROM gamepost.related_games WHERE game_post_id=$1`, id)
	for _, rg := range payload.RelatedGames {
		tx.Exec(`INSERT INTO gamepost.related_games
			(game_post_id,related_slug,display_order) VALUES ($1,$2,$3)`,
			id, rg.RelatedSlug, rg.DisplayOrder)
	}

	// Community Hub (upsert)
	if ch := payload.CommunityHub; ch != nil {
		tx.Exec(`
			INSERT INTO gamepost.community_hub
			    (game_post_id,community_branch_slug,show_live_chat,show_tournament_widget)
			VALUES ($1,$2,$3,$4)
			ON CONFLICT (game_post_id) DO UPDATE SET
			    community_branch_slug=$2, show_live_chat=$3, show_tournament_widget=$4`,
			id, ch.CommunityBranchSlug, ch.ShowLiveChat, ch.ShowTournamentWidget)
	}

	// Join Our Community (replace)
	tx.Exec(`DELETE FROM gamepost.join_our_community WHERE game_post_id=$1`, id)
	for _, jc := range payload.JoinOurCommunity {
		tx.Exec(`INSERT INTO gamepost.join_our_community
			(game_post_id,platform_name,platform_link,display_order) VALUES ($1,$2,$3,$4)`,
			id, jc.PlatformName, jc.PlatformLink, jc.DisplayOrder)
	}

	// Critic Rating (upsert)
	if cr := payload.CriticRating; cr != nil {
		tx.Exec(`
			INSERT INTO gamepost.critic_rating (game_post_id,score,label,signup_href)
			VALUES ($1,$2,$3,$4)
			ON CONFLICT (game_post_id) DO UPDATE SET score=$2, label=$3, signup_href=$4`,
			id, cr.Score, cr.Label, cr.SignupHref)
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	gp, err := fetchFullGamePost(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gp})
}

// ─── Public: POST /api/cms/gameposts/:slug/user-reviews ─────────────────────
func SubmitUserReview(c *gin.Context) {
	slug := c.Param("slug")

	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	userID := fmt.Sprintf("%v", userIDVal)

	username := "anonymous"
	if u, ok := c.Get("username"); ok {
		if us, ok := u.(string); ok && us != "" {
			username = us
		}
	}

	var body struct {
		Rating         int    `json:"rating"`
		Text           string `json:"text"`
		SubProfileType string `json:"sub_profile_type"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if body.Rating < 1 || body.Rating > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "rating must be between 1 and 5"})
		return
	}
	textLen := len([]rune(strings.TrimSpace(body.Text)))
	if textLen < 10 || textLen > 300 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "text must be 10–300 characters"})
		return
	}

	wordCount := len(strings.Fields(body.Text))
	reviewStatus := "pending"
	flagReason := ""
	if wordCount < 20 {
		reviewStatus = "flagged"
		flagReason = "too_short"
	} else if (body.Rating == 1 || body.Rating == 5) && wordCount < 30 {
		reviewStatus = "flagged"
		flagReason = "extreme_rating_no_context"
	}

	_, err := db.DB.Exec(`
		INSERT INTO user_reviews
		    (gamepost_slug, user_id, username, sub_profile_type, rating, text, status, flag_reason)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (gamepost_slug, user_id) DO UPDATE SET
		    rating           = EXCLUDED.rating,
		    text             = EXCLUDED.text,
		    sub_profile_type = EXCLUDED.sub_profile_type,
		    status           = EXCLUDED.status,
		    flag_reason      = EXCLUDED.flag_reason,
		    updated_at       = NOW()`,
		slug, userID, username, nullStr(body.SubProfileType),
		body.Rating, body.Text, reviewStatus, nullStr(flagReason))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"status":            "submitted",
		"moderation_status": reviewStatus,
	}})
}

// ─── Public: GET /api/cms/gameposts/:slug/user-reviews ──────────────────────
func GetUserReviews(c *gin.Context) {
	slug := c.Param("slug")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	orderBy := "helpful_votes DESC, created_at DESC"
	switch c.DefaultQuery("sort", "helpful") {
	case "recent":
		orderBy = "created_at DESC"
	case "highest":
		orderBy = "rating DESC, created_at DESC"
	case "lowest":
		orderBy = "rating ASC, created_at DESC"
	}

	// #nosec G201 — orderBy is built from an allowlist above, never from user input directly
	rows, err := db.DB.Query(fmt.Sprintf(`
		SELECT id, username, sub_profile_type, rating, text, helpful_votes, created_at
		FROM user_reviews
		WHERE gamepost_slug = $1 AND status = 'approved'
		ORDER BY %s
		LIMIT $2 OFFSET $3`, orderBy),
		slug, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type reviewRow struct {
		ID             string    `json:"id"`
		Username       string    `json:"username"`
		SubProfileType string    `json:"sub_profile_type"`
		Rating         int       `json:"rating"`
		Text           string    `json:"text"`
		HelpfulVotes   int       `json:"helpful_votes"`
		CreatedAt      time.Time `json:"created_at"`
	}

	var reviews []reviewRow
	for rows.Next() {
		var r reviewRow
		var subType sql.NullString
		if err := rows.Scan(&r.ID, &r.Username, &subType, &r.Rating, &r.Text, &r.HelpfulVotes, &r.CreatedAt); err != nil {
			log.Printf("GetUserReviews scan: %v", err)
			continue
		}
		r.SubProfileType = subType.String
		reviews = append(reviews, r)
	}

	var total int
	db.DB.QueryRow(`SELECT COUNT(*) FROM user_reviews WHERE gamepost_slug=$1 AND status='approved'`, slug).Scan(&total)

	c.JSON(http.StatusOK, gin.H{
		"data": reviews,
		"meta": gin.H{"total": total, "limit": limit, "offset": offset},
	})
}

func coalesce(s, fallback string) string {
	if s == "" {
		return fallback
	}
	return s
}

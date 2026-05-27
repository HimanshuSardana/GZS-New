package main

import (
	"fmt"
	"html"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync/atomic"
	"time"

	"gzonesphere-cms/db"
	"gzonesphere-cms/handlers"
	"gzonesphere-cms/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

var startTime = time.Now()
var totalRequests int64
var errorCount int64

func statsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		atomic.AddInt64(&totalRequests, 1)
		c.Next()
		if c.Writer.Status() >= 400 {
			atomic.AddInt64(&errorCount, 1)
		}
	}
}

func uptimeHuman(d time.Duration) string {
	h := int(d.Hours())
	m := int(d.Minutes()) % 60
	s := int(d.Seconds()) % 60
	return fmt.Sprintf("%dh %dm %ds", h, m, s)
}

func setupRouter(logWriter io.Writer) *gin.Engine {
	r := gin.New()
	r.Use(gin.LoggerWithWriter(logWriter))
	r.Use(gin.Recovery())
	r.Use(corsMiddleware())
	r.Use(statsMiddleware())
	return r
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	logFile, err := os.OpenFile("cms-api.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Printf("Warning: could not open log file: %v — logging to stdout only", err)
		logFile = os.Stdout
	} else {
		defer logFile.Close()
	}

	multiWriter := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(multiWriter)

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://gzs_cms_user:Gzone123%40@localhost:5432/GzoneSphere?sslmode=disable"
	}

	if err := db.InitDB(dsn); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	db.RunMigrations()

	if os.Getenv("ENV") == "development" {
		db.SeedData()
	}

	if os.Getenv("ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := setupRouter(multiWriter)

	// ── Health ────────────────────────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		dbStatus := db.GetStatus()
		httpStatus := http.StatusOK
		apiStatus := "healthy"
		if connected, ok := dbStatus["connected"].(bool); !ok || !connected {
			httpStatus = http.StatusServiceUnavailable
			apiStatus = "degraded"
		}
		c.JSON(httpStatus, gin.H{
			"status":   apiStatus,
			"service":  "GzoneSphere CMS API",
			"version":  "1.0.0",
			"database": dbStatus,
		})
	})

	// ── Stats JSON ────────────────────────────────────────────────────────────
	r.GET("/stats", func(c *gin.Context) {
		uptime := time.Since(startTime)
		routes := r.Routes()
		routeList := make([]string, 0, len(routes))
		for _, rt := range routes {
			routeList = append(routeList, rt.Method+" "+rt.Path)
		}
		c.JSON(http.StatusOK, gin.H{
			"service":        "GzoneSphere CMS API",
			"version":        "1.0.0",
			"status":         "ONLINE",
			"environment":    os.Getenv("ENV"),
			"uptime_seconds": int64(uptime.Seconds()),
			"uptime_human":   uptimeHuman(uptime),
			"started_at":     startTime.UTC().Format(time.RFC3339),
			"database":       db.GetStatus(),
			"requests": gin.H{
				"total":  atomic.LoadInt64(&totalRequests),
				"errors": atomic.LoadInt64(&errorCount),
			},
			"routes": routeList,
		})
	})

	// ── Stats UI ──────────────────────────────────────────────────────────────
	r.GET("/stats/ui", func(c *gin.Context) {
		uptime := time.Since(startTime)
		dbStatus := db.GetStatus()
		dbConnected, _ := dbStatus["connected"].(bool)

		// DB connection badge
		dbConnBadge := `<span class="badge-off">DISCONNECTED</span>`
		if dbConnected {
			dbConnBadge = `<span class="badge-on">CONNECTED</span>`
		}

		// DB pool rows (only shown when connected)
		var dbPoolHTML string
		if dbConnected {
			open, _ := dbStatus["open_connections"].(int)
			inUse, _ := dbStatus["in_use"].(int)
			idle, _ := dbStatus["idle"].(int)
			dbPoolHTML = fmt.Sprintf(`
			<div class="row"><span class="lbl">Open connections</span><span class="val">%d</span></div>
			<div class="row"><span class="lbl">In use</span><span class="val">%d</span></div>
			<div class="row"><span class="lbl">Idle</span><span class="val">%d</span></div>`,
				open, inUse, idle)
		} else {
			errMsg, _ := dbStatus["error"].(string)
			dbPoolHTML = fmt.Sprintf(
				`<div class="row"><span class="lbl">Error</span><span class="val err">%s</span></div>`,
				html.EscapeString(errMsg),
			)
		}

		// Route list
		routes := r.Routes()
		var routesHTML strings.Builder
		for _, rt := range routes {
			routesHTML.WriteString(fmt.Sprintf(
				`<div class="route"><span class="method">%s</span>%s</div>`,
				html.EscapeString(rt.Method),
				html.EscapeString(rt.Path),
			))
		}

		page := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="5">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GZS CMS · Stats</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d0d;color:#d1d5db;font-family:'JetBrains Mono','Fira Code','Courier New',monospace;padding:2rem;min-height:100vh}
.logo{font-size:1.9rem;font-weight:700;color:#f59e0b;letter-spacing:.2em;margin-bottom:.2rem}
.sub{color:#4b5563;font-size:.75rem;margin-bottom:2.5rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem;margin-bottom:1.25rem}
.card{background:#141414;border:1px solid #242424;border-radius:6px;padding:1.25rem}
.card-title{color:#f59e0b;font-size:.65rem;letter-spacing:.18em;text-transform:uppercase;padding-bottom:.55rem;margin-bottom:.85rem;border-bottom:1px solid #242424}
.row{display:flex;justify-content:space-between;align-items:center;padding:.28rem 0;font-size:.8rem}
.lbl{color:#6b7280}
.val{color:#f3f4f6;font-weight:700}
.val.err{color:#f87171}
.big{color:#fbbf24;font-size:1.6rem;font-weight:700}
.badge-on{background:#022c22;color:#34d399;padding:.12rem .55rem;border-radius:4px;font-size:.7rem;border:1px solid #065f46}
.badge-off{background:#450a0a;color:#f87171;padding:.12rem .55rem;border-radius:4px;font-size:.7rem;border:1px solid #7f1d1d}
.routes-card{background:#141414;border:1px solid #242424;border-radius:6px;padding:1.25rem}
.route{padding:.25rem 0;font-size:.77rem;color:#6b7280;border-bottom:1px solid #1a1a1a}
.route:last-child{border-bottom:none}
.method{color:#f59e0b;min-width:58px;display:inline-block;font-weight:700}
.footer{color:#374151;font-size:.68rem;text-align:right;margin-top:1.25rem}
</style>
</head>
<body>

<div class="logo">&#9670; GZS CMS</div>
<div class="sub">GzoneSphere CMS API &nbsp;&middot;&nbsp; Stats Dashboard &nbsp;&middot;&nbsp; auto-refreshes every 5&thinsp;s</div>

<div class="grid">

  <div class="card">
    <div class="card-title">Service</div>
    <div class="row"><span class="lbl">Status</span><span class="badge-on">ONLINE</span></div>
    <div class="row"><span class="lbl">Version</span><span class="val">v1.0.0</span></div>
    <div class="row"><span class="lbl">Environment</span><span class="val">%s</span></div>
    <div class="row"><span class="lbl">Started at</span><span class="val">%s</span></div>
  </div>

  <div class="card">
    <div class="card-title">Uptime</div>
    <div class="row"><span class="lbl">Human</span><span class="val">%s</span></div>
    <div class="row"><span class="lbl">Seconds</span><span class="val">%d</span></div>
  </div>

  <div class="card">
    <div class="card-title">Requests</div>
    <div class="row"><span class="lbl">Total</span><span class="big">%d</span></div>
    <div class="row"><span class="lbl">Errors (4xx / 5xx)</span><span class="val err">%d</span></div>
  </div>

  <div class="card">
    <div class="card-title">Database</div>
    <div class="row"><span class="lbl">Connection</span>%s</div>
    %s
  </div>

</div>

<div class="routes-card">
  <div class="card-title">Registered Routes &nbsp;(%d)</div>
  %s
</div>

<div class="footer">&#10227; auto-refresh every 5&thinsp;s &nbsp;&middot;&nbsp; rendered %s UTC</div>

</body>
</html>`,
			html.EscapeString(os.Getenv("ENV")),
			startTime.UTC().Format("2006-01-02 15:04:05"),
			uptimeHuman(uptime),
			int64(uptime.Seconds()),
			atomic.LoadInt64(&totalRequests),
			atomic.LoadInt64(&errorCount),
			dbConnBadge,
			dbPoolHTML,
			len(routes),
			routesHTML.String(),
			time.Now().UTC().Format("15:04:05"),
		)

		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(page))
	})

	// ── Public CMS Routes ─────────────────────────────────────────────────────
	cms := r.Group("/api/cms")
	{
		cms.GET("/games", handlers.GetGames)
		cms.GET("/games/featured", handlers.GetFeaturedGames)
		cms.GET("/games/trending", handlers.GetTrendingGames)
		cms.GET("/games/:slug", handlers.GetGameBySlug)
		cms.GET("/games/:slug/reviews", handlers.GetGameReviews)

		cms.GET("/gameposts", handlers.GetGamePosts)
		cms.GET("/gameposts/:slug", handlers.GetGamePostBySlug)
		cms.POST("/gameposts/:slug/user-reviews", middleware.RequireAuth, handlers.SubmitUserReview)
		cms.GET("/gameposts/:slug/user-reviews", handlers.GetUserReviews)

		cms.GET("/blogs", handlers.GetBlogs)
		cms.GET("/blogs/featured", handlers.GetFeaturedBlogs)
		cms.GET("/blogs/most-read", handlers.GetMostReadBlogs)
		cms.GET("/blogs/trending", handlers.GetTrendingBlogs)
		cms.GET("/blogs/:slug", handlers.GetBlogBySlug)
		cms.POST("/blogs/:slug/like", handlers.LikeBlog)
		cms.GET("/blogs/:slug/comments", handlers.GetBlogComments)
		cms.POST("/blogs/:slug/comments", middleware.RequireAuth, handlers.CreateBlogComment)
		cms.POST("/blogs/:slug/comments/:commentId/like", middleware.RequireAuth, handlers.LikeBlogComment)
		cms.POST("/blogs/:slug/comments/:commentId/report", middleware.RequireAuth, handlers.ReportBlogComment)
	}

	// ── Admin Routes (Protected) ──────────────────────────────────────────────
	admin := r.Group("/api/cms/admin")
	admin.Use(middleware.RequireAdmin)
	{
		admin.POST("/games", handlers.CreateGame)
		admin.PATCH("/games/:id", handlers.UpdateGame)
		admin.PATCH("/games/:id/trending-signals", handlers.UpdateTrendingSignals)

		admin.GET("/gameposts", handlers.AdminGetGamePosts)
		admin.POST("/gameposts", handlers.CreateGamePost)
		admin.PUT("/gameposts/:id", handlers.UpdateGamePost)
		admin.PUT("/gameposts/:id/publish", handlers.PublishGamePost)
		admin.DELETE("/gameposts/:id", handlers.DeleteGamePost)

		admin.POST("/blogs", handlers.CreateBlog)
		admin.PATCH("/blogs/:id", handlers.UpdateBlog)
		admin.PATCH("/blogs/:id/signals", handlers.UpdateBlogSignals)

		admin.GET("/hub-settings", handlers.GetHubSettings)
		admin.PUT("/hub-settings", handlers.SaveHubSettings)

		admin.GET("/dashboard/queues", handlers.GetAdminDashboardQueues)
	}

	// ── Start Server ──────────────────────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("================================")
	log.Printf("  GzoneSphere CMS API v1.0")
	log.Printf("  ENV: %s | PORT: %s", os.Getenv("ENV"), port)
	log.Printf("  DB: connected=%v", db.DBConnected)
	log.Println("================================")

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origins := os.Getenv("ALLOWED_ORIGINS")
		origin := c.Request.Header.Get("Origin")

		if origins == "*" || origins == "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		} else {
			allowList := strings.Split(origins, ",")
			for _, o := range allowList {
				if o == origin {
					c.Writer.Header().Set("Access-Control-Allow-Origin", o)
					break
				}
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

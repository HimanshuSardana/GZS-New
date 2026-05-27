package models

import "time"

// ─── Root ────────────────────────────────────────────────────────────────────

type GamePost struct {
	GamePostID int       `json:"game_post_id"`
	Slug       string    `json:"slug"`
	Status     string    `json:"status"`
	BrandColor string    `json:"brand_color"`
	IsFeatured bool      `json:"is_featured"`
	ViewCount  int       `json:"view_count"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// ─── Sections ─────────────────────────────────────────────────────────────────

type Hero struct {
	GamePostID    int    `json:"game_post_id"`
	GameTitle     string `json:"game_title"`
	GameDescShort string `json:"game_desc_short"`
	BackgroundImg string `json:"background_img"`
	LogoImg       string `json:"logo_img"`
	CTALabel      string `json:"cta_label"`
	CTAHref       string `json:"cta_href"`
	TrailerURL    string `json:"trailer_url"`
}

type GameInfo struct {
	GamePostID       int    `json:"game_post_id"`
	Developer        string `json:"developer"`
	Publisher        string `json:"publisher"`
	ReleaseDate      string `json:"release_date"`
	Genres           string `json:"genres"`
	Platforms        string `json:"platforms"`
	ProfileSizePhoto string `json:"profile_size_photo"`
}

type Storyline struct {
	GamePostID int    `json:"game_post_id"`
	Paragraphs string `json:"paragraphs"`
	Summary    string `json:"summary"`
}

type CarouselItem struct {
	CarouselID   int    `json:"carousel_id"`
	GamePostID   int    `json:"game_post_id"`
	MediaType    string `json:"media_type"`
	YTUrl        string `json:"yt_url"`
	UploadURL    string `json:"upload_url"`
	Caption      string `json:"caption"`
	DisplayOrder int    `json:"display_order"`
}

type Gameplay struct {
	GamePostID        int    `json:"game_post_id"`
	Paragraph         string `json:"paragraph"`
	GameplayTitle     string `json:"gameplay_title"`
	GameplayTitleDesc string `json:"gameplay_title_desc"`
}

type GameplayMechanic struct {
	MechanicID   int    `json:"mechanic_id"`
	GamePostID   int    `json:"game_post_id"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	DisplayOrder int    `json:"display_order"`
}

type QuickControlOverview struct {
	GamePostID   int    `json:"game_post_id"`
	QCOTitle     string `json:"qco_title"`
	QCOTitleDesc string `json:"qco_title_desc"`
}

type ControlCard struct {
	CardID       int    `json:"card_id"`
	GamePostID   int    `json:"game_post_id"`
	Category     string `json:"category"`
	Description  string `json:"description"`
	DisplayOrder int    `json:"display_order"`
}

type GameMode struct {
	ModesID       int    `json:"modes_id"`
	GamePostID    int    `json:"game_post_id"`
	ModeTitle     string `json:"mode_title"`
	ModeTitleDesc string `json:"mode_titledesc"`
	DisplayOrder  int    `json:"display_order"`
}

type SystemRequirement struct {
	GamePostID   int    `json:"game_post_id"`
	ShowSection  bool   `json:"show_section"`
	OsMin        string `json:"os_min"`
	OsRec        string `json:"os_rec"`
	ProcessorMin string `json:"processor_min"`
	ProcessorRec string `json:"processor_rec"`
	MemoryMin    string `json:"memory_min"`
	MemoryRec    string `json:"memory_rec"`
	GraphicsMin  string `json:"graphics_min"`
	GraphicsRec  string `json:"graphics_rec"`
	StorageMin   string `json:"storage_min"`
	StorageRec   string `json:"storage_rec"`
	DirectxMin   string `json:"directx_min"`
	DirectxRec   string `json:"directx_rec"`
}

type ExpertReview struct {
	ReviewID     int     `json:"review_id"`
	GamePostID   int     `json:"game_post_id"`
	ReviewerName string  `json:"reviewer_name"`
	Outlet       string  `json:"outlet"`
	Rating       float64 `json:"rating"`
	MaxRating    float64 `json:"max_rating"`
	Quote        string  `json:"quote"`
	ReviewURL    string  `json:"review_url"`
	DisplayOrder int     `json:"display_order"`
}

type GetGame struct {
	GetGameID     int    `json:"get_game_id"`
	GamePostID    int    `json:"game_post_id"`
	PlatformName  string `json:"platform_name"`
	AffiliateLink string `json:"affiliate_link"`
	PriceLabel    string `json:"price_label"`
	DisplayOrder  int    `json:"display_order"`
}

type DLC struct {
	DLCID        int    `json:"dlc_id"`
	GamePostID   int    `json:"game_post_id"`
	DLCTitle     string `json:"dlc_title"`
	DLCType      string `json:"dlc_type"`
	ReleaseDate  string `json:"release_date"`
	Description  string `json:"description"`
	PriceLabel   string `json:"price_label"`
	StoreLink    string `json:"store_link"`
	DisplayOrder int    `json:"display_order"`
}

type Award struct {
	AAID         int    `json:"aa_id"`
	GamePostID   int    `json:"game_post_id"`
	Title        string `json:"aa_title"`
	Type         string `json:"aa_type"`
	Year         int    `json:"year"`
	Organisation string `json:"organisation"`
	DisplayOrder int    `json:"display_order"`
}

type RelatedGame struct {
	RelatedID    int    `json:"related_id"`
	GamePostID   int    `json:"game_post_id"`
	RelatedSlug  string `json:"related_slug"`
	DisplayOrder int    `json:"display_order"`
}

type CommunityHub struct {
	GamePostID           int    `json:"game_post_id"`
	CommunityBranchSlug  string `json:"community_branch_slug"`
	ShowLiveChat         bool   `json:"show_live_chat"`
	ShowTournamentWidget bool   `json:"show_tournament_widget"`
}

type JoinCommunityLink struct {
	CommunityID  int    `json:"community_id"`
	GamePostID   int    `json:"game_post_id"`
	PlatformName string `json:"platform_name"`
	PlatformLink string `json:"platform_link"`
	DisplayOrder int    `json:"display_order"`
}

type CriticRating struct {
	GamePostID int     `json:"game_post_id"`
	Score      float64 `json:"score"`
	Label      string  `json:"label"`
	SignupHref string  `json:"signup_href"`
}

// ─── Full Game Post (what the frontend receives) ──────────────────────────────

type FullGamePost struct {
	GamePost
	Hero                 *Hero                 `json:"hero"`
	GameInfo             *GameInfo             `json:"game_info"`
	Storyline            *Storyline            `json:"storyline"`
	Carousel             []CarouselItem        `json:"carousel"`
	Gameplay             *Gameplay             `json:"gameplay"`
	GameplayMechanics    []GameplayMechanic    `json:"gameplay_mechanics"`
	QuickControlOverview *QuickControlOverview `json:"quick_control_overview"`
	ControlCards         []ControlCard         `json:"control_cards"`
	Modes                []GameMode            `json:"modes"`
	SystemRequirement    *SystemRequirement    `json:"system_requirement"`
	ExpertReviews        []ExpertReview        `json:"expert_reviews"`
	GetGame              []GetGame             `json:"get_game"`
	DLCs                 []DLC                 `json:"dlcs"`
	Awards               []Award               `json:"awards_and_achievements"`
	RelatedGames         []RelatedGame         `json:"related_games"`
	CommunityHub         *CommunityHub         `json:"community_hub"`
	JoinOurCommunity     []JoinCommunityLink   `json:"join_our_community"`
	CriticRating         *CriticRating         `json:"critic_rating"`
}

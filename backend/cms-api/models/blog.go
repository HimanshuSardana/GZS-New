package models

import (
	"time"
)

type BlogPost struct {
	ID               string     `json:"id"`
	Slug             string     `json:"slug"`
	Title            string     `json:"title"`
	Content          string     `json:"content"`
	ContentPlain     string     `json:"content_plain"`
	Excerpt          string     `json:"excerpt"`
	Category         string     `json:"category"`
	BlogType         string     `json:"blog_type"`
	AuthorID         string     `json:"author_id"`
	AuthorUsername   string     `json:"author_username"`
	AuthorDomain     string     `json:"author_domain"`
	HeroImageURL     string     `json:"hero_image_url"`
	IsFeatured       bool       `json:"is_featured"`
	ViewCount        int        `json:"view_count"`
	LikeCount        int        `json:"like_count"`
	ReadTimeMinutes  int        `json:"read_time_minutes"`
	Status           string     `json:"status"`
	GameSlug         string     `json:"game_slug"`
	Tags             []string   `json:"tags"`
	PublishedAt      *time.Time `json:"published_at"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type BlogResponse struct {
	Data interface{} `json:"data"`
	Meta interface{} `json:"meta,omitempty"`
}

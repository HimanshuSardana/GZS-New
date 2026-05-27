package models

import (
	"time"
)

type Game struct {
	ID               string    `json:"id"`
	Slug             string    `json:"slug"`
	Title            string    `json:"title"`
	Description      string    `json:"description"`
	ShortDescription string    `json:"short_description"`
	Developer        string    `json:"developer"`
	Publisher        string    `json:"publisher"`
	ReleaseDate      time.Time `json:"release_date"`
	Status           string    `json:"status"`
	IsFeatured       bool      `json:"is_featured"`
	ViewCount        int       `json:"view_count"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type GameResponse struct {
	Data interface{} `json:"data"`
	Meta interface{} `json:"meta,omitempty"`
}

package db

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB
var DBConnected bool

func InitDB(dsn string) error {
	var err error
	for attempt := 1; attempt <= 10; attempt++ {
		DB, err = sql.Open("postgres", dsn)
		if err == nil {
			DB.SetMaxOpenConns(25)
			DB.SetMaxIdleConns(10)
			DB.SetConnMaxLifetime(5 * time.Minute)
			if pingErr := DB.Ping(); pingErr == nil {
				DBConnected = true
				log.Printf("✅ PostgreSQL connected on attempt %d", attempt)
				return nil
			} else {
				err = pingErr
			}
		}
		log.Printf("⚠️  DB connect attempt %d/10: %v", attempt, err)
		if attempt < 10 {
			time.Sleep(3 * time.Second)
		}
	}
	DBConnected = false
	return fmt.Errorf("❌ could not connect to PostgreSQL after 10 attempts: %v", err)
}

func GetStatus() map[string]interface{} {
	status := map[string]interface{}{"connected": DBConnected}
	if DB != nil {
		if err := DB.Ping(); err == nil {
			stats := DB.Stats()
			status["connected"] = true
			status["open_connections"] = stats.OpenConnections
			status["in_use"] = stats.InUse
			status["idle"] = stats.Idle
		} else {
			status["connected"] = false
			status["error"] = err.Error()
		}
	}
	return status
}

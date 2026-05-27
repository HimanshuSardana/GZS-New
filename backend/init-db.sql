-- GzoneSphere Database Initialization
-- Extensions only — all tables are created automatically by the APIs on startup:
--   Core API (Python/FastAPI):  SQLAlchemy Base.metadata.create_all() + run_migrations()
--   CMS  API (Go/Gin):          db.RunMigrations() + db.SeedData()

-- Create app roles if they don't already exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gzs_core_user') THEN
    CREATE ROLE gzs_core_user LOGIN PASSWORD 'Gzone123@';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gzs_cms_user') THEN
    CREATE ROLE gzs_cms_user LOGIN PASSWORD 'Gzone123@';
  END IF;
END $$;

-- Database is created by POSTGRES_DB env var in Docker; grant privileges here
GRANT ALL PRIVILEGES ON DATABASE GzoneSphere TO gzs_core_user;
GRANT ALL PRIVILEGES ON DATABASE GzoneSphere TO gzs_cms_user;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

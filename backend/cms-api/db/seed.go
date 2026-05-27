package db

import (
	"fmt"
	"log"
	"time"

	"github.com/lib/pq"
)

// SeedData is the entry point called from main.go when ENV=development.
func SeedData() {
	log.Println("🌱 ── Development seed starting ──────────────────────────")
	SeedLegacyGames()
	SeedGamePosts()
	SeedBlogs()
	log.Println("🌱 ── Development seed complete ──────────────────────────")
}

// ─── helper: simple HTML tag stripper for content_plain ──────────────────────

func stripHTML(s string) string {
	out := make([]byte, 0, len(s))
	inTag := false
	for i := 0; i < len(s); i++ {
		switch s[i] {
		case '<':
			inTag = true
		case '>':
			inTag = false
			out = append(out, ' ')
		default:
			if !inTag {
				out = append(out, s[i])
			}
		}
	}
	return string(out)
}

// ─── helper: parse ISO date string → time.Time (returns zero on failure) ─────

func parseDate(s string) time.Time {
	t, _ := time.Parse("2006-01-02", s)
	return t
}

func parseRFC3339(s string) time.Time {
	t, _ := time.Parse(time.RFC3339, s)
	return t
}

// ══════════════════════════════════════════════════════════════════════════════
// LEGACY FLAT GAMES TABLE  (mirrors MOCK_GAMES_LIST in gamesData.js)
// ══════════════════════════════════════════════════════════════════════════════

func SeedLegacyGames() {
	var count int
	if err := DB.QueryRow("SELECT COUNT(*) FROM games").Scan(&count); err != nil {
		log.Printf("❌  SeedLegacyGames: count failed: %v", err)
		return
	}
	if count > 0 {
		log.Printf("⏭   SeedLegacyGames: already seeded (%d rows) — skip", count)
		return
	}

	type row struct {
		Slug, Title, Desc, Short, Dev, Pub string
		Released                           string
		Featured                           bool
		Views                              int
	}

	rows := []row{
		{"valorant", "Valorant",
			"A 5v5 character-based tactical shooter where precise gunplay meets unique agent abilities.",
			"Tactical character-based shooter.",
			"Riot Games", "Riot Games", "2020-06-02", true, 45200},
		{"cs2", "Counter-Strike 2",
			"The successor to CS:GO, built on the Source 2 engine with improved graphics and sub-tick updates.",
			"The competitive tactical shooter benchmark.",
			"Valve", "Valve", "2023-09-27", false, 38900},
		{"bgmi", "Battlegrounds Mobile India",
			"The specifically curated battle royale experience built for India.",
			"Battle Royale on your mobile.",
			"Krafton", "Krafton", "2021-07-02", true, 52000},
		{"league-of-legends", "League of Legends",
			"A team-based strategy game where two teams of five powerful champions face off.",
			"The world's most popular MOBA.",
			"Riot Games", "Riot Games", "2009-10-27", true, 65400},
		{"cyberpunk-2077", "Cyberpunk 2077",
			"An open-world action-adventure story set in Night City, a megalopolis of power and danger.",
			"Become V in the heart of Night City.",
			"CD Projekt Red", "CD Projekt Red", "2020-12-10", true, 89000},
		{"hollow-knight", "Hollow Knight",
			"An epic action adventure through a vast ruined kingdom of insects and heroes.",
			"Challenging 2D action-adventure in a ruined kingdom.",
			"Team Cherry", "Team Cherry", "2017-02-24", false, 32000},
		{"elden-ring", "Elden Ring",
			"A vast open-world action RPG set in the Lands Between, crafted by FromSoftware and George R.R. Martin.",
			"Open-world action RPG from FromSoftware.",
			"FromSoftware", "Bandai Namco Entertainment", "2022-02-25", true, 74000},
		{"minecraft", "Minecraft",
			"A sandbox game about placing blocks and going on adventures in an infinite world.",
			"Build anything you can imagine.",
			"Mojang Studios", "Microsoft", "2011-11-18", true, 41000},
	}

	log.Printf("🎮  SeedLegacyGames: inserting %d rows…", len(rows))
	ok := 0
	for _, r := range rows {
		_, err := DB.Exec(`
			INSERT INTO games
				(slug, title, description, short_description, developer, publisher,
				 release_date, status, is_featured, view_count)
			VALUES ($1,$2,$3,$4,$5,$6,$7,'published',$8,$9)`,
			r.Slug, r.Title, r.Desc, r.Short, r.Dev, r.Pub,
			parseDate(r.Released), r.Featured, r.Views)
		if err != nil {
			log.Printf("  ❌  games %s: %v", r.Slug, err)
		} else {
			log.Printf("  ✅  games %s", r.Slug)
			ok++
		}
	}
	log.Printf("✅  SeedLegacyGames: %d/%d inserted", ok, len(rows))
}

// ══════════════════════════════════════════════════════════════════════════════
// GAMEPOST SCHEMA  (mirrors GAMES object in gameData.js)
// ══════════════════════════════════════════════════════════════════════════════

// ─── seed-data types ─────────────────────────────────────────────────────────

type gpMechanic struct {
	Title, Desc string
	Order       int
}

type gpControlCard struct {
	Category, Desc string
	Order          int
}

type gpMode struct {
	Title, TitleDesc string
	Order            int
}

type gpReview struct {
	Reviewer, Outlet string
	Rating, MaxRating float64
	Quote, URL       string
	Order            int
}

type gpLink struct {
	Platform, Link, Price string
	Order                 int
}

type gpAward struct {
	Pt, Title, Type string
	Order           int
}

type gamePostSeed struct {
	// root
	Slug, Status, BrandColor string
	IsFeatured               bool
	ViewCount                int

	// hero
	HeroTitle, HeroDesc, HeroBG, HeroLogo, HeroTrailer string

	// game_info
	GIDev, GIPub, GIRelease, GIGenres, GIPlatforms string

	// storyline
	Story string

	// gameplay (single main row)
	GPTitle, GPDesc, GPPara string
	// gameplay_mechanics (multi)
	Mechanics []gpMechanic

	// quick_control_overview (single main row)
	QCOTitle, QCODesc string
	// control_cards (multi)
	Controls []gpControlCard

	// modes (multi)
	Modes []gpMode

	// system_requirement
	OSMin, OSRec, CPUMin, CPURec, RAMMin, RAMRec string
	GPUMin, GPURec, StoreMin, StoreRec, DXMin, DXRec string

	// expert_reviews, get_game, awards
	Reviews []gpReview
	Links   []gpLink
	Awards  []gpAward

	// critic_rating
	CriticScore float64
	CriticLabel string

	// community_hub
	HubSlug              string
	ShowChat, ShowTourney bool
}

// ─── the five games ───────────────────────────────────────────────────────────

var gameSeeds = []gamePostSeed{

	// ── 1. VALORANT ───────────────────────────────────────────────────────────
	{
		Slug: "valorant", Status: "published", BrandColor: "#e53935",
		IsFeatured: true, ViewCount: 45200,

		HeroTitle:   "VALORANT",
		HeroDesc:    "A competitive 5v5 tactical shooter where precision gunplay meets unique agent abilities.",
		HeroBG:      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1920",
		HeroTrailer: "https://www.youtube.com/watch?v=e_E96Yy1v6Y",

		GIDev: "Riot Games", GIPub: "Riot Games",
		GIRelease: "2020-06-02", GIGenres: "Tactical · Shooter · Multiplayer", GIPlatforms: "PC",

		Story: "In the near future, Earth is permanently altered by a mysterious global event known as First Light. This awakens latent abilities in select individuals across the world, transforming them into powerful agents with unique skills. A shadowy organization known as Kingdom Corporation has risen to power, controlling a new energy source called Radianite. You are an agent of the VALORANT Protocol — fight for what you believe in.",

		GPTitle: "PRECISION GUNPLAY",
		GPDesc:  "Shooting mechanics reward accuracy and recoil control above all else.",
		GPPara:  "Every bullet matters. Learn each weapon's recoil pattern and adapt your style to the situation.",

		Mechanics: []gpMechanic{
			{"PRECISION GUNPLAY", "Shooting mechanics reward accuracy and recoil control above all else.", 0},
			{"AGENT ABILITIES", "Each agent brings unique tactical skills — combine them with gunplay to create devastating combos.", 1},
		},

		QCOTitle: "MOVEMENT", QCODesc: "Use W A S D to move. Hold Shift to walk silently.",
		Controls: []gpControlCard{
			{"MOVEMENT", "W A S D to move. Shift to walk silently. Crouch with Ctrl.", 0},
			{"COMBAT", "Left click to fire. Right click to aim down sights. R to reload.", 1},
			{"ABILITIES", "Q / E / C / X to activate agent abilities. Hold for charged variants.", 2},
			{"SPIKE", "4 to equip spike. Hold F near site to plant or defuse.", 3},
		},

		Modes: []gpMode{
			{"UNRATED", "Casual 5v5 matches with no rank on the line.", 0},
			{"COMPETITIVE", "Ranked play — earn your way to Radiant.", 1},
			{"SPIKE RUSH", "Shorter rounds, random weapons, always a good time.", 2},
			{"DEATHMATCH", "Free-for-all warmup mode to sharpen your aim.", 3},
		},

		OSMin: "Windows 10 64-bit", OSRec: "Windows 11 64-bit",
		CPUMin: "Intel Core i3-4150 / AMD Athlon 200GE", CPURec: "Intel Core i5-4460 / AMD Ryzen 5 1600",
		RAMMin: "4 GB RAM", RAMRec: "8 GB RAM",
		GPUMin: "Intel HD 4000 / AMD Radeon R5 200", GPURec: "NVIDIA GTX 1050 Ti / AMD RX 570",
		StoreMin: "30 GB", StoreRec: "30 GB",
		DXMin: "DirectX 11", DXRec: "DirectX 12",

		Reviews: []gpReview{
			{"IGN", "IGN", 9, 10, "Outstanding tactical shooter with excellent agent variety.", "https://ign.com", 0},
			{"GameSpot", "GameSpot", 8, 10, "A near-perfect blend of CS precision and Overwatch-style abilities.", "https://gamespot.com", 1},
			{"PCGamer", "PCGamer", 88, 100, "Crisp, competitive, and absolutely worth your time.", "https://pcgamer.com", 2},
		},
		Links: []gpLink{
			{"Riot Games Store", "https://playvalorant.com", "Free to Play", 0},
		},
		Awards: []gpAward{
			{"Best Multiplayer — The Game Awards 2021", "Best Multiplayer", "Award", 0},
			{"Most Played FPS — Steam Charts 2022", "Most Played FPS", "Recognition", 1},
		},
		CriticScore: 8.6, CriticLabel: "Outstanding",
		HubSlug: "esports", ShowChat: true, ShowTourney: true,
	},

	// ── 2. ELDEN RING ─────────────────────────────────────────────────────────
	{
		Slug: "elden-ring", Status: "published", BrandColor: "#c8a951",
		IsFeatured: true, ViewCount: 74000,

		HeroTitle:   "ELDEN RING",
		HeroDesc:    "A vast open world forged by Hidetaka Miyazaki and George R.R. Martin. Rise, Tarnished.",
		HeroBG:      "https://images.unsplash.com/photo-1624204386084-dd8d0fc1c5b9?w=1920",
		HeroTrailer: "https://www.youtube.com/watch?v=E3Huy2cdih0",

		GIDev: "FromSoftware", GIPub: "Bandai Namco Entertainment",
		GIRelease: "2022-02-25",
		GIGenres:  "Action RPG · Soulslike · Open World",
		GIPlatforms: "PC · PS5 · PS4 · Xbox Series X|S · Xbox One",

		Story: "The Elden Ring has been shattered. The Golden Order is broken. In the Lands Between ruled by Queen Marika the Eternal, you are a Tarnished — exiled from the grace of the Erdtree and called back to the shattered realm. Forge your path through an open world crafted by Hidetaka Miyazaki and novelist George R.R. Martin. Conquer the demigods, claim their Great Runes, and become the Elden Lord.",

		GPTitle: "OPEN WORLD EXPLORATION",
		GPDesc:  "A seamless open world teeming with danger, legacy dungeons, and hidden secrets.",
		GPPara:  "Traverse the six major regions of the Lands Between on horseback. Every cliff, ruin, and cave hides something worth finding.",

		Mechanics: []gpMechanic{
			{"OPEN WORLD EXPLORATION", "A seamless open world teeming with danger, legacy dungeons, and hidden secrets.", 0},
			{"SOULSLIKE COMBAT", "Punishing but fair — every enemy demands attention, positioning, and pattern recognition.", 1},
			{"LEGACY DUNGEONS", "Massive hand-crafted dungeons rival any level in FromSoftware history.", 2},
		},

		QCOTitle: "MOVEMENT", QCODesc: "WASD to move. Space to dodge. Hold Space to sprint.",
		Controls: []gpControlCard{
			{"MOVEMENT", "WASD to move. Space to dodge roll. Double-tap Space for back-step.", 0},
			{"COMBAT", "Left click — light attack. Right click — heavy attack. Middle click — guard.", 1},
			{"MAGIC / FP", "Hold Shift + R to cast equipped spell or incantation. Manage FP carefully.", 2},
			{"STEALTH", "Crouch with Ctrl near enemies to enter stealth. Backstabs deal massive damage.", 3},
		},

		Modes: []gpMode{
			{"SINGLE PLAYER", "Explore the full story of the Tarnished alone.", 0},
			{"CO-OP (SUMMON)", "Summon other Tarnished to assist with tough bosses.", 1},
			{"INVASION (PVP)", "Invade other players' worlds or defend your own as a Blue Hunter.", 2},
		},

		OSMin: "Windows 10/11", OSRec: "Windows 10/11",
		CPUMin: "Intel Core i5-8600K / AMD Ryzen 5 3600X", CPURec: "Intel Core i7-8700K / AMD Ryzen 5 3600X",
		RAMMin: "12 GB RAM", RAMRec: "16 GB RAM",
		GPUMin: "NVIDIA GTX 1060 3GB / AMD RX 580 4GB", GPURec: "NVIDIA GTX 1070 8GB / AMD RX Vega 56 8GB",
		StoreMin: "60 GB SSD", StoreRec: "60 GB SSD",
		DXMin: "DirectX 12", DXRec: "DirectX 12",

		Reviews: []gpReview{
			{"IGN", "IGN", 10, 10, "A masterpiece of world design, combat, and mystery. The best game FromSoftware has ever made.", "https://ign.com", 0},
			{"GameSpot", "GameSpot", 10, 10, "The pinnacle of the soulslike genre — and perhaps the best RPG of its generation.", "https://gamespot.com", 1},
			{"PCGamer", "PCGamer", 96, 100, "FromSoftware's greatest achievement. The open world changes everything.", "https://pcgamer.com", 2},
		},
		Links: []gpLink{
			{"Steam", "https://store.steampowered.com/app/1245620/ELDEN_RING/", "₹3,999", 0},
			{"GOG", "https://www.gog.com/game/elden_ring", "₹3,999", 1},
		},
		Awards: []gpAward{
			{"Game of the Year — The Game Awards 2022", "Game of the Year", "Award", 0},
			{"Best RPG — The Game Awards 2022", "Best RPG", "Award", 1},
			{"Best Art Direction — BAFTA 2023", "Best Art Direction", "Award", 2},
			{"Metacritic 96 — One of the highest-rated games of all time", "Metacritic 96", "Recognition", 3},
		},
		CriticScore: 9.7, CriticLabel: "Universal Acclaim",
		HubSlug: "dev", ShowChat: true, ShowTourney: false,
	},

	// ── 3. BGMI ───────────────────────────────────────────────────────────────
	{
		Slug: "bgmi", Status: "published", BrandColor: "#f97316",
		IsFeatured: true, ViewCount: 52000,

		HeroTitle:   "BGMI",
		HeroDesc:    "Battlegrounds Mobile India — The ultimate mobile battle royale built for India.",
		HeroBG:      "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=1920",
		HeroTrailer: "https://www.youtube.com/watch?v=h_m0yCL_VXk",

		GIDev: "Krafton", GIPub: "Krafton",
		GIRelease: "2021-07-02",
		GIGenres:  "Battle Royale · Action · Multiplayer",
		GIPlatforms: "Android · iOS",

		Story: "100 players parachute onto a remote island. They scavenge for weapons, vehicles, and supplies while the safe zone shrinks relentlessly. The last player or squad standing wins. Battlegrounds Mobile India is the officially licensed mobile battle royale tailored specifically for Indian players, with localized servers, seasonal events, and content crafted for the Indian gaming community.",

		GPTitle: "BATTLE ROYALE SURVIVAL",
		GPDesc:  "Survive the shrinking blue zone and eliminate every opponent to claim Chicken Dinner.",
		GPPara:  "Drop in, loot wisely, move with the zone, and outgun or outmaneuver every other squad on the island.",

		Mechanics: []gpMechanic{
			{"BATTLE ROYALE SURVIVAL", "Survive the shrinking blue zone and be the last squad standing.", 0},
			{"LOOTING SYSTEM", "Scavenge weapons, armor, backpacks, and attachments across each map.", 1},
			{"VEHICLE COMBAT", "Motorcycles, jeeps, and boats let you traverse the large maps while staying in the zone.", 2},
		},

		QCOTitle: "MOVEMENT", QCODesc: "Virtual joystick on the left side of the screen controls your character.",
		Controls: []gpControlCard{
			{"MOVEMENT", "Virtual joystick on the left side of the screen to move your character.", 0},
			{"FIRE", "Tap the fire button on the right to shoot. Hold for automatic weapons.", 1},
			{"ADS / SCOPE", "Tap the scope icon to aim down sights for improved accuracy.", 2},
			{"INVENTORY", "Tap the backpack icon to manage gear, attachments, and healing items.", 3},
		},

		Modes: []gpMode{
			{"ERANGEL", "Classic 8×8km island — the original BGMI battleground.", 0},
			{"MIRAMAR", "8×8km desert map with long sightlines and urban street combat.", 1},
			{"SANHOK", "Compact 4×4km jungle map for fast, close-quarters action.", 2},
			{"VIKENDI", "6×6km snow map with unique snowmobile mechanics.", 3},
		},

		OSMin: "Android 5.1.1 / iOS 9.0", OSRec: "Android 10+ / iOS 14+",
		CPUMin: "Snapdragon 450 / Apple A9", CPURec: "Snapdragon 865 / Apple A14",
		RAMMin: "2 GB RAM", RAMRec: "6 GB RAM",
		GPUMin: "Integrated GPU (Adreno 505+)", GPURec: "Adreno 650 / Apple GPU",
		StoreMin: "4 GB", StoreRec: "10 GB",
		DXMin: "N/A", DXRec: "N/A",

		Reviews: []gpReview{
			{"IGN India", "IGN India", 8.5, 10, "The best mobile battle royale for Indian gamers — smooth, localized, and deeply competitive.", "https://in.ign.com", 0},
			{"Digit.in", "Digit.in", 8, 10, "BGMI delivers exactly what Indian mobile gamers were waiting for.", "https://digit.in", 1},
		},
		Links: []gpLink{
			{"Google Play Store", "https://play.google.com/store/apps/details?id=com.krafton.bgmi", "Free to Play", 0},
			{"Apple App Store", "https://apps.apple.com/in/app/battlegrounds-mobile-india/id1526357842", "Free to Play", 1},
		},
		Awards: []gpAward{
			{"Best Mobile Game — IGDC 2022", "Best Mobile Game", "Award", 0},
			{"Most Downloaded Game India — 2022", "Most Downloaded", "Recognition", 1},
		},
		CriticScore: 8.5, CriticLabel: "Great",
		HubSlug: "esports", ShowChat: true, ShowTourney: true,
	},

	// ── 4. MINECRAFT ──────────────────────────────────────────────────────────
	{
		Slug: "minecraft", Status: "published", BrandColor: "#5b8731",
		IsFeatured: true, ViewCount: 41000,

		HeroTitle:   "MINECRAFT",
		HeroDesc:    "The world's best-selling game. Mine, craft, build, and survive in an infinite blocky world.",
		HeroBG:      "https://images.unsplash.com/photo-1549464671-f67e8e73e4c1?w=1920",
		HeroTrailer: "https://www.youtube.com/watch?v=MmB9b5njVbA",

		GIDev: "Mojang Studios", GIPub: "Microsoft / Xbox Game Studios",
		GIRelease: "2011-11-18",
		GIGenres:  "Sandbox · Survival · Creative",
		GIPlatforms: "PC · PlayStation · Xbox · Mobile · Nintendo Switch",

		Story: "In a procedurally generated world made entirely of blocks, the only limit is your imagination. Mine deep underground for diamonds and rare ores. Craft powerful tools, armor, and weapons. Build anything from a cozy cottage to a sprawling medieval city. Survive the night against Creepers, Zombies, and the Ender Dragon — or switch to Creative Mode and build without limits. Every world is unique and infinite.",

		GPTitle: "SANDBOX SURVIVAL",
		GPDesc:  "Gather resources by day, fortify your base by night, and explore a truly infinite world.",
		GPPara:  "Mine stone to build shelter. Smelt iron to craft tools. Every decision cascades into the next adventure.",

		Mechanics: []gpMechanic{
			{"SANDBOX SURVIVAL", "Gather resources by day, fortify your base by night in a procedurally generated world.", 0},
			{"CRAFTING SYSTEM", "Combine hundreds of mined resources into tools, machines, and structures.", 1},
			{"REDSTONE ENGINEERING", "Build complex mechanical contraptions with Redstone — from simple doors to fully programmable computers.", 2},
		},

		QCOTitle: "MOVEMENT", QCODesc: "WASD to move. Spacebar to jump. Double-Space to fly in Creative Mode.",
		Controls: []gpControlCard{
			{"MOVEMENT", "WASD to move. Spacebar to jump. Double-Space to fly (Creative Mode).", 0},
			{"BREAK / PLACE", "Left click to break blocks. Right click to place blocks or use items.", 1},
			{"CRAFTING", "Press E to open your inventory and the crafting grid.", 2},
			{"HOTBAR", "1–9 keys to select items from the quick-access hotbar.", 3},
		},

		Modes: []gpMode{
			{"SURVIVAL", "Gather resources, craft gear, and survive against hostile mobs.", 0},
			{"CREATIVE", "Unlimited blocks, free flight, and zero limits — pure building.", 1},
			{"ADVENTURE", "Explore custom maps with rules set by the map creator.", 2},
			{"HARDCORE", "One life only. Permadeath. The ultimate Minecraft challenge.", 3},
		},

		OSMin: "Windows 10", OSRec: "Windows 10/11",
		CPUMin: "Intel Core i3-3210 / AMD A8-7600", CPURec: "Intel Core i5-4690 / AMD A10-7800",
		RAMMin: "4 GB RAM", RAMRec: "8 GB RAM",
		GPUMin: "Intel HD Graphics 4000 / ATI Radeon R5", GPURec: "NVIDIA GeForce 700 Series / AMD Radeon RX 200",
		StoreMin: "4 GB", StoreRec: "8 GB",
		DXMin: "DirectX 11", DXRec: "DirectX 12",

		Reviews: []gpReview{
			{"IGN", "IGN", 9.7, 10, "A timeless classic that refuses to stop evolving — and keeps inspiring an entire generation.", "https://ign.com", 0},
			{"PCGamer", "PCGamer", 95, 100, "The best-selling game in history continues to get better with every major update.", "https://pcgamer.com", 1},
		},
		Links: []gpLink{
			{"Minecraft.net", "https://www.minecraft.net/en-us/store/minecraft-java-bedrock-edition-pc", "₹1,569", 0},
			{"Xbox Game Pass", "https://www.xbox.com/en-US/games/minecraft", "Included in Game Pass", 1},
		},
		Awards: []gpAward{
			{"Best-Selling Video Game of All Time — Guinness World Records", "Best-Selling Game", "Recognition", 0},
			{"BAFTA Fellowship — Mojang Studios 2023", "BAFTA Fellowship", "Award", 1},
			{"Kids' Choice Award — Favorite Video Game (8× winner)", "Kids' Choice Award", "Award", 2},
		},
		CriticScore: 9.5, CriticLabel: "Universal Acclaim",
		HubSlug: "dev", ShowChat: true, ShowTourney: false,
	},

	// ── 5. CYBERPUNK 2077 ─────────────────────────────────────────────────────
	{
		Slug: "cyberpunk-2077", Status: "published", BrandColor: "#fcee09",
		IsFeatured: true, ViewCount: 89000,

		HeroTitle:   "CYBERPUNK 2077",
		HeroDesc:    "An open-world RPG set in Night City — a megalopolis of ambition, cybernetics, and fatal danger.",
		HeroBG:      "https://images.unsplash.com/photo-1605898835373-52367ac7b583?w=1920",
		HeroTrailer: "https://www.youtube.com/watch?v=8X2kIfS6fb8",

		GIDev: "CD Projekt Red", GIPub: "CD Projekt",
		GIRelease: "2020-12-10",
		GIGenres:  "Action RPG · Open World · Cyberpunk",
		GIPlatforms: "PC · PS5 · Xbox Series X|S",

		Story: "You play as V, a mercenary outlaw going after a one-of-a-kind implant that is the key to immortality. With the chip in your head comes a digital ghost in the form of Johnny Silverhand — a legendary rockerboy played by Keanu Reeves. The choices you make will change the world and determine V's fate. Night City: a place that promises fame and fortune, but delivers a desperate fight for survival.",

		GPTitle: "OPEN WORLD ACTION RPG",
		GPDesc:  "Build V your way — through stats, cyberware, and playstyle — then unleash your build on Night City.",
		GPPara:  "Every district of Night City has its own power dynamics, gangs, and secrets. How you deal with them shapes the story.",

		Mechanics: []gpMechanic{
			{"OPEN WORLD ACTION RPG", "Build V your way — through stats, cyberware, and playstyle — then unleash your build on Night City.", 0},
			{"CYBERPUNK COMBAT", "Hack enemy systems, wield melee blades, or blast through with a vast arsenal of firearms.", 1},
			{"DEEP NARRATIVE", "Meaningful choices shape V's story and relationships across the city's many factions.", 2},
		},

		QCOTitle: "MOVEMENT", QCODesc: "WASD to move. Spacebar to dodge. Shift to sprint.",
		Controls: []gpControlCard{
			{"MOVEMENT", "WASD to move. Spacebar to dodge. Shift to sprint through Night City.", 0},
			{"HACKING", "Hold Tab to open the quickhack radial — target enemies, cameras, and electronics.", 1},
			{"COMBAT", "Left click to fire. Right click to aim. Q for quick melee strike.", 2},
			{"CYBERWARE", "Activate equipped cyberware abilities with dedicated hotkeys for a decisive edge.", 3},
		},

		Modes: []gpMode{
			{"STORY MODE", "Experience the full narrative of V and Johnny Silverhand across Night City.", 0},
			{"PHANTOM LIBERTY", "The major expansion set in the new district of Dogtown — a spy-thriller within the RPG.", 1},
			{"HARD MODE", "Enemies hit harder, resources are scarce. Only the best builds survive.", 2},
		},

		OSMin: "Windows 10 64-bit", OSRec: "Windows 10/11 64-bit",
		CPUMin: "Intel Core i7-6700K / AMD Ryzen 5 1600", CPURec: "Intel Core i7-8700K / AMD Ryzen 5 3600",
		RAMMin: "12 GB RAM", RAMRec: "16 GB RAM",
		GPUMin: "NVIDIA GTX 1060 6GB / AMD RX 580 8GB", GPURec: "NVIDIA RTX 2060 Super / AMD RX 5700 XT",
		StoreMin: "70 GB SSD", StoreRec: "70 GB NVMe SSD",
		DXMin: "DirectX 12", DXRec: "DirectX 12",

		Reviews: []gpReview{
			{"PCGamer", "PCGamer", 92, 100, "The best open-world RPG in years — the 2.0 update and Phantom Liberty complete the vision.", "https://pcgamer.com", 0},
			{"IGN", "IGN", 9, 10, "Night City is a work of art. Phantom Liberty cements Cyberpunk 2077 as an all-time classic.", "https://ign.com", 1},
			{"GameSpot", "GameSpot", 9, 10, "Redeemed and remarkable — Cyberpunk 2077 is finally the game it was meant to be.", "https://gamespot.com", 2},
		},
		Links: []gpLink{
			{"GOG", "https://www.gog.com/game/cyberpunk_2077", "₹2,999", 0},
			{"Steam", "https://store.steampowered.com/app/1091500/Cyberpunk_2077/", "₹2,999", 1},
		},
		Awards: []gpAward{
			{"Best Narrative — BAFTA 2021", "Best Narrative", "Award", 0},
			{"Best Ongoing Game — The Game Awards 2023", "Best Ongoing Game", "Award", 1},
			{"Most Improved Game — Golden Joystick Awards 2022", "Most Improved Game", "Award", 2},
		},
		CriticScore: 9.0, CriticLabel: "Outstanding",
		HubSlug: "dev", ShowChat: true, ShowTourney: false,
	},
}

// ─── SeedGamePosts ────────────────────────────────────────────────────────────

func SeedGamePosts() {
	var count int
	if err := DB.QueryRow("SELECT COUNT(*) FROM gamepost.game_posts").Scan(&count); err != nil {
		log.Printf("❌  SeedGamePosts: count failed: %v", err)
		return
	}
	if count > 0 {
		log.Printf("⏭   SeedGamePosts: already seeded (%d rows) — skip", count)
		return
	}

	log.Printf("🎮  SeedGamePosts: inserting %d game posts…", len(gameSeeds))
	ok := 0
	for _, g := range gameSeeds {
		if err := seedOneGamePostReal(g); err != nil {
			log.Printf("  ❌  gamepost [%s]: %v", g.Slug, err)
		} else {
			log.Printf("  ✅  gamepost [%s]", g.Slug)
			ok++
		}
	}
	log.Printf("✅  SeedGamePosts: %d/%d inserted", ok, len(gameSeeds))
}

func seedOneGamePostReal(g gamePostSeed) error {
	tx, err := DB.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}

	// ── 1. game_posts root row ────────────────────────────────────────────────
	var gpID int
	if err = tx.QueryRow(`
		INSERT INTO gamepost.game_posts (slug, status, brand_color, is_featured, view_count)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING game_post_id`,
		g.Slug, g.Status, g.BrandColor, g.IsFeatured, g.ViewCount,
	).Scan(&gpID); err != nil {
		tx.Rollback()
		return fmt.Errorf("game_posts: %w", err)
	}
	log.Printf("    → game_posts id=%d slug=%s", gpID, g.Slug)

	// ── 2. hero ───────────────────────────────────────────────────────────────
	if _, err = tx.Exec(`
		INSERT INTO gamepost.hero
			(game_post_id, game_title, game_desc_short, background_img, logo_img, trailer_url)
		VALUES ($1,$2,$3,$4,$5,$6)`,
		gpID, g.HeroTitle, g.HeroDesc, g.HeroBG, g.HeroLogo, g.HeroTrailer,
	); err != nil {
		tx.Rollback()
		return fmt.Errorf("hero: %w", err)
	}

	// ── 3. game_info ──────────────────────────────────────────────────────────
	rd := parseDate(g.GIRelease)
	if _, err = tx.Exec(`
		INSERT INTO gamepost.game_info
			(game_post_id, developer, publisher, release_date, genres, platforms)
		VALUES ($1,$2,$3,$4,$5,$6)`,
		gpID, g.GIDev, g.GIPub, rd, g.GIGenres, g.GIPlatforms,
	); err != nil {
		tx.Rollback()
		return fmt.Errorf("game_info: %w", err)
	}

	// ── 4. storyline ──────────────────────────────────────────────────────────
	if _, err = tx.Exec(`
		INSERT INTO gamepost.storyline (game_post_id, paragraphs)
		VALUES ($1,$2)`,
		gpID, g.Story,
	); err != nil {
		tx.Rollback()
		return fmt.Errorf("storyline: %w", err)
	}

	// ── 5. gameplay (single PRIMARY KEY row) ─────────────────────────────────
	if _, err = tx.Exec(`
		INSERT INTO gamepost.gameplay (game_post_id, gameplay_title, gameplay_title_desc, paragraph)
		VALUES ($1,$2,$3,$4)`,
		gpID, g.GPTitle, g.GPDesc, g.GPPara,
	); err != nil {
		tx.Rollback()
		return fmt.Errorf("gameplay: %w", err)
	}

	// ── 6. gameplay_mechanics (multi-row) ─────────────────────────────────────
	for _, m := range g.Mechanics {
		if _, err = tx.Exec(`
			INSERT INTO gamepost.gameplay_mechanics (game_post_id, title, description, display_order)
			VALUES ($1,$2,$3,$4)`,
			gpID, m.Title, m.Desc, m.Order,
		); err != nil {
			tx.Rollback()
			return fmt.Errorf("gameplay_mechanics[%q]: %w", m.Title, err)
		}
	}

	// ── 7. quick_control_overview (single PRIMARY KEY row) ───────────────────
	if _, err = tx.Exec(`
		INSERT INTO gamepost.quick_control_overview (game_post_id, qco_title, qco_title_desc)
		VALUES ($1,$2,$3)`,
		gpID, g.QCOTitle, g.QCODesc,
	); err != nil {
		tx.Rollback()
		return fmt.Errorf("quick_control_overview: %w", err)
	}

	// ── 8. control_cards (multi-row) ─────────────────────────────────────────
	for _, c := range g.Controls {
		if _, err = tx.Exec(`
			INSERT INTO gamepost.control_cards (game_post_id, category, description, display_order)
			VALUES ($1,$2,$3,$4)`,
			gpID, c.Category, c.Desc, c.Order,
		); err != nil {
			tx.Rollback()
			return fmt.Errorf("control_cards[%q]: %w", c.Category, err)
		}
	}

	// ── 9. modes (multi-row) ─────────────────────────────────────────────────
	for _, m := range g.Modes {
		if _, err = tx.Exec(`
			INSERT INTO gamepost.modes (game_post_id, mode_title, mode_titledesc, display_order)
			VALUES ($1,$2,$3,$4)`,
			gpID, m.Title, m.TitleDesc, m.Order,
		); err != nil {
			tx.Rollback()
			return fmt.Errorf("modes[%q]: %w", m.Title, err)
		}
	}

	// ── 10. system_requirement (single PRIMARY KEY row) ──────────────────────
	if _, err = tx.Exec(`
		INSERT INTO gamepost.system_requirement
			(game_post_id,
			 os_min, os_rec,
			 processor_min, processor_rec,
			 memory_min, memory_rec,
			 graphics_min, graphics_rec,
			 storage_min, storage_rec,
			 directx_min, directx_rec)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
		gpID,
		g.OSMin, g.OSRec,
		g.CPUMin, g.CPURec,
		g.RAMMin, g.RAMRec,
		g.GPUMin, g.GPURec,
		g.StoreMin, g.StoreRec,
		g.DXMin, g.DXRec,
	); err != nil {
		tx.Rollback()
		return fmt.Errorf("system_requirement: %w", err)
	}

	// ── 11. expert_reviews (multi-row) ───────────────────────────────────────
	for _, r := range g.Reviews {
		if _, err = tx.Exec(`
			INSERT INTO gamepost.expert_reviews
				(game_post_id, reviewer_name, outlet, rating, max_rating, quote, review_url, display_order)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
			gpID, r.Reviewer, r.Outlet, r.Rating, r.MaxRating, r.Quote, r.URL, r.Order,
		); err != nil {
			tx.Rollback()
			return fmt.Errorf("expert_reviews[%q]: %w", r.Reviewer, err)
		}
	}

	// ── 12. get_game (multi-row) ─────────────────────────────────────────────
	for _, l := range g.Links {
		if _, err = tx.Exec(`
			INSERT INTO gamepost.get_game (game_post_id, platform_name, affiliate_link, price_label, display_order)
			VALUES ($1,$2,$3,$4,$5)`,
			gpID, l.Platform, l.Link, l.Price, l.Order,
		); err != nil {
			tx.Rollback()
			return fmt.Errorf("get_game[%q]: %w", l.Platform, err)
		}
	}

	// ── 13. awards_and_achievements (multi-row) ───────────────────────────────
	for _, a := range g.Awards {
		if _, err = tx.Exec(`
			INSERT INTO gamepost.awards_and_achievements
				(game_post_id, aa_pt, aa_title, aa_type, display_order)
			VALUES ($1,$2,$3,$4,$5)`,
			gpID, a.Pt, a.Title, a.Type, a.Order,
		); err != nil {
			tx.Rollback()
			return fmt.Errorf("awards[%q]: %w", a.Title, err)
		}
	}

	// ── 14. critic_rating (single PRIMARY KEY row) ───────────────────────────
	if _, err = tx.Exec(`
		INSERT INTO gamepost.critic_rating (game_post_id, score, label)
		VALUES ($1,$2,$3)`,
		gpID, g.CriticScore, g.CriticLabel,
	); err != nil {
		tx.Rollback()
		return fmt.Errorf("critic_rating: %w", err)
	}

	// ── 15. community_hub (single PRIMARY KEY row) ───────────────────────────
	if g.HubSlug != "" {
		if _, err = tx.Exec(`
			INSERT INTO gamepost.community_hub
				(game_post_id, community_branch_slug, show_live_chat, show_tournament_widget)
			VALUES ($1,$2,$3,$4)`,
			gpID, g.HubSlug, g.ShowChat, g.ShowTourney,
		); err != nil {
			tx.Rollback()
			return fmt.Errorf("community_hub: %w", err)
		}
	}

	return tx.Commit()
}

// ══════════════════════════════════════════════════════════════════════════════
// BLOG POSTS  (mirrors MOCK_BLOGS in blogData.js — 9 posts)
// ══════════════════════════════════════════════════════════════════════════════

func SeedBlogs() {
	var count int
	if err := DB.QueryRow("SELECT COUNT(*) FROM blog_posts").Scan(&count); err != nil {
		log.Printf("❌  SeedBlogs: count failed: %v", err)
		return
	}
	if count > 0 {
		log.Printf("⏭   SeedBlogs: already seeded (%d rows) — skip", count)
		return
	}

	type blog struct {
		Slug, Title, Excerpt, Content, Category string
		AuthorUsername                          string
		Tags                                    []string
		Views, Likes, ReadMin                   int
		Featured                                bool
		Status, PublishedAt, HeroURL            string
	}

	blogs := []blog{
		// 1 ── from blogData.js blog1
		{
			Slug:  "future-of-open-world-gaming-2026",
			Title: "The Future of Open-World Gaming in 2026",
			Excerpt: "Exploring how next-gen hardware is pushing the boundaries of open-world game design " +
				"with larger maps, better AI, and seamless multiplayer integration.",
			Content: `<p>Next-generation hardware has fundamentally changed what open-world games can achieve. ` +
				`As we move through 2026, the limitations that once constrained game designers are dissolving one by one.</p>` +
				`<p>The combination of fast NVMe SSDs, GPUs capable of real-time ray tracing, and AI-driven procedural ` +
				`generation means developers can create worlds that feel genuinely alive — NPCs that remember your actions, ` +
				`ecosystems that evolve without player input, and weather systems that affect gameplay in meaningful ways.</p>` +
				`<p>The most exciting frontier is seamless multiplayer integration into single-player open worlds. ` +
				`Games are now designed from the ground up to allow friends to drop in and out without breaking immersion.</p>`,
			Category: "games", AuthorUsername: "alex_chen",
			Tags:        []string{"open-world", "next-gen", "game-design", "2026"},
			Views: 12453, Likes: 342, ReadMin: 8, Featured: true,
			Status: "published", PublishedAt: "2026-02-15T10:00:00Z",
			HeroURL: "https://picsum.photos/800/450?random=blog1",
		},
		// 2 ── from blogData.js blog2
		{
			Slug:  "top-10-indie-games-2026",
			Title: "Top 10 Indie Games to Watch in 2026",
			Excerpt: "From pixel art masterpieces to narrative-driven adventures, " +
				"these indie titles are set to make waves this year.",
			Content: `<p>The indie game scene has never been more vibrant. With tools like Godot becoming more powerful ` +
				`and accessible, and distribution platforms giving small studios a genuine shot at massive audiences, ` +
				`2026 is shaping up to be an extraordinary year for independent developers.</p>` +
				`<p>Here are the 10 indie games we're watching most closely this year, spanning every genre from ` +
				`brutal action platformers to contemplative walking simulators that explore themes rarely touched by mainstream titles.</p>`,
			Category: "games", AuthorUsername: "sarah_m",
			Tags:        []string{"indie", "2026", "recommendations", "game-dev"},
			Views: 8760, Likes: 218, ReadMin: 6, Featured: true,
			Status: "published", PublishedAt: "2026-02-12T10:00:00Z",
			HeroURL: "https://picsum.photos/800/450?random=blog2",
		},
		// 3 ── from blogData.js blog3
		{
			Slug:  "mastering-competitive-fps-pro-tips",
			Title: "Mastering Competitive FPS: Pro Tips from the Scene",
			Excerpt: "Learn the strategies and techniques used by professional esports players " +
				"to dominate in competitive shooters.",
			Content: `<p>Mechanical skill is just the foundation — the real edge comes from game sense, ` +
				`communication, and systematic preparation. Professional FPS players spend hours reviewing VODs, ` +
				`studying enemy tendencies, and perfecting utility lineups.</p>` +
				`<p>Here's what separates the top 1% from the rest: consistent crosshair placement, ` +
				`economic decision-making, and the ability to make split-second calls under pressure. ` +
				`This guide breaks down each element with practical drills you can apply today.</p>`,
			Category: "esports", AuthorUsername: "mike_t",
			Tags:        []string{"fps", "competitive", "tips", "valorant", "cs2", "esports"},
			Views: 21100, Likes: 567, ReadMin: 12, Featured: false,
			Status: "published", PublishedAt: "2026-02-10T10:00:00Z",
			HeroURL: "https://picsum.photos/800/450?random=blog3",
		},
		// 4 ── new (task slug)
		{
			Slug:  "rise-of-mobile-esports-2026",
			Title: "The Rise of Mobile Esports: India Leads the Charge in 2026",
			Excerpt: "Mobile esports has exploded globally, with India emerging as the fastest-growing " +
				"competitive gaming market. Here's what's driving it.",
			Content: `<p>When BGMI returned to Indian app stores, it didn't just bring back a game — ` +
				`it reignited an entire competitive ecosystem. By 2026, India has become one of the top five ` +
				`mobile esports markets globally, with prize pools reaching into the crores and mainstream ` +
				`sports brands investing in teams.</p>` +
				`<p>Sub-10ms latency 5G coverage, affordable high-refresh-rate phones, and dedicated esports ` +
				`arenas in Tier-1 and Tier-2 cities have removed the barriers that once kept Indian players ` +
				`from competing on the world stage.</p>`,
			Category: "esports", AuthorUsername: "priya_s",
			Tags:        []string{"mobile-esports", "bgmi", "india", "esports", "2026"},
			Views: 14300, Likes: 421, ReadMin: 7, Featured: false,
			Status: "published", PublishedAt: "2026-03-01T10:00:00Z",
			HeroURL: "https://picsum.photos/800/450?random=blog4",
		},
		// 5 ── new (task slug)
		{
			Slug:  "game-dev-journey-beginner-to-pro",
			Title: "Game Dev Journey: From Beginner to Professional in 24 Months",
			Excerpt: "A realistic roadmap for aspiring game developers — what skills to build, " +
				"what to avoid, and how to ship your first title.",
			Content: `<p>The game development industry looks intimidating from the outside — AAA studios with ` +
				`hundreds of employees and development cycles measured in years. But the path to becoming a ` +
				`professional game developer doesn't start there.</p>` +
				`<p>It starts with a 48-hour game jam, a half-finished prototype, and the willingness to ship ` +
				`something imperfect. Here's a realistic 24-month roadmap based on the journeys of developers ` +
				`who have made the transition from hobby projects to professional roles at studios.</p>`,
			Category: "dev", AuthorUsername: "raj_dev",
			Tags:        []string{"game-dev", "career", "beginner", "unity", "unreal", "roadmap"},
			Views: 18700, Likes: 634, ReadMin: 15, Featured: false,
			Status: "published", PublishedAt: "2026-03-08T10:00:00Z",
			HeroURL: "https://picsum.photos/800/450?random=blog5",
		},
		// 6 ── new (task slug)
		{
			Slug:  "esports-team-management-guide",
			Title: "Esports Team Management: Building and Running a Competitive Roster",
			Excerpt: "Everything a team manager needs to know — from player contracts and scrim scheduling " +
				"to mental health support and social media strategy.",
			Content: `<p>Running an esports team is far more complex than many outsiders realize. Beyond the players, ` +
				`there are coaches, analysts, content creators, social media managers, and sponsors to coordinate — ` +
				`all while maintaining peak team performance through grueling tournament schedules.</p>` +
				`<p>This guide distills the operational knowledge of managers from Tier-1 and Tier-2 organizations ` +
				`across Valorant, CS2, and BGMI. Whether you're starting a grassroots team or scaling an existing ` +
				`organization, the frameworks here will save you months of trial and error.</p>`,
			Category: "esports", AuthorUsername: "dev_m",
			Tags:        []string{"esports", "team-management", "organization", "competitive"},
			Views: 9200, Likes: 287, ReadMin: 11, Featured: false,
			Status: "published", PublishedAt: "2026-03-15T10:00:00Z",
			HeroURL: "https://picsum.photos/800/450?random=blog6",
		},
		// 7 ── new (task slug)
		{
			Slug:  "ai-in-gaming-2026",
			Title: "AI in Gaming 2026: Beyond NPCs — How Machine Learning is Reshaping Play",
			Excerpt: "From procedural generation to adaptive difficulty and AI-powered anti-cheat, " +
				"machine learning is quietly transforming every layer of the gaming stack.",
			Content: `<p>The integration of AI into gaming has accelerated dramatically. What began with basic ` +
				`pathfinding algorithms has evolved into sophisticated systems that generate dialogue, adapt ` +
				`environments in real-time, and detect cheaters with extraordinary accuracy.</p>` +
				`<p>In 2026, the most interesting AI applications aren't the flashy ones — they're the invisible ones. ` +
				`Systems that quietly adjust difficulty to keep players in the flow state. NPC memory systems that make ` +
				`open worlds feel populated by people, not actors. Procedural music composers that match the ` +
				`emotional tone of every scene dynamically.</p>`,
			Category: "tech", AuthorUsername: "aisha_r",
			Tags:        []string{"ai", "machine-learning", "game-dev", "technology", "2026"},
			Views: 22400, Likes: 743, ReadMin: 10, Featured: true,
			Status: "published", PublishedAt: "2026-04-01T10:00:00Z",
			HeroURL: "https://picsum.photos/800/450?random=blog7",
		},
		// 8 ── new (task slug)
		{
			Slug:  "content-creation-for-gamers",
			Title: "Content Creation for Gamers: The 2026 Creator Playbook",
			Excerpt: "How to build an audience on Twitch, YouTube, and short-form platforms — " +
				"platform algorithms, content strategy, and monetization paths explained.",
			Content: `<p>Gaming content creation has never been more competitive — or more rewarding. ` +
				`In 2026, the creator economy around gaming generates more revenue than many mid-size game studios. ` +
				`But breaking through requires more than good gameplay footage.</p>` +
				`<p>The creators winning in 2026 understand their niche deeply, post with unusual consistency, ` +
				`and treat community interaction as their primary product rather than an afterthought. ` +
				`This playbook breaks down the strategies they use, platform by platform.</p>`,
			Category: "content", AuthorUsername: "nisha_k",
			Tags:        []string{"content-creation", "streaming", "youtube", "twitch", "creator"},
			Views: 15800, Likes: 509, ReadMin: 9, Featured: false,
			Status: "published", PublishedAt: "2026-04-10T10:00:00Z",
			HeroURL: "https://picsum.photos/800/450?random=blog8",
		},
		// 9 ── new (task slug)
		{
			Slug:  "building-gaming-community",
			Title: "Building a Gaming Community That Lasts: Lessons from the Trenches",
			Excerpt: "What separates thriving gaming communities from dead Discord servers? " +
				"Moderation, culture, and the flywheel of engagement explained.",
			Content: `<p>There are millions of gaming communities online. Most become ghost towns within six months. ` +
				`The ones that thrive share characteristics that have nothing to do with the game they're built around ` +
				`and everything to do with how they're run.</p>` +
				`<p>Having built and moderated communities for GzoneSphere's platform domains over the past two years, ` +
				`here's what we've learned about the systems, culture, and daily practices that make a community ` +
				`feel like home rather than just a chat room.</p>`,
			Category: "community", AuthorUsername: "gzs_team",
			Tags:        []string{"community", "discord", "moderation", "engagement", "gaming"},
			Views: 7600, Likes: 312, ReadMin: 8, Featured: false,
			Status: "published", PublishedAt: "2026-04-18T10:00:00Z",
			HeroURL: "https://picsum.photos/800/450?random=blog9",
		},
	}

	log.Printf("📝  SeedBlogs: inserting %d blog posts…", len(blogs))
	ok := 0
	for _, b := range blogs {
		var publishedAt interface{}
		if b.PublishedAt != "" {
			if t := parseRFC3339(b.PublishedAt); !t.IsZero() {
				publishedAt = t
			}
		}

		_, err := DB.Exec(`
			INSERT INTO blog_posts
				(slug, title, content, content_plain, excerpt, category,
				 author_username, hero_image_url, is_featured,
				 view_count, like_count, read_time_minutes,
				 status, tags, published_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
			b.Slug, b.Title, b.Content, stripHTML(b.Content), b.Excerpt,
			b.Category, b.AuthorUsername, b.HeroURL, b.Featured,
			b.Views, b.Likes, b.ReadMin,
			b.Status, pq.Array(b.Tags), publishedAt,
		)
		if err != nil {
			log.Printf("  ❌  blog [%s]: %v", b.Slug, err)
		} else {
			log.Printf("  ✅  blog [%s]", b.Slug)
			ok++
		}
	}
	log.Printf("✅  SeedBlogs: %d/%d inserted", ok, len(blogs))
}


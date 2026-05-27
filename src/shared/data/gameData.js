import placeholderWhite from '@assets/images/placeholderWhite.svg';
import gameposthero from '@assets/images/gameposthero.png';

/* ============================================================
   GAME POST DUMMY DATA
   Each game object includes a `theme` object — these values
   come from the admin color picker (hero image based) and will
   be stored in the database when backend is connected.
   ============================================================ */

export const GAMES = {
    valorant: {
        meta: {
            slug: "valorant",
            status: "published",
            publish_at: "2026-01-25",
        },
        theme: {
            primary: "#e53935",
            primaryDark: "#c62828",
            primaryLight: "#ef5350",
            bgPage: "#fff5f5",
            bgSection: "#ffebee",
            border: "#ffcdd2",
            textHeading: "#c62828",
        },
        hero: {
            game_title: "VALORANT",
            game_desc_short: "A competitive 5v5 tactical shooter where precision gunplay meets unique agent abilities.",
            background_img: gameposthero,
        },
        game_info: {
            developer: "Riot Games",
            publisher: "Riot Games",
            release_date: "June 2, 2020",
            genres: "Tactical · Shooter · Multiplayer",
            platforms: "PC",
            profile_size_photo: placeholderWhite,
        },
        storyline: {
            paragraphs: "In the near future, Earth is permanently altered by a mysterious global event known as First Light. This awakens latent abilities in select individuals across the world, transforming them into powerful agents with unique skills. A shadowy organization known as Kingdom Corporation has risen to power, controlling a new energy source called Radianite. You are an agent of the VALORANT Protocol — fight for what you believe in.",
        },
        gameplay: [
            { gameplay_title: "PRECISION GUNPLAY", gameplay_title_desc: "Shooting mechanics reward accuracy and recoil control.", paragraph: "Every bullet matters. Learn each gun's recoil pattern and adapt your style." },
            { gameplay_title: "AGENT ABILITIES", gameplay_title_desc: "Each agent brings unique tactical skills to dominate the map.", paragraph: "Combine abilities with gunplay to create devastating combos." },
        ],
        quick_control_overview: [
            { qco_title: "MOVEMENT", qco_title_desc: "Use W, A, S, D to move. Shift to walk silently." },
            { qco_title: "COMBAT", qco_title_desc: "Left click to fire. Right click to aim down sights." },
            { qco_title: "ABILITY", qco_title_desc: "Q / E / C / X to use agent abilities." },
            { qco_title: "SPIKE", qco_title_desc: "4 to equip spike. Hold F to plant or defuse." },
        ],
        system_requirement: {
            os_min: "Windows 10 64-bit", os_rec: "Windows 11 64-bit",
            processor_min: "Intel i3-4150", processor_rec: "Intel i5-4460",
            memory_min: "4 GB RAM", memory_rec: "8 GB RAM",
            graphics_min: "Intel HD 4000", graphics_rec: "GTX 1050 Ti",
            storage_min: "30 GB", storage_rec: "30 GB",
            directx_min: "DirectX 11", directx_rec: "DirectX 12",
        },
        expert_reviews: [
            { site: "IGN", quote: "Outstanding tactical shooter with excellent agent variety.", rating: 9, max_rating: 10 },
            { site: "GameSpot", quote: "A near-perfect blend of CS and Overwatch-style abilities.", rating: 8, max_rating: 10 },
            { site: "PCGamer", quote: "Crisp, competitive, and absolutely worth your time.", rating: 88, max_rating: 100 },
        ],
        user_reviews: [
            { username: "ProPlayer99", comment: "Highly competitive. The skill ceiling is insane.", rating: 9 },
            { username: "CasualGamer", comment: "Great free game. Takes time to master each agent.", rating: 8 },
            { username: "TacShooterFan", comment: "Best tactical shooter since early CS days.", rating: 9 },
        ],
        modes: [
            { mode_title: "UNRATED" },
            { mode_title: "COMPETITIVE" },
            { mode_title: "SPIKE RUSH" },
            { mode_title: "DEATHMATCH" },
        ],
        awards_and_achievements: [
            { aa_pt: "Best Multiplayer — The Game Awards 2021" },
            { aa_pt: "Most Played FPS — Steam Charts 2022" },
        ],
        get_game: { affiliate_links: "https://playvalorant.com" },
        community_hub: {
            onlineCount: 1240,
            memberCount: '1,240+',
            activeDiscussions: 48,
            weeklyPosts: 312,
            activeTournament: {
                name: 'Valorant Winter Showdown 2026',
                status: 'Open',
                dates: 'Jan 15 – Jan 20',
                prize: '₹50,000',
                slug: 'valorant-winter-showdown-2026',
            },
            messages: [
                {
                    author: 'GzoneSphere',
                    text: 'A competitive 5v5 tactical shooter where precision gunplay meets unique agent abilities.',
                    primary: true,
                },
                {
                    author: 'Operator_Net',
                    text: 'Looking for more players exploring Valorant. Drop your best tips, clips, and review notes.',
                },
            ],
        },
    },

    cyberpunk: {
        meta: { slug: "cyberpunk-2077", status: "published", publish_at: "2026-01-10" },
        theme: {
            primary: "#f59e0b",
            primaryDark: "#d97706",
            primaryLight: "#fbbf24",
            bgPage: "#1a1a2e",
            bgSection: "#16213e",
            border: "#f59e0b",
            textHeading: "#f59e0b",
        },
        hero: {
            game_title: "CYBERPUNK 2077",
            game_desc_short: "An open-world RPG set in Night City — a megalopolis of ambition and fatal danger.",
            background_img: placeholderWhite,
        },
        game_info: {
            developer: "CD Projekt Red",
            publisher: "CD Projekt",
            release_date: "December 10, 2020",
            genres: "RPG · Open World · Action",
            platforms: "PC · PS5 · Xbox",
            profile_size_photo: placeholderWhite,
        },
        storyline: { paragraphs: "You play as V, a mercenary outlaw going after a one-of-a-kind implant that is the key to immortality. With the chip in your head comes a digital ghost in the form of Johnny Silverhand — a legendary rockerboy played by Keanu Reeves." },
        gameplay: [
            { gameplay_title: "OPEN WORLD RPG", gameplay_title_desc: "Build V your way with stats, cyberware, and playstyle choices.", paragraph: "" },
            { gameplay_title: "CYBERPUNK COMBAT", gameplay_title_desc: "Hack, slash, or blast your way through Night City.", paragraph: "" },
        ],
        quick_control_overview: [
            { qco_title: "MOVEMENT", qco_title_desc: "WASD to move. Space to dodge. Shift to sprint." },
            { qco_title: "HACKING", qco_title_desc: "Hold Tab to access quickhack menu." },
        ],
        system_requirement: {
            os_min: "Windows 10 64-bit", os_rec: "Windows 11 64-bit",
            processor_min: "Intel i5-3570K", processor_rec: "AMD Ryzen 5 3600",
            memory_min: "8 GB RAM", memory_rec: "16 GB RAM",
            graphics_min: "GTX 970", graphics_rec: "RTX 3080",
            storage_min: "70 GB SSD", storage_rec: "70 GB NVMe SSD",
            directx_min: "DirectX 12", directx_rec: "DirectX 12",
        },
        expert_reviews: [
            { site: "PCGamer", quote: "The best open world RPG in years after the path 2.0 update.", rating: 92, max_rating: 100 },
        ],
        user_reviews: [
            { username: "NightCityFan", comment: "Absolutely stunning after the 2.0 update.", rating: 10 },
        ],
        modes: [{ mode_title: "STORY MODE" }, { mode_title: "HARD MODE" }],
        awards_and_achievements: [{ aa_pt: "Best Narrative — BAFTA 2021" }],
        get_game: { affiliate_links: "https://www.gog.com/game/cyberpunk_2077" },
    },
};

// Default export — Valorant is the featured game
export const gamePostData = GAMES.valorant;

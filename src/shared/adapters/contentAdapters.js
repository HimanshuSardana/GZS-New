import { images } from '@/shared/data/images';

const DEFAULT_GAME_COMMUNITY_LINKS = [
    { key: 'discord', label: 'DC', href: '#' },
    { key: 'twitter', label: 'TW', href: '#' },
    { key: 'youtube', label: 'YT', href: '#' },
    { key: 'twitch', label: 'TV', href: '#' },
];

const STATUS_MAP = {
    upcoming: 'upcoming',
    ongoing: 'live',
    live: 'live',
    open: 'registration_open',
    registration_open: 'registration_open',
    registration_closed: 'registration_closed',
    completed: 'completed',
    cancelled: 'cancelled',
    published: 'published',
    draft: 'draft',
};

const CATEGORY_COLOR_MAP = {
    games: 'Games',
    esports: 'Esports',
    news: 'News',
    articles: 'Articles',
    healthcare: 'Healthcare',
    health: 'Healthcare',
    products: 'Products',
    trending: 'Trending',
    reviews: 'Reviews',
    industry: 'Industry',
    technology: 'Technology',
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const slugify = (value = '') =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

const ensureArray = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (!value) return [];
    return String(value)
        .split(/[,/|•·]/)
        .map((item) => item.trim())
        .filter(Boolean);
};

const titleCase = (value = '') =>
    String(value)
        .replace(/[_-]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');

const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
    if (!value) return 'TBA';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-IN', options);
};

const safeNumber = (value, fallback = 0) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = parseInt(String(value ?? '').replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const inferTournamentGame = (raw = {}) => {
    if (raw.game) return raw.game;
    const source = `${raw.slug || ''} ${raw.title || ''} ${raw.name || ''}`.toLowerCase();
    if (source.includes('valorant')) return 'Valorant';
    if (source.includes('cs2') || source.includes('counter')) return 'CS2';
    if (source.includes('bgmi')) return 'BGMI';
    if (source.includes('apex')) return 'Apex Legends';
    if (source.includes('free fire')) return 'Free Fire';
    if (source.includes('fifa') || source.includes('eafc')) return 'EAFC';
    return raw.category || 'Open Circuit';
};

const normalizeTournamentStatus = (value) => {
    const key = String(value || '').toLowerCase().replace(/\s+/g, '_');
    return STATUS_MAP[key] || key || 'registration_open';
};

const buildRatingLabel = (score) => {
    if (score >= 9) return 'Outstanding';
    if (score >= 8) return 'Excellent';
    if (score >= 7) return 'Strong';
    if (score >= 6) return 'Promising';
    return 'Growing';
};

const normalizeGamePlatforms = (raw = {}) => {
    const platforms = ensureArray(raw.platforms || raw.platform);
    if (platforms.length > 0) return platforms;
    return ['PC'];
};

const normalizeGameGenres = (raw = {}) => {
    const genres = ensureArray(raw.genres || raw.genre);
    if (genres.length > 0) return genres;
    return ['Action'];
};

const normalizeGameStoryline = (raw = {}, fallbackDescription = '') => {
    if (raw.storyline?.paragraphs || raw.storyline?.summary) return raw.storyline;

    const baseText = raw.storyline || raw.description || raw.short_description || fallbackDescription;
    const paragraphs = String(baseText || '')
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join('\n');

    return {
        summary: raw.short_description || raw.description || fallbackDescription,
        paragraphs: paragraphs || fallbackDescription || 'Story details will be published soon.',
    };
};

const normalizeGameMedia = (raw = {}, fallbackImage = images.valorant) => {
    if (Array.isArray(raw.carousel) && raw.carousel.length > 0) return raw.carousel;
    if (Array.isArray(raw.screenshots) && raw.screenshots.length > 0) {
        return raw.screenshots.map((shot) => shot.url || shot.image || shot.src).filter(Boolean);
    }
    return [raw.banner_url || raw.logo_url || fallbackImage];
};

const normalizeGameplay = (raw = {}) => {
    if (Array.isArray(raw.gameplay) && raw.gameplay.length > 0) return raw.gameplay;

    const groups = [
        { key: 'mechanics', title: 'Core Mechanics', desc: 'How the game feels moment to moment.' },
        { key: 'modes', title: 'Modes', desc: 'The main ways to play this title.' },
        { key: 'controls', title: 'Controls', desc: 'Input and onboarding basics.' },
    ];

    const gameplay = groups
        .filter(({ key }) => raw[key])
        .map(({ key, title, desc }) => ({
            gameplay_title: title.toUpperCase(),
            gameplay_title_desc: desc,
            paragraph: raw[key],
        }));

    if (gameplay.length > 0) return gameplay;

    return [
        {
            gameplay_title: 'CORE EXPERIENCE',
            gameplay_title_desc: 'What makes this game worth jumping into.',
            paragraph: raw.description || raw.short_description || 'Gameplay details are being updated.',
        },
    ];
};

const normalizeQuickControls = (raw = {}) => {
    if (Array.isArray(raw.quick_control_overview) && raw.quick_control_overview.length > 0) {
        return raw.quick_control_overview;
    }

    const controlsText = raw.controls || '';
    if (!controlsText.trim()) {
        return [
            { qco_title: 'MOVEMENT', qco_title_desc: 'Use standard movement keys and the in-game tutorial for setup.' },
            { qco_title: 'COMBAT', qco_title_desc: 'Primary and secondary inputs are configurable from the settings panel.' },
        ];
    }

    return controlsText
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 4)
        .map((line, index) => ({
            qco_title: `CONTROL_${index + 1}`,
            qco_title_desc: line,
        }));
};

const normalizeGameModes = (raw = {}) => {
    if (Array.isArray(raw.modes) && raw.modes.length > 0) return raw.modes;

    const modes = ensureArray(raw.modes_text || raw.modes || raw.mode);
    if (modes.length > 0) return modes.map((mode) => ({ mode_title: mode.toUpperCase() }));

    return [{ mode_title: 'STANDARD PLAY' }];
};

const normalizeSystemRequirement = (raw = {}) => {
    if (raw.system_requirement) return raw.system_requirement;

    const normalized = {
        os_min: raw.min_os || raw.os_min || '',
        os_rec: raw.rec_os || raw.os_rec || '',
        processor_min: raw.min_cpu || raw.processor_min || '',
        processor_rec: raw.rec_cpu || raw.processor_rec || '',
        memory_min: raw.min_ram || raw.memory_min || '',
        memory_rec: raw.rec_ram || raw.memory_rec || '',
        graphics_min: raw.min_gpu || raw.graphics_min || '',
        graphics_rec: raw.rec_gpu || raw.graphics_rec || '',
        storage_min: raw.min_storage || raw.storage_min || '',
        storage_rec: raw.rec_storage || raw.storage_rec || '',
        directx_min: raw.min_directx || raw.directx_min || '',
        directx_rec: raw.rec_directx || raw.directx_rec || '',
    };

    return Object.values(normalized).some(Boolean) ? normalized : null;
};

const normalizeExpertReviews = (raw = {}) => {
    const reviews = Array.isArray(raw.expert_reviews) ? raw.expert_reviews : [];
    if (reviews.length > 0) {
        return reviews.map((review) => ({
            site: review.site || review.source || 'Editorial Desk',
            quote: review.quote || review.comment || raw.description || 'Editorial review coming soon.',
            rating: review.rating || review.score || 8,
            max_rating: review.max_rating || review.out_of || 10,
        }));
    }

    return [
        {
            site: 'GzoneSphere',
            quote: raw.description || raw.short_description || 'Editors are preparing a deeper breakdown of this release.',
            rating: 8,
            max_rating: 10,
        },
    ];
};

const normalizeUserReviews = (raw = {}) => {
    const reviews = Array.isArray(raw.user_reviews) ? raw.user_reviews : [];
    if (reviews.length > 0) {
        return reviews.map((review) => ({
            username: review.username || review.user || 'community_member',
            comment: review.comment || review.quote || 'Worth tracking if this genre is your thing.',
            rating: review.rating || 8,
        }));
    }

    return [
        {
            username: 'gzs_operator',
            comment: raw.description || raw.short_description || 'Community impressions will appear here as reviews are submitted.',
            rating: 8,
        },
    ];
};

const normalizePurchaseLinks = (raw = {}, platforms = []) => {
    const links = Array.isArray(raw.purchase_links) ? raw.purchase_links : [];
    if (links.length > 0) return links;

    const primaryPlatform = platforms[0] || 'Official Store';
    return [
        {
            platform: primaryPlatform,
            url: raw.store_url || raw.affiliate_links || raw.website || '#',
            price: raw.price || 'Included with base game',
        },
    ];
};

const buildGameRelated = (raw = {}, allGames = []) =>
    allGames
        .filter((game) => game && game.id !== raw.id && (game.slug || slugify(game.title)) !== (raw.slug || slugify(raw.title)))
        .slice(0, 4)
        .map((game, index) => ({
            name: game.title,
            slug: game.slug || slugify(game.title),
            img: game.banner_url || images.valorant,
            active: index === 0,
        }));

export const adaptGameRecord = (raw, context = {}) => {
    if (!raw) return null;

    // ── Bridge: new gamepost schema shape → legacy adapter keys ──────────────
    // When data comes from /api/cms/gameposts/:slug (Go backend, gamepost schema)
    // it has flat arrays like gameplay_mechanics[], control_cards[], get_game[].
    // We normalise these into the shape the existing section components expect.
    if (raw.game_post_id !== undefined) {
        // Flatten gameplay_mechanics into raw.gameplay (existing normalizer picks it up)
        if (Array.isArray(raw.gameplay_mechanics) && raw.gameplay_mechanics.length > 0) {
            raw = {
                ...raw,
                gameplay: raw.gameplay_mechanics.map(m => ({
                    gameplay_title: m.title,
                    gameplay_title_desc: m.description,
                })),
            };
        }
        // Flatten control_cards into raw.controls array for normalizeQuickControls
        if (Array.isArray(raw.control_cards) && raw.control_cards.length > 0) {
            raw = {
                ...raw,
                controls: raw.control_cards,
                qco_title: raw.quick_control_overview?.qco_title,
                qco_title_desc: raw.quick_control_overview?.qco_title_desc,
            };
        }
        // Flatten get_game[] (array of store links) into purchase_links
        if (Array.isArray(raw.get_game) && raw.get_game.length > 0) {
            raw = {
                ...raw,
                purchase_links: raw.get_game.map(g => ({
                    platform: g.platform_name,
                    url: g.affiliate_link,
                    price: g.price_label,
                })),
                // keep original array for GetGameSection direct use
                get_game_links: raw.get_game,
            };
        }
        // Flatten dlcs (new shape has dlc_title instead of name)
        if (Array.isArray(raw.dlcs) && raw.dlcs.length > 0) {
            raw = {
                ...raw,
                dlc: raw.dlcs.map(d => ({
                    name: d.dlc_title,
                    type: d.dlc_type,
                    price: d.price_label,
                    url: d.store_link,
                })),
            };
        }
        // awards_and_achievements: new shape has aa_title, aa_type
        if (Array.isArray(raw.awards_and_achievements) && raw.awards_and_achievements.length > 0) {
            raw = {
                ...raw,
                awards: raw.awards_and_achievements.map(a => ({
                    aa_pt: `${a.aa_title}${a.year ? ` (${a.year})` : ''}${a.organisation ? ` — ${a.organisation}` : ''}`,
                    label: a.aa_title,
                    name: a.aa_title,
                })),
            };
        }
        // join_our_community: new shape is array, existing expects object with .links
        if (Array.isArray(raw.join_our_community) && raw.join_our_community.length > 0) {
            raw = {
                ...raw,
                join_community_links: raw.join_our_community,
            };
        }
        // Flatten carousel items (new shape: yt_url / upload_url)
        if (Array.isArray(raw.carousel) && raw.carousel.length > 0) {
            raw = {
                ...raw,
                screenshots: raw.carousel
                    .filter(c => c.media_type === 'image' || c.upload_url)
                    .map(c => ({ url: c.upload_url, caption: c.caption })),
                trailers: raw.carousel
                    .filter(c => c.media_type === 'youtube' || c.yt_url)
                    .map(c => ({ url: c.yt_url, title: c.caption })),
            };
        }
        // critic_rating: new shape has numeric score directly
        if (raw.critic_rating?.score !== undefined) {
            raw = {
                ...raw,
                aggregate_score: raw.critic_rating.score,
            };
        }
        // brand_color → feed into theme
        if (raw.brand_color) {
            raw = {
                ...raw,
                theme: {
                    primary: raw.brand_color,
                    primaryDark: raw.brand_color,
                    primaryLight: raw.brand_color,
                },
            };
        }
    }
    // ── End bridge ─────────────────────────────────────────────────────────────

    const title = raw.title || raw.hero?.game_title || 'Untitled Game';
    const slug = raw.slug || raw.meta?.slug || slugify(title);
    const platforms = normalizeGamePlatforms(raw);
    const genres = normalizeGameGenres(raw);
    const releaseDate = raw.release_date || raw.date || raw.updated || raw.meta?.publish_at;
    const fallbackImage = raw.banner_url || raw.hero?.background_img || images.valorant;
    const storyline = normalizeGameStoryline(raw, raw.description || raw.short_description || '');
    const expertReviews = normalizeExpertReviews(raw);
    const userReviews = normalizeUserReviews(raw);
    const purchaseLinks = normalizePurchaseLinks(raw, platforms);
    const aggregateScore =
        Number(raw.aggregate_score || raw.metacritic || raw.opencritic || 0) ||
        Number(
            (
                expertReviews.reduce((sum, review) => {
                    const max = Number(review.max_rating || 10) || 10;
                    const rating = Number(review.rating || 0);
                    return sum + (rating / max) * 10;
                }, 0) / expertReviews.length
            ).toFixed(1)
        ) ||
        8.2;
    const dlcs = Array.isArray(raw.dlc) ? raw.dlc : [];
    const awards = Array.isArray(raw.awards_and_achievements)
        ? raw.awards_and_achievements
        : Array.isArray(raw.awards)
            ? raw.awards
            : [];

    return {
        ...raw,
        title,
        slug,
        hero: raw.hero || {
            game_title: title,
            game_desc_short: raw.short_description || raw.description || 'A featured game on GzoneSphere.',
            background_img: fallbackImage,
        },
        game_info: {
            developer: raw.game_info?.developer || raw.developer || raw.author || 'GzoneSphere Studio',
            publisher: raw.game_info?.publisher || raw.publisher || 'GzoneSphere',
            release_date: raw.game_info?.release_date || formatDate(releaseDate),
            genres: raw.game_info?.genres || genres.join(' · '),
            platforms: raw.game_info?.platforms || platforms.join(' · '),
            profile_size_photo: raw.game_info?.profile_size_photo || raw.logo_url || fallbackImage,
        },
        storyline,
        carousel: normalizeGameMedia(raw, fallbackImage),
        gameplay: normalizeGameplay(raw),
        quick_control_overview: normalizeQuickControls(raw),
        modes: normalizeGameModes(raw),
        system_requirement: normalizeSystemRequirement(raw),
        expert_reviews: expertReviews,
        user_reviews: userReviews,
        awards_and_achievements: ensureArray(raw.awards_and_achievements || raw.awards).map(a =>
            typeof a === 'string'
                ? { aa_pt: a }
                : { aa_pt: a.award || a.aa_pt || a.name || '', org: a.organisation, year: a.year }
        ),
        critic_rating: raw.critic_rating || {
            score: Number(aggregateScore.toFixed(1)),
            label: buildRatingLabel(aggregateScore),
            signupHref: '/signup',
        },
        get_game: raw.get_game || {
            platforms,
            ctaLabel: raw.status === 'Published' ? 'Play Now' : 'Track Release',
            ctaHref: purchaseLinks[0]?.url || '#',
            purchaseLinks,
            primaryOffer: {
                eyebrow: 'Official Access',
                title: raw.status === 'Published' ? 'Start Playing' : 'Wishlist This Game',
                description: raw.status === 'Published'
                    ? 'Jump in from the official store or your preferred platform.'
                    : 'Follow the release and get notified when the launch window is finalized.',
                href: purchaseLinks[0]?.url || '#',
                label: raw.status === 'Published' ? 'Play Now' : 'Track Release',
            },
            secondaryOffer: {
                eyebrow: 'Upgrade Path',
                title: 'Collector Bonuses',
                description: 'Check deluxe bundles, launch perks, and featured extras connected to this title.',
                href: purchaseLinks[0]?.url || '#',
                label: 'View Extras',
            },
        },
        store_extras: raw.store_extras || {
            dlcList: dlcs.length > 0 ? dlcs.map(item => ({
                title:       item.title || item.name  || '',
                type:        item.type  || 'DLC',
                releaseDate: item.releaseDate || item.release_date || '',
                description: item.description || '',
                price:       item.price || '',
                url:         item.url   || item.storeUrl || '',
            })) : [],
            awardList: awards.length > 0 ? awards.map(a => ({
                award:        a.award || a.aa_pt || '',
                organisation: a.organisation || a.org || '',
                year:         a.year || '',
            })) : [],
            proFeatures: dlcs.length > 0 ? dlcs.map(item => `${item.title || item.name}${item.price ? ` · ${item.price}` : ''}`) : [],
            bonuses:     awards.length > 0 ? awards.map(a => a.award || a.aa_pt) : [],
        },
        related_games: raw.related_games || buildGameRelated(raw, context.allGames || []),
        community_hub: raw.community_hub || {
            onlineCount: clamp(safeNumber(raw.community_size, 2400), 120, 20000),
            featuredMessage: `Discuss ${title}, strategy, updates, and community findings with other players in the Sphere.`,
            messages: [
                {
                    author: 'GzoneSphere',
                    text: raw.description || raw.short_description || 'Live conversations for this title will appear here as the community grows.',
                    primary: true,
                },
                {
                    author: 'Operator_Net',
                    text: `Looking for more players exploring ${title}. Drop your best tips, clips, and review notes.`,
                },
            ],
            activeTournament: {
                name: `${title} Community Cup`,
                date: releaseDate ? `${formatDate(releaseDate)} · Community Event` : 'Community Event · Coming Soon',
                href: '/tournaments/browse',
            },
            stats: [
                { label: 'Members with this game', value: `${clamp(safeNumber(raw.players, 2412), 120, 9000)}` },
                { label: 'Active discussions', value: `${clamp(genres.length * 14, 12, 120)}` },
                { label: 'Posts today', value: `${clamp(userReviews.length * 37, 18, 400)}` },
            ],
        },
        join_our_community: raw.join_our_community || {
            title: `Join the ${title} community`,
            subtitle: 'Stay connected with tournaments, discussion, and player-created guides.',
            links: DEFAULT_GAME_COMMUNITY_LINKS,
        },
    };
};

export const adaptGameCard = (raw) => {
    const game = adaptGameRecord(raw);
    return {
        ...game,
        platforms: normalizeGamePlatforms(game),
        genres: normalizeGameGenres(game),
        short_description: game.hero?.game_desc_short || game.short_description || game.description,
        featured: Boolean(game.featured || game.is_featured),
        status: String(game.status || 'Published').toLowerCase(),
    };
};

export const adaptBlogRecord = (raw) => {
    if (!raw) return null;

    const title = raw.title || 'Untitled Post';
    const slug = raw.slug || slugify(title);
    const publishedAt = raw.published_at || raw.updated || raw.date || raw.created_at;
    const description = raw.excerpt || raw.description || raw.meta_description || 'Editorial content is being prepared.';
    const content = raw.content || raw.body || `<p>${description}</p>`;
    const authorName = raw.author?.name || raw.author_name || raw.author || 'GzoneSphere Staff';
    const viewCount = safeNumber(raw.view_count || raw.views, 0);
    const likeCount = safeNumber(raw.like_count ?? raw.likes, 0);
    const wordCount = String(content).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length || 200;

    return {
        ...raw,
        id: raw.id,
        slug,
        title,
        image: raw.image || raw.featured_image_url || images.blogHero,
        description,
        excerpt: description,
        content,
        category: CATEGORY_COLOR_MAP[String(raw.category || '').toLowerCase()] || titleCase(raw.category || 'Articles'),
        likes: likeCount,
        like_count: likeCount,
        view_count: viewCount,
        featured: Boolean(raw.featured),
        highlighted: Boolean(raw.featured),
        date: formatDate(publishedAt),
        published_at: publishedAt,
        readTime: Math.max(1, Math.ceil(wordCount / 200)),
        tags: ensureArray(raw.tags),
        author_name: authorName,
        author: {
            name: authorName,
            avatar: raw.author?.avatar || `https://i.pravatar.cc/150?u=${slug}`,
            bio: raw.author?.bio || `${authorName} contributes editorial analysis, guides, and community-facing coverage for GzoneSphere.`,
        },
    };
};

const buildTournamentTimeline = (raw = {}, startDate, endDate, registrationClose) => {
    const steps = [
        { stage: 'Registration Opens', time: formatDate(raw.registration_open || raw.created_at || startDate), status: 'Done' },
        { stage: 'Registration Closes', time: formatDate(registrationClose || startDate), status: normalizeTournamentStatus(raw.status) === 'registration_open' ? 'Live' : 'Done' },
        { stage: 'Main Event', time: formatDate(startDate), status: 'Upcoming' },
        { stage: 'Finals', time: formatDate(endDate || startDate), status: 'Upcoming' },
    ];

    return steps;
};

const buildTournamentPrizes = (raw = {}, prizeTotal) => {
    if (Array.isArray(raw.extendedPrizes) && raw.extendedPrizes.length > 0) return raw.extendedPrizes;

    if (raw.prize_pool && typeof raw.prize_pool === 'object') {
        return Object.entries(raw.prize_pool)
            .filter(([key]) => key !== 'total')
            .map(([placement, amount]) => ({
                placement,
                prize: amount,
                reward: 'GzoneSphere Recognition',
            }));
    }

    return [
        { placement: '1st Place', prize: prizeTotal, reward: 'Champion Badge + Profile XP' },
        { placement: '2nd Place', prize: 'Recognition Prize', reward: 'Runner Up Badge' },
        { placement: 'All Valid Entries', prize: 'Verified Participation', reward: 'Domain XP' },
    ];
};

export const adaptTournamentRecord = (raw, context = {}) => {
    if (!raw) return null;

    const title = raw.title || raw.name || 'Untitled Tournament';
    const slug = raw.slug || slugify(title);
    const status = normalizeTournamentStatus(raw.status);
    const type = String(raw.tournament_type || raw.type || 'general').toLowerCase();
    const startDate = raw.start_date || raw.date;
    const endDate = raw.end_date || raw.date;
    const registrationClose = raw.registration_close || raw.date || raw.start_date;
    const prize = raw.prize || raw.prize_pool?.total || 'Free Entry';
    const maxParticipants = safeNumber(raw.max_participants || raw.slots, 0);
    const currentParticipants = safeNumber(raw.current_participants || raw.registered_count, 0);
    const game = inferTournamentGame(raw);
    const allTournaments = context.allTournaments || [];
    const related = allTournaments
        .filter((item) => item && item.id !== raw.id && (item.slug || slugify(item.title || item.name)) !== slug)
        .slice(0, 2)
        .map((item) => adaptTournamentRecord(item));

    return {
        ...raw,
        id: raw.id,
        slug,
        name: title,
        title,
        status,
        type,
        tournament_type: type,
        game,
        prize,
        prize_pool: raw.prize_pool && typeof raw.prize_pool === 'object' ? raw.prize_pool : { total: prize },
        date: formatDate(startDate),
        start_date: startDate,
        end_date: endDate,
        registration_close: registrationClose,
        format: raw.bracket_format || raw.format || (type === 'esports' ? 'Team' : 'Open Submission'),
        bracket_format: raw.bracket_format || raw.format || 'single_elimination',
        slots: String(maxParticipants || raw.slots || raw.maxSlots || 0),
        max_participants: maxParticipants || raw.max_participants || 0,
        current_participants: currentParticipants,
        registered_count: currentParticipants,
        team_size: safeNumber(raw.team_size, 1) || 1,
        heroImage: raw.banner_url || raw.heroImage || images.tournamentHero,
        organizer: raw.organizer || {
            name: 'GzoneSphere Official',
            contact: 'tournaments@gzonesphere.com',
            discord: 'discord.gg/gzonesphere',
        },
        badges: raw.badges || [
            type === 'esports' ? 'TEAM READY' : 'OPEN ENTRY',
            'GZONE VERIFIED',
            status === 'live' ? 'LIVE FEED' : 'ACTIVE BOARD',
        ],
        highlights: raw.highlights || [
            { label: 'Structured format', desc: `Built around ${titleCase(type)} competition with moderated progression and verified status handling.` },
            { label: 'Clear registration flow', desc: 'Teams and solo entrants can move from signup to confirmation without placeholder dead-ends.' },
            { label: 'Shared visibility', desc: 'The same tournament records now power browse, detail, register, and admin surfaces.' },
        ],
        notes: raw.notes || raw.description || 'Tournament-specific rules, eligibility, and operational updates will be published here.',
        registeredCount: currentParticipants,
        maxSlots: maxParticipants || safeNumber(raw.slots, currentParticipants || 1),
        recentPlayers: raw.recentPlayers || Array.from({ length: Math.min(Math.max(currentParticipants, 3), 5) }, (_, index) => ({
            name: `Operator_${index + 1}`,
            avatar: `https://i.pravatar.cc/100?u=${slug}-${index}`,
        })),
        extendedPrizes: buildTournamentPrizes(raw, prize),
        timeline: raw.timeline || buildTournamentTimeline(raw, startDate, endDate, registrationClose),
        entryExpiry: registrationClose || startDate,
        winner: raw.winner || {
            name: raw.winner_name || 'Result pending',
            avatar: `https://i.pravatar.cc/150?u=${slug}-winner`,
            prize,
        },
        related,
    };
};

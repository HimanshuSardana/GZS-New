export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function safeApiCall(realCall, mockFallback) {
  if (USE_MOCK) return mockFallback();
  try { return await realCall(); }
  catch (err) {
    const isNetworkError = err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED';
    const isAuthError = err.response?.status === 401 || err.response?.status === 403;
    
    if (isNetworkError || isAuthError) return mockFallback();
    throw err;
  }
}

// Mutable "Database"
let DB = {
    // ── COMMUNITY BRANCHES ─────────────────────────────────────────────────────
    branches: [
        { id: 'b1', slug: 'dev', name: 'Game Development', icon: '⚙️', members: 1240, description: 'Game devs, engineers, and technical creators. Discuss engines, tools, architecture, and game design.', branch_type: 'profile_based', profile_type: 'dev', sort_order: 1, is_active: true },
        { id: 'b2', slug: 'esports', name: 'Esports & Competitive', icon: '🏆', members: 3200, description: 'Players, coaches, and analysts discussing competitive gaming, strategies, and team play.', branch_type: 'profile_based', profile_type: 'esports', sort_order: 2, is_active: true },
        { id: 'b3', slug: 'content', name: 'Content & Media', icon: '🎥', members: 890, description: 'Streamers, creators, journalists, and community builders. Share your work, get feedback, grow together.', branch_type: 'profile_based', profile_type: 'content', sort_order: 3, is_active: true },
        { id: 'b4', slug: 'business', name: 'Business & Strategy', icon: '📊', members: 560, description: 'Managers, producers, and strategists discussing the industry, monetization, and growth systems.', branch_type: 'profile_based', profile_type: 'business', sort_order: 4, is_active: true },
        { id: 'b5', slug: 'art', name: 'Art & Design', icon: '🎨', members: 1100, description: 'Artists, illustrators, and visual designers. Share concept art, get critique, and explore creative tools.', branch_type: 'profile_based', profile_type: 'art', sort_order: 5, is_active: true },
        { id: 'b6', slug: 'writing', name: 'Writing & Narrative', icon: '✍️', members: 420, description: 'Writers, bloggers, and storytellers. Discuss narrative design, world-building, and editorial craft.', branch_type: 'profile_based', profile_type: 'writing', sort_order: 6, is_active: true },
        { id: 'b7', slug: 'audio', name: 'Music & Audio', icon: '🎵', members: 380, description: 'Composers, sound designers, and audio engineers creating sonic worlds for games and beyond.', branch_type: 'profile_based', profile_type: 'audio', sort_order: 7, is_active: true },
        { id: 'b8', slug: 'general', name: 'General', icon: '💬', members: 5600, description: 'The main community hub — off-topic discussions, news, introductions, and anything else.', branch_type: 'general', profile_type: null, sort_order: 8, is_active: true },
    ],

    // ── COMMUNITY CHANNELS ──────────────────────────────────────────────────────
    channels: [
        // dev channels
        { id: 'ch1', branch_slug: 'dev', slug: 'general', name: 'General', type: 'chat', sort_order: 1 },
        { id: 'ch2', branch_slug: 'dev', slug: 'announcements', name: 'Announcements', type: 'announcements', sort_order: 2 },
        { id: 'ch3', branch_slug: 'dev', slug: 'showcase', name: 'Showcase', type: 'showcase', sort_order: 3 },
        { id: 'ch4', branch_slug: 'dev', slug: 'lfg', name: 'LFG / Collabs', type: 'lfg', sort_order: 4 },
        { id: 'ch5', branch_slug: 'dev', slug: 'help', name: 'Help & Questions', type: 'help', sort_order: 5 },
        { id: 'ch6', branch_slug: 'dev', slug: 'events', name: 'Events', type: 'events', sort_order: 6 },
        // esports channels
        { id: 'ch7', branch_slug: 'esports', slug: 'general', name: 'General', type: 'chat', sort_order: 1 },
        { id: 'ch8', branch_slug: 'esports', slug: 'announcements', name: 'Announcements', type: 'announcements', sort_order: 2 },
        { id: 'ch9', branch_slug: 'esports', slug: 'showcase', name: 'Clips & Highlights', type: 'showcase', sort_order: 3 },
        { id: 'ch10', branch_slug: 'esports', slug: 'lfg', name: 'LFG / Team Search', type: 'lfg', sort_order: 4 },
        { id: 'ch11', branch_slug: 'esports', slug: 'help', name: 'Coaching & Tips', type: 'help', sort_order: 5 },
        { id: 'ch12', branch_slug: 'esports', slug: 'events', name: 'Tournaments', type: 'events', sort_order: 6 },
        // art channels
        { id: 'ch13', branch_slug: 'art', slug: 'general', name: 'General', type: 'chat', sort_order: 1 },
        { id: 'ch14', branch_slug: 'art', slug: 'announcements', name: 'Announcements', type: 'announcements', sort_order: 2 },
        { id: 'ch15', branch_slug: 'art', slug: 'showcase', name: 'Art Showcase', type: 'showcase', sort_order: 3 },
        { id: 'ch16', branch_slug: 'art', slug: 'lfg', name: 'Collabs Wanted', type: 'lfg', sort_order: 4 },
        { id: 'ch17', branch_slug: 'art', slug: 'help', name: 'Critique & Feedback', type: 'help', sort_order: 5 },
        { id: 'ch18', branch_slug: 'art', slug: 'events', name: 'Art Jams', type: 'events', sort_order: 6 },
        // general channels
        { id: 'ch19', branch_slug: 'general', slug: 'general', name: 'General Chat', type: 'chat', sort_order: 1 },
        { id: 'ch20', branch_slug: 'general', slug: 'announcements', name: 'Platform News', type: 'announcements', sort_order: 2 },
        { id: 'ch21', branch_slug: 'general', slug: 'introductions', name: 'Introductions', type: 'chat', sort_order: 3 },
        { id: 'ch22', branch_slug: 'general', slug: 'off-topic', name: 'Off-Topic', type: 'chat', sort_order: 4 },
    ],

    // ── COMMUNITY GROUPS ────────────────────────────────────────────────────────
    groups: [
        { id: 'g1', branch_slug: 'dev', name: 'UE5 Logic Shapers', members: 124, description: 'Deep dive into C++ gameplay logic and performance optimization.', visibility: 'public', owner: 'khali_gaming', avatar: 'U', rules: '1. Be respectful\n2. Share knowledge freely\n3. No self-promotion without context' },
        { id: 'g2', branch_slug: 'art', name: 'VFX Artisans', members: 89, description: 'Sharing Niagara and Blender particle systems for AAA visuals.', visibility: 'public', owner: 'art_wizard', avatar: 'V', rules: '1. Share WIPs for feedback\n2. Credit artists when sharing work' },
        { id: 'g3', branch_slug: 'esports', name: 'Alpha Strike Team', members: 5, description: 'Competitive scrims for the upcoming Gzone Open.', visibility: 'private', owner: 'strategy_fix', avatar: 'A', rules: '1. Scrim schedule: Mon/Wed/Fri 8PM IST\n2. Mandatory comms on Discord' },
        { id: 'g4', branch_slug: 'writing', name: 'Narrative Architects', members: 45, description: 'World-building and complex dialogue tree workshop.', visibility: 'public', owner: 'content_king', avatar: 'N', rules: '1. Share drafts and accept constructive criticism\n2. No plagiarism' },
        { id: 'g5', branch_slug: 'audio', name: 'Soundscape Core', members: 32, description: 'Adaptive audio implementation and orchestration.', visibility: 'public', owner: 'khali_gaming', avatar: 'S', rules: '1. Share stems and project files openly\n2. Credit samples' },
        { id: 'g6', branch_slug: 'dev', name: 'Indie Jam Collective', members: 67, description: 'Weekly game jam participation and post-mortems.', visibility: 'public', owner: 'art_wizard', avatar: 'I', rules: '1. Participate in at least one jam per month\n2. Share your entries' },
        { id: 'g7', branch_slug: 'content', name: 'Stream Growth Lab', members: 156, description: 'Strategies, analytics, and networking for streamers.', visibility: 'public', owner: 'content_king', avatar: 'L', rules: '1. No follow-for-follow spam\n2. Share genuine growth insights' },
    ],

    // ── LFG POSTS ───────────────────────────────────────────────────────────────
    lfgPosts: [
        { id: 'l1', branch_slug: 'dev', title: 'Looking for a 2D/3D Artist for indie game (Unity)', type: 'collaborator', game: null, platform: 'PC', requirements: 'Some portfolio required. Revenue share model.', slots: 1, filled_slots: 0, status: 'open', author: 'khali_gaming', created: '2 days ago' },
        { id: 'l2', branch_slug: 'esports', title: 'Need IGL for VALORANT ranked team — Immortal+', type: 'teammate', game: 'VALORANT', platform: 'PC', requirements: 'Must be Immortal or above. Age 18+.', slots: 1, filled_slots: 0, status: 'open', author: 'strategy_fix', created: '5 hours ago' },
        { id: 'l3', branch_slug: 'esports', title: 'BGMI squad — scrims prep for upcoming tournament', type: 'teammate', game: 'BGMI', platform: 'Mobile', requirements: 'Plat+ rank. Daily availability.', slots: 2, filled_slots: 1, status: 'open', author: 'content_king', created: '1 day ago' },
        { id: 'l4', branch_slug: 'art', title: 'Concept artist needed for mobile RPG character roster', type: 'collaborator', game: null, platform: 'Mobile', requirements: 'Character design portfolio. Paid project.', slots: 1, filled_slots: 0, status: 'open', author: 'art_wizard', created: '3 days ago' },
        { id: 'l5', branch_slug: 'writing', title: 'Co-writer for sci-fi visual novel project', type: 'collaborator', game: null, platform: 'PC', requirements: 'Must have written 10k+ words. Revenue share.', slots: 1, filled_slots: 0, status: 'open', author: 'content_king', created: '1 week ago' },
        { id: 'l6', branch_slug: 'dev', title: 'Seeking experienced mentor for UE5 networking (C++)', type: 'mentor', game: null, platform: null, requirements: 'At least 3 years of UE5 experience.', slots: 1, filled_slots: 0, status: 'open', author: 'strategy_fix', created: '4 hours ago' },
        { id: 'l7', branch_slug: 'general', title: 'Game jam team formation — Ludum Dare 57', type: 'teammate', game: null, platform: 'PC', requirements: 'Any skill level welcome! We have a designer and programmer, need artist.', slots: 1, filled_slots: 0, status: 'open', author: 'khali_gaming', created: '6 hours ago' },
    ],

    // ── COMMUNITY EVENTS ────────────────────────────────────────────────────────
    events: [
        { id: 'ev1', branch_slug: 'dev', title: 'GzoneSphere Dev AMA — Game Engine Architecture', event_type: 'ama', start_at: '2026-04-12T18:00:00', description: 'Live Q&A with senior engineers from top indie studios. Ask anything about engine development, optimization, and careers.', created_by: 'gzone_admin' },
        { id: 'ev2', branch_slug: 'esports', title: 'Community Valorant Tournament — Friday Night Showdown', event_type: 'tournament', start_at: '2026-04-11T20:00:00', description: 'Open community tournament. 5v5 single elimination. Sign up by Thursday.', created_by: 'gzone_admin' },
        { id: 'ev3', branch_slug: 'art', title: 'Character Design Challenge — Weekly Jam #14', event_type: 'jam', start_at: '2026-04-13T00:00:00', description: 'This week\'s theme: Cyberpunk Samurai. Submit your entry by Sunday. Voting opens Monday.', created_by: 'art_wizard' },
        { id: 'ev4', branch_slug: 'writing', title: 'Flash Fiction Friday — "The Last Save"', event_type: 'workshop', start_at: '2026-04-11T19:00:00', description: 'Write a piece of flash fiction (500 words max) based on the prompt. Peer review session follows.', created_by: 'content_king' },
        { id: 'ev5', branch_slug: 'general', title: 'GzoneSphere Platform Update — April Roadmap Reveal', event_type: 'ama', start_at: '2026-04-15T17:00:00', description: 'The team reveals what\'s coming in Phase 1 and answers community questions.', created_by: 'gzone_admin' },
        { id: 'ev6', branch_slug: 'audio', title: 'Listening Party — Community OST Submissions', event_type: 'watch_party', start_at: '2026-04-14T20:00:00', description: 'We listen through all community-submitted game soundtracks together. Vote for your favorites.', created_by: 'gzone_admin' },
    ],

    // ── SUB-PROFILES ─────────────────────────────────────────────────────────────
    subProfiles: {
        'U1': [
            {
                type: 'dev', username: 'khali_dev', display_name: 'Khali — Game Dev', role_title: 'Indie Game Developer & Unity Engineer',
                about: 'I build games solo and in small teams. Specializing in Unity 2D, C#, and mobile game development. Always looking for interesting projects.',
                experience_level: 'intermediate', avatar_url: null, is_active: true,
                skills: [
                    { id: 's1', name: 'Unity', category: 'Engine' },
                    { id: 's2', name: 'C#', category: 'Programming' },
                    { id: 's3', name: 'Mobile Game Dev', category: 'Platform' },
                    { id: 's4', name: 'Level Design', category: 'Design' },
                    { id: 's5', name: 'Game Jam Veteran', category: 'Experience' },
                ],
                projects: [
                    { id: 'pr1', title: 'PixelCrawl — Roguelite Dungeon', description: 'A procedurally generated dungeon crawler built in Unity. Solo project completed in 3 months.', url: 'https://github.com', image_url: null, tags: ['unity', 'roguelite', 'solo'] },
                    { id: 'pr2', title: 'Stack Blitz — Hyper Casual Mobile', description: 'Published on Google Play with 5k+ downloads. Built in 2 weeks for a game jam.', url: 'https://play.google.com', image_url: null, tags: ['mobile', 'hyper-casual', 'jam'] },
                ],
                followers: 234, following: 89,
            },
        ],
        'U2': [
            {
                type: 'art', username: 'wizard_art', display_name: 'Art Wizard', role_title: 'Concept Artist & Illustrator',
                about: 'Creating characters, environments, and UI for games. Available for commissions and team projects. Specializing in stylized and semi-realistic art.',
                experience_level: 'advanced', avatar_url: null, is_active: true,
                skills: [
                    { id: 's6', name: 'Character Design', category: 'Concept Art' },
                    { id: 's7', name: 'Environment Art', category: 'Concept Art' },
                    { id: 's8', name: 'Procreate', category: 'Tools' },
                    { id: 's9', name: 'Adobe Photoshop', category: 'Tools' },
                    { id: 's10', name: 'Blender 3D', category: 'Tools' },
                ],
                projects: [
                    { id: 'pr3', title: 'Fantasy Character Pack — Volume 1', description: '12 fully illustrated fantasy characters for use in indie games. Available on itch.io.', url: 'https://itch.io', image_url: null, tags: ['fantasy', 'characters', 'pack'] },
                    { id: 'pr4', title: 'GzoneSphere Brand Illustrations', description: 'Custom illustrations created for the GzoneSphere platform identity system.', url: null, image_url: null, tags: ['branding', 'illustration', 'UI'] },
                ],
                followers: 892, following: 145,
            },
        ],
    },

    // ── SOCIAL POSTS (HOME FEED) ─────────────────────────────────────────────────
    posts: [
        { id: 'po1', user_id: 'U1', sub_profile_type: 'dev', username: 'khali_dev', display_name: 'Khali — Game Dev', content: 'Just shipped the first playable demo of PixelCrawl! 6 months of nights and weekends. If you want to playtest, drop a comment below 👇', media_urls: [], like_count: 42, comment_count: 8, share_count: 2, visibility: 'public', created_at: '2 hours ago' },
        { id: 'po2', user_id: 'U2', sub_profile_type: 'art', username: 'wizard_art', display_name: 'Art Wizard', content: 'New character concept done! This is "Nyx" — a shadow rogue for a project I\'m working on. More lore coming soon ✨', media_urls: [], like_count: 128, comment_count: 24, share_count: 11, visibility: 'public', created_at: '5 hours ago' },
        { id: 'po3', user_id: 'U3', sub_profile_type: 'content', username: 'content_creator', display_name: 'Content King', content: 'Hit 10k followers on Twitch yesterday! 🎉 Thank you all so much. Stream tonight at 9PM IST — celebrating with a ranked grind!', media_urls: [], like_count: 264, comment_count: 47, share_count: 18, visibility: 'public', created_at: '8 hours ago' },
        { id: 'po4', user_id: 'U4', sub_profile_type: 'business', username: 'strategy_pro', display_name: 'Strategy Fix', content: 'Hot take: most indie devs spend 80% of their time on features that 20% of players will ever see. Build less, polish more, ship earlier.', media_urls: [], like_count: 89, comment_count: 31, share_count: 14, visibility: 'public', created_at: '1 day ago' },
        { id: 'po5', user_id: 'U1', sub_profile_type: 'dev', username: 'khali_dev', display_name: 'Khali — Game Dev', content: 'Unity 6 performance improvements are legitimately impressive. Switching our project over this weekend. Anyone else already made the jump?', media_urls: [], like_count: 56, comment_count: 19, share_count: 5, visibility: 'public', created_at: '2 days ago' },
        { id: 'po6', user_id: 'U2', sub_profile_type: 'art', username: 'wizard_art', display_name: 'Art Wizard', content: 'For anyone asking about my workflow — I sketch rough thumbnails in Procreate, refine the best 1-2, then do final render in Photoshop. Simple but effective.', media_urls: [], like_count: 203, comment_count: 38, share_count: 22, visibility: 'public', created_at: '3 days ago' },
    ],

    // ── DM CONVERSATIONS ────────────────────────────────────────────────────────
    conversations: [
        {
            id: 'conv1', participants: ['me', 'khali_gaming'], last_message: 'Sounds good! Let\'s schedule a call.', last_message_at: '5 min ago', unread: 0,
            other_user: { username: 'khali_gaming', display_name: 'Khali Gaming', avatar: 'K' },
            messages: [
                { id: 'm1', sender_id: 'khali_gaming', content: 'Hey! I saw your post about the game jam. Are you still looking for an artist?', read: true, created_at: '2 days ago' },
                { id: 'm2', sender_id: 'me', content: 'Yes! We need a 2D character artist. Do you have a portfolio I can check out?', read: true, created_at: '2 days ago' },
                { id: 'm3', sender_id: 'khali_gaming', content: 'Here\'s my ArtStation: artstation.com/khali. Let me know what you think!', read: true, created_at: '2 days ago' },
                { id: 'm4', sender_id: 'me', content: 'This looks great! Your character work is exactly what we need.', read: true, created_at: '1 day ago' },
                { id: 'm5', sender_id: 'khali_gaming', content: 'Sounds good! Let\'s schedule a call.', read: true, created_at: '5 min ago' },
            ]
        },
        {
            id: 'conv2', participants: ['me', 'art_wizard'], last_message: 'Will do! Thanks for the feedback 🙏', last_message_at: '2 hours ago', unread: 2,
            other_user: { username: 'art_wizard', display_name: 'Art Wizard', avatar: 'A' },
            messages: [
                { id: 'm6', sender_id: 'me', content: 'Love your latest character concept! Quick question — what brushes do you use for the fur texture?', read: true, created_at: '3 hours ago' },
                { id: 'm7', sender_id: 'art_wizard', content: 'Thank you! I use a custom bristle brush I made in Procreate. Happy to share the brush pack if you want!', read: false, created_at: '2 hours ago' },
                { id: 'm8', sender_id: 'art_wizard', content: 'Will do! Thanks for the feedback 🙏', read: false, created_at: '2 hours ago' },
            ]
        },
        {
            id: 'conv3', participants: ['me', 'strategy_fix'], last_message: 'Let me know if you want to connect on LinkedIn too.', last_message_at: '1 day ago', unread: 0,
            other_user: { username: 'strategy_fix', display_name: 'Strategy Fix', avatar: 'S' },
            messages: [
                { id: 'm9', sender_id: 'strategy_fix', content: 'Great insight on your post about monetization strategies for indie games. Really resonated with our experience.', read: true, created_at: '2 days ago' },
                { id: 'm10', sender_id: 'me', content: 'Thank you! It came from a lot of trial and error. Are you working on something currently?', read: true, created_at: '1 day ago' },
                { id: 'm11', sender_id: 'strategy_fix', content: 'Let me know if you want to connect on LinkedIn too.', read: true, created_at: '1 day ago' },
            ]
        },
    ],

    // ── EXISTING DATA (unchanged) ─────────────────────────────────────────────
    tournaments: [
        { id: 1, name: 'VALORANT WINTER SHOWDOWN II 2026', game: 'VALORANT', prize: '50,000 INR', status: 'UPCOMING', type: 'OPEN', slots: '32', date: '2026-12-20', is_public: true },
        { id: 2, name: 'CS2 MASTERS SERIES', game: 'CS2', prize: '30,000 INR', status: 'ONGOING', type: 'INVITATIONAL', slots: '16', date: '2026-11-15', is_public: true },
        { id: 3, name: 'BGMI ROYALE INVITATIONAL', game: 'BGMI', prize: '25,000 INR', status: 'UPCOMING', type: 'OPEN', slots: '64', date: '2027-01-05', is_public: false },
        { id: 4, name: 'APEX LEGENDS CLASH', game: 'APEX', prize: '15,000 INR', status: 'COMPLETED', type: 'OPEN', slots: '32', date: '2026-10-10', is_public: true },
        { id: 5, name: 'FREE FIRE SURVIVAL', game: 'FREE FIRE', prize: '20,000 INR', status: 'UPCOMING', type: 'OPEN', slots: '48', date: '2027-02-12', is_public: false },
        { id: 6, name: 'EAFC 26 KNOCKOUT', game: 'FIFA', prize: '10,000 INR', status: 'UPCOMING', type: 'OPEN', slots: '16', date: '2026-12-25', is_public: true },
    ],
    games: [
      {
        id: 101, slug: 'valorant',
        title: 'Valorant', status: 'Published', featured: true,
        genre: 'FPS', genres: ['FPS', 'Tactical Shooter'],
        platforms: ['PC'], developer: 'Riot Games',
        description: 'A 5v5 character-based tactical shooter with precise gunplay and unique agent abilities.',
        short_description: 'Tactical character-based shooter.',
        banner_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
        date: '2024-06-02', author: 'Gzone Admin',
      },
      {
        id: 102, slug: 'elden-ring',
        title: 'Elden Ring', status: 'Published', featured: true,
        genre: 'Action RPG', genres: ['Action RPG', 'Soulslike'],
        platforms: ['PC', 'PlayStation', 'Xbox'], developer: 'FromSoftware',
        description: 'A vast open-world action RPG from FromSoftware and George R.R. Martin.',
        short_description: 'Open-world action RPG masterpiece.',
        banner_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
        date: '2024-02-25', author: 'Gzone Admin',
      },
      {
        id: 103, slug: 'cyberpunk-2077',
        title: 'Cyberpunk 2077', status: 'Published', featured: true,
        genre: 'RPG', genres: ['RPG', 'Open World'],
        platforms: ['PC', 'PlayStation', 'Xbox'], developer: 'CD Projekt Red',
        description: 'An open-world action RPG set in Night City, a megalopolis obsessed with power.',
        short_description: 'Futuristic open-world RPG.',
        banner_url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&q=80',
        date: '2024-12-10', author: 'Gzone Admin',
      },
      {
        id: 104, slug: 'god-of-war-ragnarok',
        title: 'God of War Ragnarök', status: 'Published', featured: true,
        genre: 'Action-Adventure', genres: ['Action-Adventure', 'Hack and Slash'],
        platforms: ['PlayStation'], developer: 'Santa Monica Studio',
        description: 'Kratos and Atreus face the Norse apocalypse in this breathtaking sequel.',
        short_description: 'Epic Norse mythology action.',
        banner_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80',
        date: '2024-11-09', author: 'Gzone Admin',
      },
      {
        id: 105, slug: 'minecraft',
        title: 'Minecraft', status: 'Published', featured: false,
        genre: 'Sandbox', genres: ['Sandbox', 'Survival'],
        platforms: ['PC', 'Xbox', 'Mobile'], developer: 'Mojang Studios',
        description: 'Build, explore, and survive in an infinite blocky world.',
        short_description: 'The ultimate sandbox experience.',
        banner_url: 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?w=800&q=80',
        date: '2023-11-18', author: 'Gzone Admin',
      },
      {
        id: 106, slug: 'apex-legends',
        title: 'Apex Legends', status: 'Published', featured: false,
        genre: 'Battle Royale', genres: ['Battle Royale', 'FPS', 'Shooter'],
        platforms: ['PC', 'PlayStation', 'Xbox', 'Mobile'], developer: 'Respawn Entertainment',
        description: 'A free-to-play battle royale with unique legend abilities.',
        short_description: 'Hero-based battle royale.',
        banner_url: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80',
        date: '2023-02-04', author: 'Gzone Admin',
      },
      {
        id: 107, slug: 'gta-v',
        title: 'GTA V', status: 'Published', featured: false,
        genre: 'Action', genres: ['Action', 'Open World', 'Shooter'],
        platforms: ['PC', 'PlayStation', 'Xbox'], developer: 'Rockstar Games',
        description: 'The definitive open-world crime experience set in Los Santos.',
        short_description: 'Open-world crime epic.',
        banner_url: 'https://images.unsplash.com/photo-1580327332925-a10e6cb11baa?w=800&q=80',
        date: '2023-09-17', author: 'Gzone Admin',
      },
      {
        id: 108, slug: 'fortnite',
        title: 'Fortnite', status: 'Published', featured: false,
        genre: 'Battle Royale', genres: ['Battle Royale', 'Action', 'Shooter'],
        platforms: ['PC', 'PlayStation', 'Xbox', 'Mobile'], developer: 'Epic Games',
        description: 'The most popular battle royale with building mechanics and live events.',
        short_description: 'Build-and-battle royale.',
        banner_url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80',
        date: '2023-07-25', author: 'Gzone Admin',
      },
    ],
    blogs: [
        { id: 201, title: 'The Future of Open-World Gaming', category: 'Industry', status: 'Published', featured: true, updated: '2024-05-21', author: 'Editor', likes: 124, description: 'How artificial intelligence and procedural generation are reshaping the way we explore virtual worlds.', featured_image_url: "/images/blogs.jpg" },
        { id: 202, title: 'Top 10 Indie Games 2026', category: 'Reviews', status: 'Published', featured: true, updated: '2024-05-22', author: 'Gzone Admin', likes: 89, description: 'Our curated list of the most innovative and artistic independent titles that stole the spotlight this year.', featured_image_url: "/images/games.png" },
        { id: 203, title: 'VR Gaming: Beyond the Hype', category: 'Technology', status: 'Draft', featured: false, updated: '2024-05-23', author: 'Tech Writer', likes: 45, description: 'Is Virtual Reality finally ready for the mainstream? We look at the latest hardware and software breakthroughs.', featured_image_url: "/images/about.png" },
    ],
    proofs: [
        { id: 'P1', user: 'khali_gaming', subType: 'Game Creation', group: 'Unity', skill: 'C# Scripting', proofType: 'GitHub Link', submitted: '1 Hr Ago', status: 'Pending Review' },
        { id: 'P2', user: 'art_wizard', subType: 'Art & Design', group: '2D Art', skill: 'Character Sprites', proofType: 'Asset File', submitted: '3 Hrs Ago', status: 'Pending Review' },
        { id: 'P3', user: 'khali_gaming', subType: 'Game Creation', group: 'Level Design', skill: 'Greyboxing', proofType: 'Portfolio Link', submitted: '2 Days Ago', status: 'Approved' },
    ],
    activity: [
        { id: 'A1', user: 'khali_gaming', content: 'Added a new skill: Character Design', profile: 'Art & Design', date: '2 Hrs Ago', status: 'Active' },
        { id: 'A2', user: 'gamer_1', content: 'Verified skill: Unity Engine', profile: 'Game Creation', date: '1 Day Ago', status: 'Deleted' },
    ],
    communityPosts: [
        { id: "01", title: "Best Settings for Valorant Ranked 2026", type: "Tips", status: "Published", updated: "1 Day Ago", author: "User123" },
        { id: "02", title: "My Journey from Silver to Diamond", type: "Story", status: "Published", updated: "3 Days Ago", author: "GamerX" },
        { id: "03", title: "Looking for teammates — APAC Servers", type: "LFG", status: "Published", updated: "5 Hrs Ago", author: "ProPlayer1" },
        { id: "04", title: "Is Apex Legends dying in 2026?", type: "Discussion", status: "Flagged", updated: "2 Days Ago", author: "User456" },
        { id: "05", title: "Community Event — Weekly Challenge", type: "Event", status: "In Review", updated: "6 Hrs Ago", author: "Admin Name" },
        { id: "06", title: "New cheat detected?? See this video", type: "Discussion", status: "Flagged", updated: "1 Hr Ago", author: "ToxicGamer99" },
    ],
    users: [
        { id: 'U1', user: 'khali_gaming', type: 'Game Creation & Development', created: '2026-03-01', status: 'Active' },
        { id: 'U2', user: 'art_wizard', type: 'Art, Visual & Character Design', created: '2026-03-02', status: 'Active' },
        { id: 'U3', user: 'content_king', type: 'Content, Media & Community', created: '2026-03-04', status: 'Pending' },
        { id: 'U4', user: 'strategy_fix', type: 'Business, Strategy & Future Systems', created: '2026-02-28', status: 'Active' },
    ],
    organizations: [
        { id: 'O1', name: 'Gzone Studios', industry: 'Game Dev', created: '2025-10-10', status: 'Active' },
        { id: 'O2', name: 'Esports League India', industry: 'Esports', created: '2026-01-15', status: 'Active' },
    ],
    brackets: [
        { id: 'B1', name: 'Valorant Cup - Group A', type: 'Double Elimination', size: '16 Teams', status: 'Active', event: 'Valorant Cup' },
        { id: 'B2', name: 'BGMI Invitational - Semis', type: 'Points Table', size: '20 Teams', status: 'Active', event: 'BGMI Invitational' },
    ],
    results: [
        { id: 'R1', team: 'Team Hydra', event: 'Valorant Cup', rank: '#1 Winner', prize: '$10,000', status: 'Finalized' },
        { id: 'R2', team: 'GodLike Esports', event: 'BGMI Invitational', rank: '#2 RunnerUp', prize: '$5,000', status: 'Pending' },
    ],
    sponsors: [
        { id: 'S1', name: 'Red Bull', tier: 'Global Partner', commitment: '$50,000', status: 'Active', event: 'All' },
        { id: 'S2', name: 'Intel', tier: 'Tech Partner', commitment: '$30,000', status: 'Active', event: 'Valorant Cup' },
    ],
    registrations: [
        { id: 'REG1', team: 'Global Esports', event: 'Valorant Cup', player: 'SkRossi', status: 'Verified', date: '2026-03-01' },
        { id: 'REG2', team: 'Team Soul', event: 'BGMI Invitational', player: 'Mortal', status: 'Pending', date: '2026-03-02' },
        { id: 'REG3', team: 'GodLike', event: 'BGMI Invitational', player: 'Jonathan', status: 'Verified', date: '2026-03-03' },
    ],
    reviews: [
        { id: "01", title: "Valorant — The Perfect Tactical Shooter", game: "Valorant", rating: "9/10", status: "Published", updated: "2 Days Ago", author: "Editor One" },
        { id: "02", title: "Cyberpunk 2077 Redeeming Arc 2025", game: "Cyberpunk", rating: "8/10", status: "Draft", updated: "4 Days Ago", author: "Admin Name" },
        { id: "03", title: "God of War Ragnarok — Epic Conclusion", game: "GoW Ragnarok", rating: "10/10", status: "Published", updated: "1 Week Ago", author: "Editor Two" },
    ]
};

export const mockApiService = {
    // --- ESPORTS EXTENSIONS ---
    getAllBrackets: async () => [...DB.brackets],
    updateBracket: async (id, data) => { DB.brackets = DB.brackets.map(b => b.id === id ? { ...b, ...data } : b); return true; },
    deleteBracket: async (id) => { DB.brackets = DB.brackets.filter(b => b.id !== id); return true; },

    getAllResults: async () => [...DB.results],
    updateResult: async (id, data) => { DB.results = DB.results.map(r => r.id === id ? { ...r, ...data } : r); return true; },
    deleteResult: async (id) => { DB.results = DB.results.filter(r => r.id !== id); return true; },

    getAllSponsors: async () => [...DB.sponsors],
    updateSponsor: async (id, data) => { DB.sponsors = DB.sponsors.map(s => s.id === id ? { ...s, ...data } : s); return true; },
    deleteSponsor: async (id) => { DB.sponsors = DB.sponsors.filter(s => s.id !== id); return true; },

    getAllRegistrations: async () => [...DB.registrations],
    updateRegistration: async (id, data) => { DB.registrations = DB.registrations.map(r => r.id === id ? { ...r, ...data } : r); return true; },
    deleteRegistration: async (id) => { DB.registrations = DB.registrations.filter(r => r.id !== id); return true; },

    getAllReviews: async () => [...DB.reviews],
    updateReview: async (id, data) => { DB.reviews = DB.reviews.map(r => r.id === id ? { ...r, ...data } : r); return true; },
    deleteReview: async (id) => { DB.reviews = DB.reviews.filter(r => r.id !== id); return true; },

    // --- USERS & ORGS ---
    getAllUsers: async () => [...DB.users],
    updateUser: async (id, data) => { DB.users = DB.users.map(u => u.id === id ? { ...u, ...data } : u); return true; },
    deleteUser: async (id) => { DB.users = DB.users.filter(u => u.id !== id); return true; },

    getAllOrganizations: async () => [...DB.organizations],
    updateOrganization: async (id, data) => { DB.organizations = DB.organizations.map(o => o.id === id ? { ...o, ...data } : o); return true; },
    deleteOrganization: async (id) => { DB.organizations = DB.organizations.filter(o => o.id !== id); return true; },
    // --- TOURNAMENTS ---
    getPublicTournaments: async () => DB.tournaments.filter(t => t.is_public),
    getAllTournaments: async () => [...DB.tournaments],
    updateTournament: async (id, data) => {
        DB.tournaments = DB.tournaments.map(t => t.id === id ? { ...t, ...data } : t);
        return true;
    },
    addTournament: async (data) => {
        const newT = { ...data, id: Date.now() };
        DB.tournaments = [newT, ...DB.tournaments];
        return newT;
    },
    deleteTournament: async (id) => {
        DB.tournaments = DB.tournaments.filter(t => t.id !== id);
        return true;
    },

    // --- GAMES ---
    getPublicGames: async (onlyFeatured = false) => {
        let list = DB.games.filter(g => g.status === 'Published');
        if (onlyFeatured) list = list.filter(g => g.featured);
        return list;
    },
    getAllGames: async () => [...DB.games],
    updateGame: async (id, data) => {
        DB.games = DB.games.map(g => g.id === id ? { ...g, ...data } : g);
        return true;
    },

    // --- BLOGS ---
    getPublicBlogs: async (onlyFeatured = false) => {
        let list = DB.blogs.filter(b => b.status === 'Published');
        if (onlyFeatured) list = list.filter(b => b.featured);
        return list;
    },
    getAllBlogs: async () => [...DB.blogs],
    updateBlog: async (id, data) => {
        DB.blogs = DB.blogs.map(b => b.id === id ? { ...b, ...data } : b);
        return true;
    },
    addBlog: async (data) => {
        const newB = { ...data, id: Date.now() };
        DB.blogs = [newB, ...DB.blogs];
        return newB;
    },
    deleteBlog: async (id) => {
        DB.blogs = DB.blogs.filter(b => b.id !== id);
        return true;
    },
    addGame: async (data) => {
        const newG = { ...data, id: Date.now() };
        DB.games = [newG, ...DB.games];
        return newG;
    },
    deleteGame: async (id) => {
        DB.games = DB.games.filter(g => g.id !== id);
        return true;
    },

    // --- PROFILES & PROOFS ---
    getAllSkillProofs: async () => [...DB.proofs],
    updateSkillProof: async (id, data) => {
        DB.proofs = DB.proofs.map(p => p.id === id ? { ...p, ...data } : p);
        return true;
    },
    addSkillProof: async (data) => {
        const newP = { ...data, id: 'P' + Date.now(), submitted: 'Just Now', status: 'Pending Review' };
        DB.proofs = [newP, ...DB.proofs];
        return newP;
    },
    getAllActivity: async () => [...DB.activity],
    addActivity: async (data) => {
        const newA = { ...data, id: 'A' + Date.now(), date: 'Just Now', status: 'Active' };
        DB.activity = [newA, ...DB.activity];
        return newA;
    },
    deleteActivity: async (id) => {
        DB.activity = DB.activity.filter(a => a.id !== id);
        return true;
    },

    // --- COMMUNITY ---
    getAllCommunityPosts: async () => [...DB.communityPosts],
    updateCommunityPost: async (id, data) => {
        DB.communityPosts = DB.communityPosts.map(p => p.id === id ? { ...p, ...data } : p);
        return true;
    },
    deleteCommunityPost: async (id) => {
        DB.communityPosts = DB.communityPosts.filter(p => p.id !== id);
        return true;
    },

    // --- COMMUNITY BRANCHES ---
    getBranches: async () => [...DB.branches].sort((a, b) => a.sort_order - b.sort_order),
    getBranch: async (slug) => DB.branches.find(b => b.slug === slug) || null,
    updateBranchMemberCount: async (slug, delta) => {
        DB.branches = DB.branches.map(b => b.slug === slug ? { ...b, members: b.members + delta } : b);
        return true;
    },

    // --- COMMUNITY CHANNELS ---
    getChannels: async (branchSlug) => DB.channels.filter(c => c.branch_slug === branchSlug).sort((a, b) => a.sort_order - b.sort_order),
    getChannel: async (branchSlug, channelSlug) => DB.channels.find(c => c.branch_slug === branchSlug && c.slug === channelSlug) || null,

    // --- COMMUNITY GROUPS ---
    getGroups: async (branchSlug) => branchSlug ? DB.groups.filter(g => g.branch_slug === branchSlug) : [...DB.groups],
    getGroup: async (id) => DB.groups.find(g => g.id === id) || null,
    createGroup: async (data) => {
        const newG = { ...data, id: 'g' + Date.now(), members: 1 };
        DB.groups = [newG, ...DB.groups];
        return newG;
    },
    updateGroup: async (id, data) => {
        DB.groups = DB.groups.map(g => g.id === id ? { ...g, ...data } : g);
        return true;
    },
    deleteGroup: async (id) => {
        DB.groups = DB.groups.filter(g => g.id !== id);
        return true;
    },

    // --- LFG POSTS ---
    getLFGPosts: async (branchSlug) => branchSlug ? DB.lfgPosts.filter(p => p.branch_slug === branchSlug) : [...DB.lfgPosts],
    createLFGPost: async (data) => {
        const newP = { ...data, id: 'l' + Date.now(), status: 'open', filled_slots: 0 };
        DB.lfgPosts = [newP, ...DB.lfgPosts];
        return newP;
    },
    updateLFGPost: async (id, data) => {
        DB.lfgPosts = DB.lfgPosts.map(p => p.id === id ? { ...p, ...data } : p);
        return true;
    },
    deleteLFGPost: async (id) => {
        DB.lfgPosts = DB.lfgPosts.filter(p => p.id !== id);
        return true;
    },

    // --- COMMUNITY EVENTS ---
    getEvents: async (branchSlug) => branchSlug ? DB.events.filter(e => e.branch_slug === branchSlug) : [...DB.events],
    getAllEvents: async () => [...DB.events],
    createEvent: async (data) => {
        const newE = { ...data, id: 'ev' + Date.now() };
        DB.events = [newE, ...DB.events];
        return newE;
    },
    deleteEvent: async (id) => {
        DB.events = DB.events.filter(e => e.id !== id);
        return true;
    },

    // --- SUB-PROFILES ---
    getSubProfiles: async (userId) => DB.subProfiles[userId] || [],
    getSubProfile: async (userId, type) => (DB.subProfiles[userId] || []).find(sp => sp.type === type) || null,
    createSubProfile: async (userId, data) => {
        if (!DB.subProfiles[userId]) DB.subProfiles[userId] = [];
        const newSP = { ...data, is_active: true, followers: 0, following: 0, skills: [], projects: [] };
        DB.subProfiles[userId] = [...DB.subProfiles[userId], newSP];
        return newSP;
    },
    updateSubProfile: async (userId, type, data) => {
        if (!DB.subProfiles[userId]) return false;
        DB.subProfiles[userId] = DB.subProfiles[userId].map(sp => sp.type === type ? { ...sp, ...data } : sp);
        return true;
    },
    deleteSubProfile: async (userId, type) => {
        if (!DB.subProfiles[userId]) return false;
        DB.subProfiles[userId] = DB.subProfiles[userId].filter(sp => sp.type !== type);
        return true;
    },

    // Skills within sub-profile
    addSkill: async (userId, type, skill) => {
        const sp = (DB.subProfiles[userId] || []).find(sp => sp.type === type);
        if (!sp) return false;
        const newSkill = { ...skill, id: 's' + Date.now() };
        sp.skills = [...(sp.skills || []), newSkill];
        return newSkill;
    },
    removeSkill: async (userId, type, skillId) => {
        const sp = (DB.subProfiles[userId] || []).find(sp => sp.type === type);
        if (!sp) return false;
        sp.skills = (sp.skills || []).filter(s => s.id !== skillId);
        return true;
    },

    // Projects within sub-profile
    addProject: async (userId, type, project) => {
        const sp = (DB.subProfiles[userId] || []).find(sp => sp.type === type);
        if (!sp) return false;
        const newProject = { ...project, id: 'pr' + Date.now() };
        sp.projects = [...(sp.projects || []), newProject];
        return newProject;
    },
    updateProject: async (userId, type, projectId, data) => {
        const sp = (DB.subProfiles[userId] || []).find(sp => sp.type === type);
        if (!sp) return false;
        sp.projects = (sp.projects || []).map(p => p.id === projectId ? { ...p, ...data } : p);
        return true;
    },
    removeProject: async (userId, type, projectId) => {
        const sp = (DB.subProfiles[userId] || []).find(sp => sp.type === type);
        if (!sp) return false;
        sp.projects = (sp.projects || []).filter(p => p.id !== projectId);
        return true;
    },

    // --- SOCIAL POSTS ---
    getPosts: async (filters = {}) => {
        let list = [...DB.posts];
        if (filters.userId) list = list.filter(p => p.user_id === filters.userId);
        if (filters.subProfileType) list = list.filter(p => p.sub_profile_type === filters.subProfileType);
        return list;
    },
    getFeed: async () => [...DB.posts],
    createPost: async (data) => {
        const newP = { ...data, id: 'po' + Date.now(), like_count: 0, comment_count: 0, share_count: 0, created_at: 'Just now' };
        DB.posts = [newP, ...DB.posts];
        return newP;
    },
    likePost: async (id) => {
        DB.posts = DB.posts.map(p => p.id === id ? { ...p, like_count: p.like_count + 1 } : p);
        return true;
    },
    deletePost: async (id) => {
        DB.posts = DB.posts.filter(p => p.id !== id);
        return true;
    },

    // --- CONVERSATIONS (DMs) ---
    getConversations: async () => DB.conversations.map(c => ({ id: c.id, other_user: c.other_user, last_message: c.last_message, last_message_at: c.last_message_at, unread: c.unread })),
    getConversation: async (convId) => DB.conversations.find(c => c.id === convId) || null,
    getConversationWithUser: async (username) => DB.conversations.find(c => c.other_user.username === username) || null,
    sendDM: async (convId, content) => {
        const msg = { id: 'm' + Date.now(), sender_id: 'me', content, read: true, created_at: 'Just now' };
        DB.conversations = DB.conversations.map(c => {
            if (c.id === convId) return { ...c, messages: [...c.messages, msg], last_message: content, last_message_at: 'Just now', unread: 0 };
            return c;
        });
        return msg;
    },
};


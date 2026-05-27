"""
Pydantic schemas for validation and serialization
"""
from pydantic import BaseModel, EmailStr, Field, validator, UUID4
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ================== ENUMS ==================

class PlatformLevel(str, Enum):
    BEGINNER = "Beginner"
    HUSTLER = "Hustler"
    EXTREME = "Extreme"
    PRO = "Pro"

class Domain(str, Enum):
    DEV = "dev"
    ESPORTS = "esports"
    CONTENT = "content"
    BUSINESS = "business"
    ART = "art"
    WRITING = "writing"
    AUDIO = "audio"

class ProfileVisibility(str, Enum):
    PUBLIC = "public"
    CONNECTIONS_ONLY = "connections_only"
    PRIVATE = "private"

# ================== AUTH SCHEMAS ==================

class UserSignUp(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    
    @validator("username")
    def username_alphanumeric(cls, v):
        if not all(c.isalnum() or c == "_" for c in v):
            raise ValueError("Username must be alphanumeric with underscores only")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RegisterResponseData(BaseModel):
    user_id: UUID4
    username: str
    email: EmailStr
    message: str

class LoginUserData(BaseModel):
    id: UUID4
    username: str
    email: EmailStr
    role: str

class LoginResponseData(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: LoginUserData

class RefreshResponseData(BaseModel):
    access_token: str
    token_type: str = "bearer"

class OtpSendRequest(BaseModel):
    email: EmailStr

class OtpVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID4
    username: str

# ================== MASTER PROFILE SCHEMAS ==================

class MasterProfileCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    real_name: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None

class MasterProfileUpdate(BaseModel):
    real_name: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None

class MasterProfilePublicResponse(BaseModel):
    id: UUID4
    username: str
    real_name: Optional[str]
    avatar_url: Optional[str]
    banner_url: Optional[str]
    location: Optional[str]
    platform_level: PlatformLevel
    trust_score: float
    verified_checkmark: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class MasterProfileResponse(MasterProfilePublicResponse):
    bio: Optional[str]
    updated_at: datetime

# ================== SUB-PROFILE SCHEMAS ==================

class SubProfileCreate(BaseModel):
    domain: Domain
    username: str = Field(..., min_length=3, max_length=50)
    primary_role: str
    headline: Optional[str] = Field(None, max_length=80)
    bio: Optional[str] = None
    experience_level: Optional[str] = None  # Beginner, Intermediate, Advanced, Expert

class SubProfileUpdate(BaseModel):
    primary_role: Optional[str] = None
    featured_roles: Optional[List[str]] = None  # Max 3 secondary roles
    headline: Optional[str] = Field(None, max_length=80)
    bio: Optional[str] = None
    experience_level: Optional[str] = None
    avatar_url: Optional[str] = None
    visibility: Optional[ProfileVisibility] = None

class SubProfileResponse(BaseModel):
    id: UUID4
    domain: Domain
    username: str
    primary_role: str
    featured_roles: Optional[List[str]]
    headline: Optional[str]
    bio: Optional[str]
    experience_level: Optional[str]
    avatar_url: Optional[str]
    visibility: ProfileVisibility
    status: str  # Active, Idle, Dormant
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ================== SKILLS SCHEMAS ==================

class SkillCreate(BaseModel):
    skill_id: UUID4
    verification_method: Optional[str] = None  # project_demo, github_code, cert, etc.
    verification_proof_url: Optional[str] = None
    verification_proof_text: Optional[str] = None

class SkillResponse(BaseModel):
    id: UUID4
    skill_id: UUID4
    name: Optional[str]
    domain: Domain
    category: Optional[str]
    is_verified: bool
    verification_method: Optional[str]
    verified_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class SkillVerificationRequest(BaseModel):
    user_skill_id: UUID4
    reviewer_notes: Optional[str] = None
    status: str  # approved, rejected, requesting_more_info

# ================== PROJECT/PORTFOLIO SCHEMAS ==================

class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    skills_demonstrated: Optional[List[UUID4]] = None
    team_size: Optional[str] = None
    year: Optional[int] = None
    demo_url: Optional[str] = None
    source_code_url: Optional[str] = None
    # Dev-specific
    genre: Optional[str] = None
    engine_used: Optional[str] = None
    platforms: Optional[List[str]] = None

class ProjectResponse(BaseModel):
    id: UUID4
    title: str
    description: Optional[str]
    media_urls: Optional[List[str]]
    skills_demonstrated: Optional[List[UUID4]]
    team_size: Optional[str]
    year: Optional[int]
    demo_url: Optional[str]
    source_code_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ================== COMMUNITY SCHEMAS ==================

class ChannelCreate(BaseModel):
    name: str
    description: Optional[str] = None
    channel_type: Optional[str] = "text"

class ChannelResponse(BaseModel):
    id: UUID4
    name: str
    description: Optional[str]
    channel_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    content: str
    media_urls: Optional[List[str]] = None

class MessageResponse(BaseModel):
    id: UUID4
    channel_id: UUID4
    user_id: UUID4
    sub_profile_id: Optional[UUID4]
    content: str
    media_urls: Optional[List[str]]
    created_at: datetime
    edited_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class LFGPostCreate(BaseModel):
    goal_type: str
    description: str
    required_skills: Optional[List[UUID4]] = None
    availability_window: str
    timezone: str
    platform_type: Optional[str] = None
    contact_preference: Optional[str] = "dm"
    contact_url: Optional[str] = None
    auto_expire: bool = True

class LFGPostResponse(BaseModel):
    id: UUID4
    branch_id: UUID4
    goal_type: str
    description: str
    required_skills: Optional[List[UUID4]]
    timezone: str
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class ShowcasePostCreate(BaseModel):
    title: str
    description: str
    media_urls: Optional[List[str]] = None
    media_type: str  # image, video, audio, text
    skill_tags: Optional[List[UUID4]] = None

class ShowcasePostResponse(BaseModel):
    id: UUID4
    title: str
    description: str
    media_urls: Optional[List[str]]
    media_type: str
    skill_tags: Optional[List[UUID4]]
    likes_count: int
    is_featured: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str  # tournament, game_jam, writing_contest, ama, workshop, etc.
    starts_at: datetime
    ends_at: datetime
    timezone: str
    capacity: Optional[int] = None
    registration_url: Optional[str] = None

class EventResponse(BaseModel):
    id: UUID4
    title: str
    event_type: str
    starts_at: datetime
    ends_at: datetime
    timezone: str
    capacity: Optional[int]
    rsvp_count: int
    is_approved: bool
    is_featured: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ================== ADMIN SCHEMAS ==================

class UserManagementResponse(BaseModel):
    id: UUID4
    username: str
    email: str
    platform_level: PlatformLevel
    trust_score: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class VerificationQueueItemResponse(BaseModel):
    id: UUID4
    user_skill_id: UUID4
    status: str
    submitted_at: datetime
    reviewer_notes: Optional[str]
    reviewed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class ModerationQueueItemResponse(BaseModel):
    id: UUID4
    content_type: str
    report_reason: str
    status: str
    priority: str
    ai_confidence_score: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ================== PROGRESSION SCHEMAS ==================

class XPResponse(BaseModel):
    user_id: UUID4
    total_xp: int
    level: PlatformLevel
    trust_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class TrustScoreBreakdown(BaseModel):
    verified_skills_percent: float
    community_quality_percent: float
    reports_penalty_percent: float
    account_age_percent: float
    collaboration_percent: float
    referral_percent: float
    total_score: float
    
    class Config:
        from_attributes = True

# ================== COMPANY SCHEMAS ==================

class CompanyProfileCreate(BaseModel):
    slug: str
    name: str
    logo_url: Optional[str] = None
    company_type: str  # studio, publisher, esports_org, etc.
    company_size: Optional[str] = None
    founded_year: Optional[int] = None
    hq_location: Optional[str] = None
    is_remote_friendly: bool = False
    website_url: Optional[str] = None
    description: Optional[str] = None
    mission_statement: Optional[str] = None

class CompanyProfileResponse(BaseModel):
    id: UUID4
    slug: str
    name: str
    logo_url: Optional[str]
    is_verified: bool
    company_type: str
    company_size: Optional[str]
    hq_location: Optional[str]
    website_url: Optional[str]
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ApiResponse(BaseModel):
    """Generic API response wrapper"""
    success: bool
    message: str
    data: Optional[dict] = None
    errors: Optional[List[str]] = None


# ================== TOURNAMENT SCHEMAS ==================

class TournamentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    slug: Optional[str] = None
    game_slug: Optional[str] = None
    domain: Optional[str] = "esports"
    format: Optional[str] = None
    status: Optional[str] = "upcoming"
    prize_pool: Optional[str] = None
    entry_fee: Optional[float] = 0
    max_participants: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_opens: Optional[datetime] = None
    registration_closes: Optional[datetime] = None
    eligible_regions: Optional[List[str]] = None
    rules: Optional[str] = None
    refund_policy: Optional[str] = None
    banner_image: Optional[str] = None
    game_config_json: Optional[dict] = None
    highlights: Optional[List] = None
    stages: Optional[List] = None
    important_notes: Optional[str] = None
    prize_distribution: Optional[List] = None
    prize_distribution_policy: Optional[str] = None
    bracket_announcement: Optional[datetime] = None
    check_in_start: Optional[datetime] = None
    check_in_end: Optional[datetime] = None
    expected_duration: Optional[str] = None
    organizer_user_id: Optional[UUID4] = None
    full_rules_document: Optional[str] = None
    custom_registration_fields: Optional[List] = None
    platforms: Optional[List] = None
    estimated_match_duration: Optional[str] = None
    overtime_rules: Optional[str] = None
    reschedule_policy: Optional[str] = None
    noshow_rule: Optional[str] = None

class TournamentUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    prize_pool: Optional[str] = None
    entry_fee: Optional[float] = None
    max_participants: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_opens: Optional[datetime] = None
    registration_closes: Optional[datetime] = None
    eligible_regions: Optional[List[str]] = None
    rules: Optional[str] = None
    refund_policy: Optional[str] = None
    banner_image: Optional[str] = None
    game_config_json: Optional[dict] = None
    highlights: Optional[List] = None
    stages: Optional[List] = None
    important_notes: Optional[str] = None
    prize_distribution: Optional[List] = None
    prize_distribution_policy: Optional[str] = None
    bracket_announcement: Optional[datetime] = None
    check_in_start: Optional[datetime] = None
    check_in_end: Optional[datetime] = None
    expected_duration: Optional[str] = None
    organizer_user_id: Optional[UUID4] = None
    full_rules_document: Optional[str] = None
    custom_registration_fields: Optional[List] = None
    platforms: Optional[List] = None
    estimated_match_duration: Optional[str] = None
    overtime_rules: Optional[str] = None
    reschedule_policy: Optional[str] = None
    noshow_rule: Optional[str] = None

class TournamentResponse(BaseModel):
    id: UUID4
    slug: str
    title: str
    game_slug: Optional[str]
    domain: str
    format: Optional[str]
    status: str
    prize_pool: Optional[str]
    entry_fee: float
    max_participants: Optional[int]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    registration_opens: Optional[datetime]
    registration_closes: Optional[datetime]
    eligible_regions: Optional[List] = None
    rules: Optional[str] = None
    refund_policy: Optional[str] = None
    banner_image: Optional[str]
    game_config_json: Optional[dict] = None
    created_at: datetime
    registration_count: Optional[int] = 0
    highlights: Optional[List] = None
    stages: Optional[List] = None
    important_notes: Optional[str] = None
    prize_distribution: Optional[List] = None
    prize_distribution_policy: Optional[str] = None
    bracket_announcement: Optional[datetime] = None
    check_in_start: Optional[datetime] = None
    check_in_end: Optional[datetime] = None
    expected_duration: Optional[str] = None
    organizer_user_id: Optional[UUID4] = None
    full_rules_document: Optional[str] = None
    custom_registration_fields: Optional[List] = None
    platforms: Optional[List] = None
    estimated_match_duration: Optional[str] = None
    overtime_rules: Optional[str] = None
    reschedule_policy: Optional[str] = None
    noshow_rule: Optional[str] = None

    class Config:
        from_attributes = True

class RegistrationCreate(BaseModel):
    team_name: Optional[str] = None
    team_members: Optional[List[str]] = None
    game_fields: Optional[dict] = None

class RegistrationResponse(BaseModel):
    id: UUID4
    tournament_id: UUID4
    user_id: UUID4
    team_name: Optional[str]
    status: str
    registered_at: datetime

    class Config:
        from_attributes = True


# ================== SOCIAL POST SCHEMAS ==================

class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    sub_profile_type: Optional[str] = None
    media_urls: Optional[List[str]] = None

class PostResponse(BaseModel):
    id: UUID4
    user_id: UUID4
    sub_profile_type: Optional[str]
    content: str
    media_urls: Optional[List[str]]
    like_count: int
    comment_count: int
    created_at: datetime
    liked_by_me: Optional[bool] = False

    class Config:
        from_attributes = True

class PostCommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_comment_id: Optional[UUID4] = None

class PostCommentResponse(BaseModel):
    id: UUID4
    post_id: UUID4
    user_id: UUID4
    content: str
    parent_comment_id: Optional[UUID4]
    like_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class FriendRequestResponse(BaseModel):
    id: UUID4
    from_user_id: UUID4
    to_user_id: UUID4
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ================== UPDATED COMPANY SCHEMAS ==================

class CompanyCreate(BaseModel):
    slug: str = Field(..., min_length=2, max_length=120)
    name: str = Field(..., min_length=2, max_length=200)
    type: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    website: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    website: Optional[str] = None

class CompanyMemberAdd(BaseModel):
    username: str
    role: Optional[str] = "member"

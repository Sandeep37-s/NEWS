import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.article import Article
from app.models.audit_log import AuditLog
from app.models.user import User

async def record_audit_log(
    db: AsyncSession,
    action: str,
    entity_type: str,
    entity_id: str,
    user: Optional[User] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    log = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user.id if user else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details or {},
        ip_address=ip_address,
        created_at=datetime.utcnow()
    )
    db.add(log)
    await db.flush()
    return log

async def publish_article(
    db: AsyncSession,
    article: Article,
    user: Optional[User] = None,
    ip_address: Optional[str] = None
) -> Article:
    article.status = "PUBLISHED"
    article.published_at = datetime.utcnow()
    article.scheduled_at = None
    
    await record_audit_log(
        db=db,
        action="ARTICLE_PUBLISH",
        entity_type="article",
        entity_id=article.id,
        user=user,
        details={"title": article.title, "slug": article.slug},
        ip_address=ip_address
    )
    await db.commit()
    await db.refresh(article)
    return article

async def reject_article(
    db: AsyncSession,
    article: Article,
    reason: Optional[str] = None,
    user: Optional[User] = None,
    ip_address: Optional[str] = None
) -> Article:
    article.status = "REJECTED"
    
    await record_audit_log(
        db=db,
        action="ARTICLE_REJECT",
        entity_type="article",
        entity_id=article.id,
        user=user,
        details={"title": article.title, "reason": reason},
        ip_address=ip_address
    )
    await db.commit()
    await db.refresh(article)
    return article

async def schedule_article(
    db: AsyncSession,
    article: Article,
    scheduled_at: datetime,
    user: Optional[User] = None,
    ip_address: Optional[str] = None
) -> Article:
    article.status = "SCHEDULED"
    article.scheduled_at = scheduled_at
    
    await record_audit_log(
        db=db,
        action="ARTICLE_SCHEDULE",
        entity_type="article",
        entity_id=article.id,
        user=user,
        details={"title": article.title, "scheduled_at": scheduled_at.isoformat()},
        ip_address=ip_address
    )
    await db.commit()
    await db.refresh(article)
    return article

async def process_due_scheduled_articles(db: AsyncSession) -> List[Article]:
    """Find all SCHEDULED articles whose scheduled_at <= now and publish them."""
    now = datetime.utcnow()
    stmt = select(Article).where(
        and_(
            Article.status == "SCHEDULED",
            Article.scheduled_at <= now
        )
    )
    res = await db.execute(stmt)
    due_articles = res.scalars().all()
    
    published_list = []
    for art in due_articles:
        art.status = "PUBLISHED"
        art.published_at = now
        await record_audit_log(
            db=db,
            action="ARTICLE_AUTO_PUBLISHED_FROM_SCHEDULE",
            entity_type="article",
            entity_id=art.id,
            details={"title": art.title, "scheduled_at": art.scheduled_at.isoformat() if art.scheduled_at else None}
        )
        published_list.append(art)

    if published_list:
        await db.commit()
    return published_list

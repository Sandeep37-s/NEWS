from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.tag import Tag
from app.schemas.tag import TagResponse

router = APIRouter()

@router.get("", response_model=List[TagResponse])
async def list_popular_tags(limit: int = 30, db: AsyncSession = Depends(get_db)):
    stmt = select(Tag).order_by(Tag.name.asc()).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

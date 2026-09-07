from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    articles,
    categories,
    tags,
    search,
    images,
    admin,
    hot_news
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(articles.router, prefix="/articles", tags=["Articles"])
api_router.include_router(hot_news.router, prefix="/hot-news", tags=["Hot News"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(tags.router, prefix="/tags", tags=["Tags"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(images.router, prefix="/images", tags=["Images"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

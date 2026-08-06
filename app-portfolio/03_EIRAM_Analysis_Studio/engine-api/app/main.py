from fastapi import FastAPI

from app.routes.analyze import router as analyze_router
from app.routes.research import router as research_router

app = FastAPI(title="EiRAM", version="0.1.0")
app.include_router(analyze_router)
app.include_router(research_router)


@app.get("/")
def root() -> dict:
    """Health check."""
    return {"message": "EiRAM is online"}

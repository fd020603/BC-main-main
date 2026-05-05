from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.cloud_connections import router as cloud_connections_router
from app.api.cloud_discovery import router as cloud_discovery_router
from app.api.evaluate import router as evaluate_router
from app.api.merge import router as merge_router
from app.api.packs import router as packs_router
from app.api.samples import router as samples_router

app = FastAPI(
    title="Border Checker API",
    version="1.0.0",
    description="Policy-based multi-jurisdiction decision-support API for cross-border data transfer compliance review",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(merge_router)
app.include_router(packs_router)
app.include_router(evaluate_router)
app.include_router(samples_router)
app.include_router(cloud_discovery_router)
app.include_router(cloud_connections_router)


@app.get("/")
def read_root():
    return {
        "project": "Border Checker",
        "status": "ok",
        "message": "Backend is running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

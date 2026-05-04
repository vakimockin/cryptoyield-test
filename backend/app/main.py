from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.deposits import router as deposits_router


def create_app() -> FastAPI:
    app = FastAPI(title="CryptoYield Test Task", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(deposits_router, prefix="/api")

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()

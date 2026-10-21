from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, menu_admin, menu_public
from app.api.routes import orders_public

app = FastAPI(title="Restaurant SaaS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(menu_admin.router)
app.include_router(menu_public.router)
app.include_router(orders_public.router)

@app.get("/health")
def health():
    return {"status": "ok"}
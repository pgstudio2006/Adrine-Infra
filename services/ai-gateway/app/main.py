from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Adrine AI Gateway", version="0.1.0")


class RouteRequest(BaseModel):
    tenant_id: str = Field(..., description="Tenant identifier")
    model_hint: str | None = Field(None, description="Preferred model family")


class RouteResponse(BaseModel):
    routed_model: str
    budget_remaining_usd: float


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/route", response_model=RouteResponse)
def route_model(_body: RouteRequest) -> RouteResponse:
    """Stub router: production routes via policy, quotas, and governance."""
    return RouteResponse(routed_model="stub", budget_remaining_usd=100.0)

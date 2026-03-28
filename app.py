import uuid
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from httpx import AsyncClient
from httpx._exceptions import HTTPStatusError
from pydantic import BaseModel


YANDEX_SANDBOX_URL = "https://sandbox.pay.yandex.ru/api/merchant/v1/orders"
YANDEX_MERCHANT_ID = ""

class OrderRequest(BaseModel):
    total_amount: float


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = AsyncClient()
    yield
    await app.state.http_client.aclose()


app = FastAPI(lifespan=lifespan)


def get_http_client() -> AsyncClient:
    return app.state.http_client


@app.get("/hello")
async def test_rout():
    return {"message": "Hello World!"}


@app.get("/onError")
async def error_payment():
    return {"message": "payment error"}


@app.get("/onSuccess")
async def success_payment():
    return {"message": "payment success"}


@app.post("/create-order")
async def create_order(
    order: OrderRequest,
    client: Annotated[AsyncClient, Depends(get_http_client)]
):
    headers = {
        "Authorization": f"Api-Key {YANDEX_MERCHANT_ID}"
    }
    order_id = str(uuid.uuid4())

    body = {
        "cart": {
            "items": [
                {
                    "productId": "1",
                    "quantity": {"count": "1"},
                    "title": "yandex_sdk_test",
                    "total": str(order.total_amount)
                }
            ],
            "total": {"amount": str(order.total_amount)}
        },
        "orderId": order_id,
        "currencyCode": "RUB",
        "redirectUrls": {
            "onError": "http://localhost:8000/onError",
            "onSuccess": "http://localhost:8000/onSuccess",
        },
        "ttl": "180"
    }

    try:
        resp = await client.post(YANDEX_SANDBOX_URL, json=body, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        print(data)
    except HTTPStatusError as e:
        print(e)
        print(e.response.json())
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Network error: {e}")

    payment_url = data.get("data", {}).get("paymentUrl")
    return {"paymentUrl": payment_url}

frontend_path = Path(__file__).parent / "frontend"
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

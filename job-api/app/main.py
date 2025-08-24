from fastapi import FastAPI, HTTPException, Query
from celery.result import AsyncResult
from app.models import OSRequest, KatanaRequest
from app.tasks import run_os_command, run_katana, celery
from app import db

app = FastAPI(title="Job API with Celery & RabbitMQ")

@app.get("/")
async def root():
    return {"status": "ok", "note": "POST /jobs/os or /jobs/katana to enqueue a job."}

@app.post("/jobs/os")
async def enqueue_os(req: OSRequest):
    task = run_os_command.delay(req.command)
    return {"task_id": task.id}

@app.post("/jobs/katana")
async def enqueue_katana(req: KatanaRequest):
    task = run_katana.delay(str(req.url))
    return {"task_id": task.id}

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    result = AsyncResult(task_id, app=celery)
    return {"task_id": task_id, "status": result.status}

@app.get("/results")
def get_result(task_id: str):
    doc = db.get_result_by_task_id(task_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Result not found")
    return doc

@app.get("/results/paged")
async def results_paged(
    page: int = Query(1, gt=0),
    page_size: int = Query(50, gt=0, le=100),
    type: str | None = None,
    filter: str | None = None,
):
    return db.get_results_paged(page, page_size, type_filter=type, filter_text=filter)

@app.get("/results/{result_id}/urls")
async def result_urls(
    result_id: str,
    page: int = Query(1, gt=0),
    page_size: int = Query(50, gt=0, le=100),
    filter: str | None = None
):
    try:
        return db.get_urls_paged(page, page_size, result_id=result_id, filter_text=filter)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


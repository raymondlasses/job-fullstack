import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from pymongo import ASCENDING, DESCENDING
import copy

MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongo:27017")
client = MongoClient(MONGO_URI)
db = client.get_database("jobdb")
results = db.get_collection("results")
urls = db.get_collection("urls")

def save_result(job_type: str, input_data, result, meta=None, task_id=None):
    doc = {
        "type": job_type,
        "input": input_data,
        "result": result,
        "meta": meta or {},
        "timestamp": datetime.utcnow(),
    }
    if task_id:
        doc["task_id"] = task_id
    inserted = results.insert_one(doc)
    return str(inserted.inserted_id)

def get_result_by_task_id(task_id: str):
    doc = results.find_one({"task_id": str(task_id)})
    return _normalize_doc(doc)

def get_all_results(sort_desc: bool = False):
    cursor = results.find(
        {},
        {"_id": 1, "type": 1, "input": 1, "result": 1, "meta": 1, "timestamp": 1, "task_id": 1}
    )
    if sort_desc:
        cursor = cursor.sort("timestamp", DESCENDING)
    return [_normalize_doc(d) for d in cursor]


def get_result_by_id(str_id):
    doc = results.find_one({"_id": ObjectId(str_id)})
    return _normalize_doc(doc)

def save_urls_bulk(url_list, result_id: str):
    if not url_list:
        return 0
    docs = [
        {"result_id": ObjectId(result_id), "url": u, "timestamp": datetime.utcnow()}
        for u in url_list
    ]
    try:
        res = urls.insert_many(docs, ordered=False)
        return len(res.inserted_ids)
    except BulkWriteError as bwe:
        return bwe.details.get("nInserted", 0)

def _normalize_doc(doc):
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id", ""))
    if "task_id" in doc:
        doc["task_id"] = str(doc["task_id"])
    if "result_id" in doc:
        doc["result_id"] = str(doc["result_id"])
    return doc

def get_results_paged(page=1, page_size=50, type_filter=None, filter_text=None, sort="desc"):
    query = {}
    if type_filter:
        query["type"] = {"$regex": type_filter, "$options": "i"}
    if filter_text and filter_text.strip():
        query["$or"] = [
            {"input": {"$regex": filter_text, "$options": "i"}},
            {"result": {"$regex": filter_text, "$options": "i"}},
        ]

    sort_order = DESCENDING if sort == "desc" else ASCENDING
    skip = max(0, (int(page) - 1) * int(page_size))

    cursor = (
        results.find(query)
        .sort("timestamp", sort_order)
        .skip(skip)
        .limit(int(page_size))
    )
    items = [_normalize_doc(d) for d in cursor]
    total = results.count_documents(query)

    return {"total": total, "page": page, "page_size": page_size, "items": items}

def get_urls_paged(page=1, page_size=50, filter_text=None, result_id=None, sort="desc"):
    query = {}
    if result_id:
        query["result_id"] = ObjectId(result_id)
    if filter_text and filter_text.strip():
        query["url"] = {"$regex": filter_text, "$options": "i"}

    order = DESCENDING if sort == "desc" else ASCENDING
    skip = max(0, (int(page) - 1) * int(page_size))

    cursor = (
        urls.find(query)
        .sort("timestamp", order)
        .skip(skip)
        .limit(int(page_size))
    )
    items = [_normalize_doc(d) for d in cursor]
    total = urls.count_documents(query)

    return {"items": items, "total": total}

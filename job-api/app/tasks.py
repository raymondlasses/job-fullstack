import os, shlex, subprocess, docker, json
from celery import Celery
from app.db import save_result, save_urls_bulk

CELERY_BROKER = os.getenv("CELERY_BROKER_URL", "pyamqp://guest:guest@rabbitmq:5672//")
celery = Celery("tasks", broker=CELERY_BROKER)

@celery.task(bind=True, soft_time_limit=60)
def run_os_command(self, command: str):
    try:
        proc = subprocess.run(shlex.split(command), capture_output=True, text=True, timeout=50)
        output = proc.stdout.strip() or proc.stderr.strip()
        meta = {"returncode": proc.returncode}
    except Exception as e:
        output, meta = f"error: {e}", {"error": True}

    saved_id = save_result("os", command, output, meta, task_id=self.request.id)
    return {"id": saved_id, "task_id": self.request.id, "output_sample": output[:500]}


@celery.task(bind=True, soft_time_limit=120)
def run_katana(self, url: str):
    client = docker.APIClient(base_url="unix://var/run/docker.sock")
    cmd = ["katana", "-u", "-", "-jsonl", "-d", "2", "-ct", "10", "-timeout", "10", "-kf", "robotstxt", "-rl", "100"]

    try:
        container = client.create_container(
            image="projectdiscovery/katana:latest",
            command=cmd,
            stdin_open=True,
            tty=False,
            host_config=client.create_host_config(auto_remove=False)
        )
        cid = container["Id"]
        client.start(cid)

        sock = client.attach_socket(container=cid, params={"stdin": 1, "stream": 1})
        sock._sock.sendall(url.encode() + b"\n")
        sock._sock.shutdown(1)

        result = client.wait(container=cid, timeout=120)
        logs = client.logs(container=cid, stdout=True, stderr=True).decode()

        raw_urls = []
        for line in logs.splitlines():
            if not line: continue
            if line.startswith("{"):
                try:
                    obj = json.loads(line)
                    u = obj.get("url") or obj.get("request", {}).get("URL")
                    if isinstance(u, str) and u.startswith("http"):
                        raw_urls.append(u)
                    continue
                except: 
                    pass
            elif line.startswith("http"):
                raw_urls.append(line)

        url_list = list(dict.fromkeys(raw_urls))
        url_count = len(url_list)

        preview = "\n".join(url_list[:10])
        if url_count > 10:
            preview += f"\n... and {url_count - 10} more"

        saved_id = save_result("katana", url, preview,
                               meta={"exit_code": result.get("StatusCode"), "url_count": url_count},
                               task_id=self.request.id)

        save_urls_bulk(url_list, saved_id)
        client.remove_container(cid, force=True)

        return {"id": saved_id, "task_id": self.request.id, "url_count": url_count, "output_sample": preview}

    except Exception as e:
        return {"status": "error", "task_id": self.request.id, "error": str(e)}


from __future__ import annotations

import os
import pathlib
import sys
import time

import paramiko


HOST = os.environ.get("ENTANGLED_NAS_HOST", "192.168.31.214")
USER = os.environ.get("ENTANGLED_NAS_USER", "zzp")
PASSWORD = os.environ["ENTANGLED_NAS_PASSWORD"]
LOCAL_ARCHIVE = pathlib.Path(sys.argv[1]).resolve()
RELEASE_NAME = sys.argv[2]
REMOTE_ARCHIVE = f"/home/{USER}/{RELEASE_NAME}.tar.gz"
TARGET = "/vol2/entangled-shelter/dist"
BACKUP = f"/vol2/entangled-shelter/backups/before-{RELEASE_NAME}"
STAGE = f"/vol2/entangled-shelter/.stage-{RELEASE_NAME}"
FAILED = f"/vol2/entangled-shelter/backups/failed-{RELEASE_NAME}"


def run(client: paramiko.SSHClient, command: str) -> str:
    _, stdout, stderr = client.exec_command(command)
    output = stdout.read().decode("utf-8", "replace")
    error = stderr.read().decode("utf-8", "replace")
    code = stdout.channel.recv_exit_status()
    if code:
        raise RuntimeError(f"Remote command failed ({code}): {command}\n{error}{output}")
    return output.strip()


client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=15)

try:
    resolved = run(client, f"readlink -f '{TARGET}'")
    if resolved != TARGET:
        raise RuntimeError(f"Unexpected deployment target: {resolved}")
    run(client, "docker inspect entangled-shelter --format '{{.Name}} {{.State.Status}}'")
    run(client, f"mkdir -p '/vol2/entangled-shelter/backups' && test ! -e '{BACKUP}' && test ! -e '{STAGE}'")

    print(f"Uploading {LOCAL_ARCHIVE.name} ({LOCAL_ARCHIVE.stat().st_size} bytes)...", flush=True)
    with client.open_sftp() as sftp:
        remote_upload = REMOTE_ARCHIVE + ".upload"
        sftp.put(str(LOCAL_ARCHIVE), remote_upload)
        sftp.rename(remote_upload, REMOTE_ARCHIVE)

    run(client, f"mkdir '{STAGE}' && tar -xzf '{REMOTE_ARCHIVE}' -C '{STAGE}'")
    run(client, f"test -f '{STAGE}/index.html' && test -f '{STAGE}/history.html' && test -f '{STAGE}/entangled/food-film-v10.mp4' && test -f '{STAGE}/entangled/history-press.webp'")

    swap = (
        "set -e; "
        "docker stop entangled-shelter >/dev/null; "
        f"mv '{TARGET}' '{BACKUP}'; "
        f"if mv '{STAGE}' '{TARGET}'; then "
        "docker start entangled-shelter >/dev/null; "
        "else "
        f"mv '{BACKUP}' '{TARGET}'; "
        "docker start entangled-shelter >/dev/null; exit 1; "
        "fi"
    )
    run(client, swap)
    time.sleep(2)
    try:
        print(run(client, "docker exec entangled-shelter nginx -t 2>&1"), flush=True)
        print(run(client, "curl -fsS -o /dev/null -w 'home=%{http_code}' http://127.0.0.1:3090/"), flush=True)
        print(run(client, "curl -fsS -o /dev/null -w 'history=%{http_code}' http://127.0.0.1:3090/history"), flush=True)
    except Exception:
        rollback = (
            "docker stop entangled-shelter >/dev/null || true; "
            f"test ! -e '{FAILED}' && mv '{TARGET}' '{FAILED}'; "
            f"mv '{BACKUP}' '{TARGET}'; "
            "docker start entangled-shelter >/dev/null"
        )
        run(client, rollback)
        raise

    print(f"backup={BACKUP}")
    print(f"archive={REMOTE_ARCHIVE}")
finally:
    client.close()

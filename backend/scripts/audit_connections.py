from __future__ import annotations

import re
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _extract_frontend_paths(axios_instance_path: Path) -> set[str]:
    text = axios_instance_path.read_text(encoding="utf-8")

    quoted = re.findall(
        r"http\.(?:get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]",
        text,
    )
    templated = re.findall(
        r"http\.(?:get|post|put|patch|delete)\(\s*`([^`]+)`",
        text,
    )

    raw_paths: set[str] = set()
    raw_paths.update(quoted)
    for item in templated:
        # Replace ${...} chunks with a stable placeholder so we can compare to OpenAPI paths.
        raw_paths.add(re.sub(r"\$\{[^}]+\}", "{param}", item))

    normalized: set[str] = set()
    for raw in raw_paths:
        if not raw:
            continue
        if not raw.startswith("/"):
            continue

        # Strip query strings.
        path = raw.split("?", 1)[0]

        # Normalize path params: `/x/${encodeURIComponent(id)}/y` -> `/x/{param}/y`
        path = re.sub(r"/\{param\}(?=/|$)", "/{param}", path)

        normalized.add(path)

    return normalized


def _as_openapi_matcher(path: str) -> re.Pattern[str]:
    # OpenAPI uses `{name}` path params; normalize any placeholder the same way.
    normalized = re.sub(r"\{param\}", "{param}", path)
    pattern = re.escape(normalized)
    pattern = pattern.replace(re.escape("{param}"), r"[^/]+")
    pattern = re.sub(r"\\\{[^}]+\\\}", r"[^/]+", pattern)
    return re.compile(rf"^{pattern}$")


def main() -> int:
    repo_root = _repo_root()
    axios_instance = repo_root / "frontend" / "src" / "api" / "axiosInstance.js"

    if not axios_instance.exists():
        print(f"[audit] Missing frontend file: {axios_instance}")
        return 2

    # Import backend app (must run with backend/ on sys.path).
    backend_root = repo_root / "backend"
    sys.path.insert(0, str(backend_root))
    import run  # noqa: E402

    openapi_paths = set((run.app.openapi() or {}).get("paths", {}).keys())
    frontend_paths = _extract_frontend_paths(axios_instance)

    # Frontend paths are relative to API_BASE_URL (defaults to `/api`).
    resolved_frontend_paths = {f"/api{p}" for p in frontend_paths}

    missing: list[str] = []
    openapi_matchers = [(path, _as_openapi_matcher(path)) for path in openapi_paths]
    for client_path in sorted(resolved_frontend_paths):
        if client_path in openapi_paths:
            continue
        if any(matcher.match(client_path) for _, matcher in openapi_matchers):
            continue
        missing.append(client_path)

    print(f"[audit] Frontend axios paths: {len(frontend_paths)}")
    print(f"[audit] Backend OpenAPI paths: {len(openapi_paths)}")
    if missing:
        print("[audit] Missing in backend OpenAPI:")
        for item in missing:
            print(f"  - {item}")
        return 1

    print("[audit] OK: all frontend axios paths exist in backend OpenAPI.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


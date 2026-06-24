"""Safe server-side Anthropic integration with deterministic degradation."""

import json
import os
from urllib import request as urlrequest


def fallback(profile: dict, roles: dict, query: str, recommend) -> dict:
    recommendations = recommend(profile, roles, profile.get("interests", []), query, 3)
    ids = [item["role"]["id"] for item in recommendations if item["role"]["id"] in roles][:3]
    if ids:
        names = ", ".join(item["role"]["name"] for item in recommendations[:len(ids)])
        message = f"Based on your profile, start by comparing {names}. These are deterministic recommendations while the AI guide is unavailable."
    else:
        message = "Start with a role that uses your existing strengths, then use its path to identify the smallest next skill to build."
    return {"mode": "fallback", "message": message, "suggestedRoleIds": ids}


def call_anthropic(prompt: str) -> str:
    """Return provider text. This narrow seam is intentionally easy to replace in tests."""
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("provider unavailable")
    payload = json.dumps({
        "model": os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-latest"),
        "max_tokens": 400,
        "messages": [{"role": "user", "content": prompt}],
    }).encode()
    req = urlrequest.Request("https://api.anthropic.com/v1/messages", data=payload, headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"}, method="POST")
    with urlrequest.urlopen(req, timeout=8) as response:  # nosec B310: fixed provider URL
        body = json.loads(response.read().decode())
    return body["content"][0]["text"]


def guide(profile: dict, roles: dict, messages: list[dict], recommend) -> dict:
    user_text = "\n".join(message["content"] for message in messages if message["role"] == "user")
    role_catalog = [{"id": role_id, "name": role["name"], "skills": role.get("requiredSkills", [])[:8]} for role_id, role in roles.items()]
    prompt = (
        "You are a concise career guide. Return ONLY valid JSON: "
        '{"message":"short helpful guidance","suggestedRoleIds":["catalog-id"]}. '
        "Use zero to three IDs from the supplied catalog only.\n"
        f"Profile: {json.dumps({'skills': profile.get('skills', []), 'interests': profile.get('interests', []), 'headline': profile.get('headline', '')})}\n"
        f"Catalog: {json.dumps(role_catalog)}\nConversation: {json.dumps(messages)}"
    )
    try:
        response_text = call_anthropic(prompt).strip()
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        parsed = json.loads(response_text)
        message = parsed.get("message")
        ids = parsed.get("suggestedRoleIds", [])
        if not isinstance(message, str) or not message.strip() or not isinstance(ids, list):
            raise ValueError("malformed provider response")
        valid_ids = [role_id for role_id in ids if isinstance(role_id, str) and role_id in roles][:3]
        return {"mode": "ai", "message": message.strip()[:1200], "suggestedRoleIds": valid_ids}
    except Exception:
        return fallback(profile, roles, user_text, recommend)

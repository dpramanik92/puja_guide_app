import json
import math
import os
import re
import time

import requests
from langchain_core.messages import ToolMessage
from langchain_core.tools import tool

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

_KOLKATA = {"lat": 22.5726, "lng": 88.3639}


# ── private helpers ───────────────────────────────────────────────────────────

def _geocode(place_name: str) -> dict:
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    candidates = [
        place_name,
        f"{place_name}, Kolkata",
        f"{place_name}, Kolkata, West Bengal, India",
    ]
    for candidate in candidates:
        data = requests.get(
            url,
            params={
                "address": candidate,
                "key": GOOGLE_MAPS_API_KEY,
                "region": "in",
                "bounds": "22.4,88.2|22.7,88.5",
            },
            timeout=10,
        ).json()
        if data["status"] == "OK" and data["results"]:
            loc = data["results"][0]["geometry"]["location"]
            return {
                "lat": loc["lat"],
                "lng": loc["lng"],
                "name": data["results"][0]["formatted_address"],
            }
    raise ValueError(f"Could not find location '{place_name}'.")


def _decode_polyline(encoded: str) -> list:
    coords, idx, lat, lng = [], 0, 0, 0
    while idx < len(encoded):
        for is_lng in (False, True):
            shift = result = 0
            while True:
                b = ord(encoded[idx]) - 63
                idx += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            delta = ~(result >> 1) if result & 1 else result >> 1
            if is_lng:
                lng += delta
            else:
                lat += delta
        coords.append([lat / 1e5, lng / 1e5])
    return coords


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    dlat, dlng = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def _nearby_search(lat: float, lng: float, radius: int, **extra_params) -> list:
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {"location": f"{lat},{lng}", "radius": radius, "key": GOOGLE_MAPS_API_KEY, **extra_params}
    results = []
    while True:
        data = requests.get(url, params=params, timeout=10).json()
        results.extend(data.get("results", []))
        next_token = data.get("next_page_token")
        if not next_token:
            break
        time.sleep(2)
        params = {"pagetoken": next_token, "key": GOOGLE_MAPS_API_KEY}
    results.sort(key=lambda r: _haversine_km(
        lat, lng,
        r["geometry"]["location"]["lat"],
        r["geometry"]["location"]["lng"],
    ))
    return results


_PUJA_KEYWORDS = ["durga puja pandal", "durga puja committee", "sarbojanin durga puja"]
_MIN_RATING = 3.5
_MIN_REVIEWS = 10


def _prominence(r: dict) -> float:
    rating = r.get("rating") or 0
    reviews = r.get("user_ratings_total") or 0
    return rating * math.log10(reviews + 1)


def _search_pandals(lat: float, lng: float, radius: int) -> list:
    seen, results = set(), []
    for kw in _PUJA_KEYWORDS:
        for r in _nearby_search(lat, lng, radius, keyword=kw):
            pid = r.get("place_id")
            if pid and pid not in seen:
                seen.add(pid)
                results.append(r)
    results = [
        r for r in results
        if (r.get("rating") or 0) >= _MIN_RATING
        and (r.get("user_ratings_total") or 0) >= _MIN_REVIEWS
    ]
    results.sort(
        key=lambda r: _prominence(r) / (
            _haversine_km(lat, lng,
                          r["geometry"]["location"]["lat"],
                          r["geometry"]["location"]["lng"]) + 0.1
        ),
        reverse=True,
    )
    return results


# ── tools ─────────────────────────────────────────────────────────────────────

@tool
def search_nearby_pujas(location: str, radius: int = 5000) -> dict:
    """
    Search for Durga Puja pandals near a named location.
    Use when the user wants to find or list pandals near a place.

    Args:
        location: Location name (e.g. 'Bagbazar', 'College Square', 'Shyambazar').
        radius:   Search radius in metres. Defaults to 5000.
    """
    coords = _geocode(location)
    results = _search_pandals(coords["lat"], coords["lng"], radius)
    return {
        "location": location,
        "pandals": [
            {
                "name": r.get("name"),
                "address": r.get("vicinity"),
                "rating": r.get("rating"),
                "reviews": r.get("user_ratings_total"),
                "distance_km": round(_haversine_km(
                    coords["lat"], coords["lng"],
                    r["geometry"]["location"]["lat"],
                    r["geometry"]["location"]["lng"],
                ), 2),
                "lat": r["geometry"]["location"]["lat"],
                "lng": r["geometry"]["location"]["lng"],
            }
            for r in results
        ],
    }


@tool
def search_nearby_places(location: str, place_type: str = "restaurant", radius: int = 1000) -> dict:
    """
    Search for places like restaurants, cafes, or bakeries near a named location.
    Use when the user asks for food, cafes, restaurants, or any non-puja venue nearby.

    Args:
        location:   Location name (e.g. 'Bagbazar', 'College Square').
        place_type: Google Places type — 'restaurant', 'cafe', 'bakery', 'bar'. Defaults to 'restaurant'.
        radius:     Search radius in metres. Defaults to 1000.
    """
    coords = _geocode(location)
    results = _nearby_search(coords["lat"], coords["lng"], radius, type=place_type)
    return {
        "location": location,
        "place_type": place_type,
        "places": [
            {
                "name": r.get("name"),
                "address": r.get("vicinity"),
                "rating": r.get("rating"),
                "open_now": r.get("opening_hours", {}).get("open_now"),
                "lat": r["geometry"]["location"]["lat"],
                "lng": r["geometry"]["location"]["lng"],
            }
            for r in results
        ],
    }


@tool
def get_directions(origin: str, destination: str, mode: str = "driving") -> dict:
    """
    Get turn-by-turn directions between two locations.
    Use when the user wants to know how to travel from one place to another.

    Args:
        origin:      Starting location name or address.
        destination: Destination location name or address.
        mode:        'driving', 'walking', 'bicycling', or 'transit'. Defaults to 'driving'.
    """
    try:
        data = requests.get(
            "https://maps.googleapis.com/maps/api/directions/json",
            params={
                "origin": origin,
                "destination": destination,
                "mode": mode,
                "key": GOOGLE_MAPS_API_KEY,
            },
            timeout=10,
        ).json()

        if data["status"] != "OK":
            return {"status": "error", "message": data.get("error_message", data["status"])}

        route = data["routes"][0]
        leg = route["legs"][0]
        steps = [
            {
                "step": idx,
                "instruction": re.sub(r"<[^>]+>", "", s["html_instructions"]),
                "distance": s["distance"]["text"],
                "duration": s["duration"]["text"],
            }
            for idx, s in enumerate(leg["steps"], start=1)
        ]
        return {
            "status": "success",
            "origin": leg["start_address"],
            "destination": leg["end_address"],
            "origin_lat": leg["start_location"]["lat"],
            "origin_lng": leg["start_location"]["lng"],
            "dest_lat": leg["end_location"]["lat"],
            "dest_lng": leg["end_location"]["lng"],
            "polyline_coords": _decode_polyline(route["overview_polyline"]["points"]),
            "distance": leg["distance"]["text"],
            "duration": leg["duration"]["text"],
            "mode": mode,
            "steps": steps,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
def plan_puja_route(origin: str, radius: int = 5000, max_stops: int = 5) -> dict:
    """
    Create an optimised puja-hopping itinerary from a starting location.
    Use when the user wants a plan, itinerary, or route to visit multiple pandals.

    Args:
        origin:    Starting location name (e.g. 'Chaltabagan', 'Shyambazar').
        radius:    Search radius for pandals in metres. Defaults to 5000.
        max_stops: Maximum pandals to include. Defaults to 5.
    """
    coords = _geocode(origin)
    lat, lng = coords["lat"], coords["lng"]
    results = _search_pandals(lat, lng, radius)
    if not results:
        return {"status": "error", "message": f"No pandals found within {radius}m of {origin}."}

    pandals = results[:max_stops]
    cur_lat, cur_lng = lat, lng
    ordered, remaining = [], list(pandals)
    while remaining:
        closest = min(
            remaining,
            key=lambda p: (
                (p["geometry"]["location"]["lat"] - cur_lat) ** 2
                + (p["geometry"]["location"]["lng"] - cur_lng) ** 2
            ),
        )
        ordered.append(closest)
        cur_lat = closest["geometry"]["location"]["lat"]
        cur_lng = closest["geometry"]["location"]["lng"]
        remaining.remove(closest)

    legs = []
    current = origin
    for stop in ordered:
        dest = f'{stop["name"]}, Kolkata'
        directions = get_directions.invoke({"origin": current, "destination": dest, "mode": "walking"})
        legs.append({"from": current, "to": stop["name"], "directions": directions})
        current = stop["name"]

    return {
        "status": "success",
        "start": origin,
        "stops": [p["name"] for p in ordered],
        "stop_details": [
            {
                "name": p["name"],
                "lat": p["geometry"]["location"]["lat"],
                "lng": p["geometry"]["location"]["lng"],
            }
            for p in ordered
        ],
        "route_legs": legs,
    }


MAP_TOOLS = [search_nearby_pujas, search_nearby_places, get_directions, plan_puja_route]
MAP_TOOL_NAMES = {t.name for t in MAP_TOOLS}


# ── map data extractor ────────────────────────────────────────────────────────

def extract_map_data(messages: list) -> dict:
    """Parse ToolMessages from agent output and build markers + polylines for the frontend."""
    markers, polylines = [], []

    for msg in messages:
        if not isinstance(msg, ToolMessage):
            continue
        try:
            data = json.loads(msg.content)
        except (json.JSONDecodeError, TypeError):
            continue
        name = getattr(msg, "name", "") or ""

        if name == "search_nearby_pujas":
            for p in data.get("pandals", []):
                if p.get("lat") and p.get("lng"):
                    markers.append({
                        "name": p["name"],
                        "lat": p["lat"],
                        "lng": p["lng"],
                        "type": "pandal",
                        "info": (
                            f"⭐ {p.get('rating', '?')} ({p.get('reviews', '?')} reviews)"
                            f"<br>{p.get('address', '')}"
                            f"<br>{p.get('distance_km', '?')} km away"
                        ),
                    })

        elif name == "search_nearby_places":
            for p in data.get("places", []):
                if p.get("lat") and p.get("lng"):
                    markers.append({
                        "name": p["name"],
                        "lat": p["lat"],
                        "lng": p["lng"],
                        "type": "place",
                        "info": f"⭐ {p.get('rating', '?')}<br>{p.get('address', '')}",
                    })

        elif name == "get_directions" and data.get("status") == "success":
            if data.get("origin_lat"):
                markers.append({
                    "name": data["origin"],
                    "lat": data["origin_lat"],
                    "lng": data["origin_lng"],
                    "type": "origin",
                    "info": f"Start: {data['origin']}",
                })
            if data.get("dest_lat"):
                markers.append({
                    "name": data["destination"],
                    "lat": data["dest_lat"],
                    "lng": data["dest_lng"],
                    "type": "destination",
                    "info": f"End: {data['destination']}<br>{data.get('distance')} · {data.get('duration')}",
                })
            if data.get("polyline_coords"):
                polylines.append({"coords": data["polyline_coords"], "color": "#2563EB"})

        elif name == "plan_puja_route" and data.get("status") == "success":
            for stop in data.get("stop_details", []):
                markers.append({
                    "name": stop["name"],
                    "lat": stop["lat"],
                    "lng": stop["lng"],
                    "type": "pandal",
                    "info": stop["name"],
                })
            for leg in data.get("route_legs", []):
                coords = leg.get("directions", {}).get("polyline_coords")
                if coords:
                    polylines.append({"coords": coords, "color": "#16A34A"})

    center = _KOLKATA
    if markers:
        center = {
            "lat": sum(m["lat"] for m in markers) / len(markers),
            "lng": sum(m["lng"] for m in markers) / len(markers),
        }
    return {"markers": markers, "polylines": polylines, "center": center}

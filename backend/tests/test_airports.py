from app.api.v1.endpoints.directories import list_airports


def test_list_airports_returns_full_directory():
    airports = list_airports()
    assert len(airports) >= 30
    codes = {airport["code"] for airport in airports}
    assert "SVO" in codes
    assert "LED" in codes


def test_list_airports_search_filters_by_code():
    airports = list_airports(search="svo")
    assert any(airport["code"] == "SVO" for airport in airports)
    assert all("svo" in airport["code"].lower() or "svo" in airport["name"].lower() for airport in airports)


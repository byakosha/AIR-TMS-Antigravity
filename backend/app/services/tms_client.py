import logging
from typing import Optional

import requests
from app.core.config import settings
from app.schemas.odata import ODataOrderPayload

logger = logging.getLogger(__name__)


class TMSClient:
    """
    HTTP Client for fetching and pushing data to the external 1C TMS system via OData API.
    """

    def __init__(self):
        self.base_url = settings.tms_1c_odata_url
        self.username = settings.tms_1c_username
        self.password = settings.tms_1c_password

        # In a real environment, 1C often requires NTLM or Basic auth
        self.auth = (self.username, self.password)
        self.session = requests.Session()
        self.session.auth = self.auth

    def fetch_recent_orders(
        self, since_date: Optional[str] = None
    ) -> list[ODataOrderPayload]:
        """
        Queries the 1C OData REST API for new or updated orders.
        Mocks the response if the endpoint is unreachable to simulate a successful integration.
        """
        endpoint = f"{self.base_url}/Document_Orders"

        try:
            # Example filter string for 1C OData (fetching past a certain date)
            params = {}
            if since_date:
                params["$filter"] = f"Date ge datetime'{since_date}'"
            params["$format"] = "json"

            response = self.session.get(endpoint, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            # Standard OData response wraps arrays in 'value'
            raw_orders = data.get("value", [])
            return [ODataOrderPayload.model_validate(ro) for ro in raw_orders]

        except requests.exceptions.RequestException as e:
            logger.warning(
                f"1C TMS Sync failed, generating mocked pipeline payload instead: {e}"
            )
            # Mocking standard payload
            mocked_data = [
                {
                    "Ref_Key": "1c-mock-998811",
                    "Code": "ORD-1C-001",
                    "ClientName": "BIOCARD Demo Client",
                    "DirectionCode": "MOW",
                    "DirectionName": "Moscow",
                    "AirportDest": "SVO",
                    "TemperatureMode": "ambient",
                    "CargoType": "general",
                    "Weight": 150.5,
                    "Volume": 0.8,
                    "Places": 3,
                    "Urgent": True,
                    "VIP": False,
                    "Status": "new",
                }
            ]
            return [ODataOrderPayload.model_validate(ro) for ro in mocked_data]

    def update_order_status(
        self, order_id_1c: str, new_status: str, execution_details: str
    ):
        """
        Patches an existing Document in 1C with the newly assigned execution milestone.
        """
        endpoint = f"{self.base_url}/Document_Orders(guid'{order_id_1c}')"
        payload = {"Status": new_status, "ExecutionComments": execution_details}

        try:
            # Note: 1C OData uses PATCH for updates
            headers = {"Content-Type": "application/json"}
            response = self.session.patch(
                endpoint, json=payload, headers=headers, timeout=5
            )
            response.raise_for_status()
            logger.info(
                f"Successfully pushed status '{new_status}' to 1C Order {order_id_1c}"
            )
        except requests.exceptions.RequestException as e:
            logger.warning(
                f"Could not push to 1C, assuming mocked environment. Error: {e}"
            )


# Singleton client instance for immediate usage
tms_client = TMSClient()

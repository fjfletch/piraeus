"""Supabase database service for CRUD operations.

This service provides methods to interact with the Supabase database
for tools, prompts, and flows using the Supabase Python client.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID
import json

from loguru import logger
from supabase import create_client, Client

from ..config.settings import get_settings


class SupabaseService:
    """Service for interacting with Supabase database."""

    def __init__(self, client: Optional[Client] = None):
        """Initialize the Supabase service.
        
        Args:
            client: Supabase client (if None, creates one from settings)
        """
        if client:
            self.client = client
        else:
            settings = get_settings()
            if not settings.supabase_url or not settings.supabase_key:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
            
            self.client = create_client(
                settings.supabase_url,
                settings.supabase_key
            )
        
        logger.info("✅ SupabaseService initialized")

    # ========================================================================
    # TOOLS OPERATIONS
    # ========================================================================

    async def create_tool(
        self,
        name: str,
        description: Optional[str],
        tool_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new tool in the database.

        Args:
            name: Unique tool name
            description: Optional description
            tool_config: Tool configuration as dict

        Returns:
            Created tool with all fields including id and timestamps

        Raises:
            ValueError: If tool with same name exists
            Exception: If creation fails
        """
        logger.info(f"Creating tool in DB: {name}")

        try:
            result = self.client.table("tools").insert({
                "name": name,
                "description": description,
                "tool_config": tool_config,
            }).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"✅ Tool created: {name}")
                return result.data[0]

            raise Exception("No result returned from database")

        except Exception as e:
            error_msg = str(e).lower()
            if "duplicate" in error_msg or "unique" in error_msg:
                raise ValueError(f"Tool with name '{name}' already exists")
            logger.error(f"Failed to create tool: {e}")
            raise

    async def get_tool(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieve a tool by name.

        Args:
            name: Tool name to retrieve

        Returns:
            Tool data if found, None otherwise
        """
        logger.info(f"Retrieving tool from DB: {name}")

        try:
            result = self.client.table("tools").select("*").eq("name", name).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"✅ Tool found: {name}")
                return result.data[0]

            logger.info(f"❌ Tool not found: {name}")
            return None

        except Exception as e:
            logger.error(f"Failed to retrieve tool: {e}")
            raise

    async def list_tools(
        self,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> tuple[List[Dict[str, Any]], int]:
        """List all tools with optional pagination.

        Args:
            limit: Maximum number of tools to return
            offset: Number of tools to skip

        Returns:
            Tuple of (list of tool records, total count)
        """
        logger.info(f"Listing tools from DB (limit={limit}, offset={offset})")

        try:
            # Get total count
            count_result = self.client.table("tools").select("*", count="exact").execute()
            total = count_result.count or 0

            # Get paginated results
            query = self.client.table("tools").select("*").order("created_at", desc=True)

            if limit:
                query = query.limit(limit)

            query = query.offset(offset)
            result = query.execute()

            tools = result.data or []

            logger.info(f"✅ Found {len(tools)} tools (total: {total})")
            return tools, total

        except Exception as e:
            logger.error(f"Failed to list tools: {e}")
            raise

    async def update_tool(
        self,
        name: str,
        new_name: Optional[str] = None,
        description: Optional[str] = None,
        tool_config: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Update an existing tool.

        Args:
            name: Tool name to update
            new_name: New name (if renaming)
            description: New description (if provided)
            tool_config: New configuration (if provided)

        Returns:
            Updated tool data, or None if not found
        """
        logger.info(f"Updating tool in DB: {name}")

        try:
            # Build update payload
            update_data = {}

            if new_name is not None:
                update_data["name"] = new_name

            if description is not None:
                update_data["description"] = description

            if tool_config is not None:
                update_data["tool_config"] = tool_config

            if not update_data:
                raise ValueError("No fields to update")

            result = self.client.table("tools").update(update_data).eq("name", name).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"✅ Tool updated: {name}")
                return result.data[0]

            logger.info(f"❌ Tool not found for update: {name}")
            return None

        except Exception as e:
            logger.error(f"Failed to update tool: {e}")
            raise

    async def delete_tool(self, name: str) -> bool:
        """Delete a tool by name.

        Args:
            name: Tool name to delete

        Returns:
            True if deleted, False if not found
        """
        logger.info(f"Deleting tool from DB: {name}")

        try:
            result = self.client.table("tools").delete().eq("name", name).execute()

            # Supabase returns count of affected rows
            if result.data:
                logger.info(f"✅ Tool deleted: {name}")
                return True

            logger.info(f"❌ Tool not found for deletion: {name}")
            return False

        except Exception as e:
            logger.error(f"Failed to delete tool: {e}")
            raise

    # ========================================================================
    # PROMPTS OPERATIONS
    # ========================================================================

    async def create_prompt(
        self,
        name: str,
        description: Optional[str],
        prompt_template: str,
        variables: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create a new prompt in the database."""
        logger.info(f"Creating prompt in DB: {name}")

        try:
            result = self.client.table("prompts").insert({
                "name": name,
                "description": description,
                "prompt_template": prompt_template,
                "variables": variables,
            }).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"✅ Prompt created: {name}")
                return result.data[0]

            raise Exception("No result returned from database")

        except Exception as e:
            error_msg = str(e).lower()
            if "duplicate" in error_msg or "unique" in error_msg:
                raise ValueError(f"Prompt with name '{name}' already exists")
            logger.error(f"Failed to create prompt: {e}")
            raise

    async def get_prompt(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieve a prompt by name."""
        logger.info(f"Retrieving prompt from DB: {name}")

        try:
            result = self.client.table("prompts").select("*").eq("name", name).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"✅ Prompt found: {name}")
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Failed to retrieve prompt: {e}")
            raise

    async def list_prompts(
        self,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> tuple[List[Dict[str, Any]], int]:
        """List all prompts with optional pagination."""
        logger.info(f"Listing prompts from DB (limit={limit}, offset={offset})")

        try:
            # Get total count
            count_result = self.client.table("prompts").select("*", count="exact").execute()
            total = count_result.count or 0

            # Get paginated results
            query = self.client.table("prompts").select("*").order("created_at", desc=True)

            if limit:
                query = query.limit(limit)

            query = query.offset(offset)
            result = query.execute()

            prompts = result.data or []

            logger.info(f"✅ Found {len(prompts)} prompts (total: {total})")
            return prompts, total

        except Exception as e:
            logger.error(f"Failed to list prompts: {e}")
            raise

    async def update_prompt(
        self,
        name: str,
        new_name: Optional[str] = None,
        description: Optional[str] = None,
        prompt_template: Optional[str] = None,
        variables: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[Dict[str, Any]]:
        """Update an existing prompt."""
        logger.info(f"Updating prompt in DB: {name}")

        try:
            update_data = {}

            if new_name is not None:
                update_data["name"] = new_name

            if description is not None:
                update_data["description"] = description

            if prompt_template is not None:
                update_data["prompt_template"] = prompt_template

            if variables is not None:
                update_data["variables"] = variables

            if not update_data:
                raise ValueError("No fields to update")

            result = self.client.table("prompts").update(update_data).eq("name", name).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"✅ Prompt updated: {name}")
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Failed to update prompt: {e}")
            raise

    async def delete_prompt(self, name: str) -> bool:
        """Delete a prompt by name."""
        logger.info(f"Deleting prompt from DB: {name}")

        try:
            result = self.client.table("prompts").delete().eq("name", name).execute()

            if result.data:
                logger.info(f"✅ Prompt deleted: {name}")
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to delete prompt: {e}")
            raise

    # ========================================================================
    # FLOWS OPERATIONS
    # ========================================================================

    async def create_flow(
        self,
        name: str,
        description: Optional[str],
        steps: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create a new flow in the database."""
        logger.info(f"Creating flow in DB: {name}")

        try:
            result = self.client.table("flows").insert({
                "name": name,
                "description": description,
                "steps": steps,
            }).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"✅ Flow created: {name}")
                return result.data[0]

            raise Exception("No result returned from database")

        except Exception as e:
            error_msg = str(e).lower()
            if "duplicate" in error_msg or "unique" in error_msg:
                raise ValueError(f"Flow with name '{name}' already exists")
            logger.error(f"Failed to create flow: {e}")
            raise

    async def get_flow(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieve a flow by name."""
        logger.info(f"Retrieving flow from DB: {name}")

        try:
            result = self.client.table("flows").select("*").eq("name", name).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"✅ Flow found: {name}")
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Failed to retrieve flow: {e}")
            raise

    async def list_flows(
        self,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> tuple[List[Dict[str, Any]], int]:
        """List all flows with optional pagination."""
        logger.info(f"Listing flows from DB (limit={limit}, offset={offset})")

        try:
            # Get total count
            count_result = self.client.table("flows").select("*", count="exact").execute()
            total = count_result.count or 0

            # Get paginated results
            query = self.client.table("flows").select("*").order("created_at", desc=True)

            if limit:
                query = query.limit(limit)

            query = query.offset(offset)
            result = query.execute()

            flows = result.data or []

            logger.info(f"✅ Found {len(flows)} flows (total: {total})")
            return flows, total

        except Exception as e:
            logger.error(f"Failed to list flows: {e}")
            raise

    async def update_flow(
        self,
        name: str,
        new_name: Optional[str] = None,
        description: Optional[str] = None,
        steps: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[Dict[str, Any]]:
        """Update an existing flow."""
        logger.info(f"Updating flow in DB: {name}")

        try:
            update_data = {}

            if new_name is not None:
                update_data["name"] = new_name

            if description is not None:
                update_data["description"] = description

            if steps is not None:
                update_data["steps"] = steps

            if not update_data:
                raise ValueError("No fields to update")

            result = self.client.table("flows").update(update_data).eq("name", name).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"✅ Flow updated: {name}")
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Failed to update flow: {e}")
            raise

    async def delete_flow(self, name: str) -> bool:
        """Delete a flow by name."""
        logger.info(f"Deleting flow from DB: {name}")

        try:
            result = self.client.table("flows").delete().eq("name", name).execute()

            if result.data:
                logger.info(f"✅ Flow deleted: {name}")
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to delete flow: {e}")
            raise


# Global service instance
_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Get or create the global Supabase service instance.

    Returns:
        SupabaseService instance
    """
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service

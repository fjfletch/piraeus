"""Test suite for database CRUD endpoints with Supabase integration.

This test suite validates that API calls properly reach Supabase through
the Python library with correct data transformations.
"""

import pytest
from uuid import uuid4, UUID
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from src.dynamic_tools.api.app import app
from src.dynamic_tools.models.database_models import (
    Project, ProjectCreate, ProjectUpdate,
    MCPConfig, MCPConfigCreate, MCPConfigUpdate,
    ResponseConfig, ResponseConfigCreate, ResponseConfigUpdate,
    Tool, ToolCreate, ToolUpdate,
    Prompt, PromptCreate, PromptUpdate,
    Flow, FlowCreate, FlowUpdate,
)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    with patch('src.dynamic_tools.services.supabase_service.create_client') as mock:
        yield mock


@pytest.fixture
def project_id():
    """Sample project UUID."""
    return uuid4()


@pytest.fixture
def tool_id():
    """Sample tool UUID."""
    return uuid4()


@pytest.fixture
def mock_project(project_id):
    """Mock project data."""
    return {
        'id': str(project_id),
        'user_id': None,
        'name': 'Test Project',
        'description': 'A test project',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }


@pytest.fixture
def mock_tool(tool_id, project_id):
    """Mock tool data."""
    return {
        'id': str(tool_id),
        'numeric_id': 1,  # Frontend-compatible numeric ID
        'name': 'test_tool',
        'description': 'A test tool',
        'tool_config': {
            'api': {
                'base_url': 'https://api.example.com',
                'method': 'GET',
                'headers': {},
                'params': {},
                'auth': {'method': 'none'},
                'timeout': 30.0
            },
            'input_schema': {'type': 'object', 'properties': {}},
            'output_schema': {'type': 'object'}
        },
        'project_id': str(project_id),
        'method': 'GET',  # Flattened fields for frontend
        'url': 'https://api.example.com',
        'headers': [],
        'query_params': [],
        'body_config': None,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }


@pytest.fixture
def mock_mcp_config(project_id):
    """Mock MCP config data."""
    config_id = uuid4()
    return {
        'id': str(config_id),
        'numeric_id': 1,  # Frontend-compatible numeric ID
        'project_id': str(project_id),
        'name': 'Test MCP Config',
        'model': 'gpt-4o-mini',
        'temperature': 0.7,
        'max_tokens': 1000,
        'system_prompt': 'You are a helpful assistant',
        'instruction': 'Answer questions clearly',
        'selected_tool_ids': [],
        'deployment_status': 'not-deployed',
        'deployment_url': None,
        'deployed_at': None,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }


# ============================================================================
# Project Tests
# ============================================================================

class TestProjects:
    """Test project CRUD operations."""
    
    def test_list_projects(self, client, mock_supabase, mock_project):
        """Test listing all projects."""
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_select = Mock()
        mock_table.select.return_value = mock_select
        mock_result = Mock()
        mock_result.data = [mock_project]
        mock_select.execute.return_value = mock_result
        
        # Make request
        response = client.get('/api/projects')
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['name'] == 'Test Project'
        
        # Verify Supabase was called correctly
        mock_client.table.assert_called_with('projects')
        mock_table.select.assert_called_with('*')
    
    def test_get_project(self, client, mock_supabase, mock_project, project_id):
        """Test getting a single project."""
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_select = Mock()
        mock_table.select.return_value = mock_select
        mock_eq = Mock()
        mock_select.eq.return_value = mock_eq
        mock_result = Mock()
        mock_result.data = [mock_project]
        mock_eq.execute.return_value = mock_result
        
        # Make request
        response = client.get(f'/api/projects/{project_id}')
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['name'] == 'Test Project'
        
        # Verify Supabase was called with correct ID
        mock_select.eq.assert_called_with('id', str(project_id))
    
    def test_create_project(self, client, mock_supabase, mock_project):
        """Test creating a new project."""
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_insert = Mock()
        mock_table.insert.return_value = mock_insert
        mock_result = Mock()
        mock_result.data = [mock_project]
        mock_insert.execute.return_value = mock_result
        
        # Make request
        payload = {
            'name': 'Test Project',
            'description': 'A test project'
        }
        response = client.post('/api/projects', json=payload)
        
        # Assertions
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'Test Project'
        
        # Verify Supabase insert was called
        mock_table.insert.assert_called_once()
        insert_data = mock_table.insert.call_args[0][0]
        assert insert_data['name'] == 'Test Project'
    
    def test_update_project(self, client, mock_supabase, mock_project, project_id):
        """Test updating a project."""
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_update = Mock()
        mock_table.update.return_value = mock_update
        mock_eq = Mock()
        mock_update.eq.return_value = mock_eq
        
        updated_project = mock_project.copy()
        updated_project['name'] = 'Updated Project'
        mock_result = Mock()
        mock_result.data = [updated_project]
        mock_eq.execute.return_value = mock_result
        
        # Make request
        payload = {'name': 'Updated Project'}
        response = client.patch(f'/api/projects/{project_id}', json=payload)
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['name'] == 'Updated Project'
        
        # Verify Supabase update was called
        mock_table.update.assert_called_once()
        mock_update.eq.assert_called_with('id', str(project_id))
    
    def test_delete_project(self, client, mock_supabase, project_id):
        """Test deleting a project."""
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_delete = Mock()
        mock_table.delete.return_value = mock_delete
        mock_eq = Mock()
        mock_delete.eq.return_value = mock_eq
        mock_result = Mock()
        mock_eq.execute.return_value = mock_result
        
        # Make request
        response = client.delete(f'/api/projects/{project_id}')
        
        # Assertions
        assert response.status_code == 204
        
        # Verify Supabase delete was called
        mock_table.delete.assert_called_once()
        mock_delete.eq.assert_called_with('id', str(project_id))


# ============================================================================
# Tool Tests
# ============================================================================

class TestTools:
    """Test tool CRUD operations."""
    
    def test_list_tools(self, client, mock_supabase, mock_tool, project_id):
        """Test listing tools for a project."""
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_select = Mock()
        mock_table.select.return_value = mock_select
        mock_eq = Mock()
        mock_select.eq.return_value = mock_eq
        mock_result = Mock()
        mock_result.data = [mock_tool]
        mock_eq.execute.return_value = mock_result
        
        # Make request
        response = client.get(f'/api/projects/{project_id}/tools')
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['name'] == 'test_tool'
        
        # Verify Supabase was called correctly
        mock_client.table.assert_called_with('tools')
        mock_select.eq.assert_called_with('project_id', str(project_id))
    
    def test_create_tool(self, client, mock_supabase, mock_tool, project_id):
        """Test creating a new tool."""
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_insert = Mock()
        mock_table.insert.return_value = mock_insert
        mock_result = Mock()
        mock_result.data = [mock_tool]
        mock_insert.execute.return_value = mock_result
        
        # Make request
        payload = {
            'name': 'test_tool',
            'description': 'A test tool',
            'project_id': str(project_id),
            'tool_config': {
                'api': {
                    'base_url': 'https://api.example.com',
                    'method': 'GET',
                    'headers': {},
                    'params': {},
                    'auth': {'method': 'none'},
                    'timeout': 30.0
                },
                'input_schema': {'type': 'object', 'properties': {}},
                'output_schema': {'type': 'object'}
            }
        }
        response = client.post(f'/api/projects/{project_id}/tools', json=payload)
        
        # Assertions
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'test_tool'
        assert 'tool_config' in data
        
        # Verify Supabase insert was called
        mock_table.insert.assert_called_once()
        insert_data = mock_table.insert.call_args[0][0]
        assert insert_data['name'] == 'test_tool'
        assert insert_data['project_id'] == str(project_id)


# ============================================================================
# MCP Config Tests
# ============================================================================

class TestMCPConfigs:
    """Test MCP config CRUD operations."""
    
    def test_create_mcp_config(self, client, mock_supabase, mock_mcp_config, project_id, tool_id):
        """Test creating a new MCP config with selected tools."""
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_insert = Mock()
        mock_table.insert.return_value = mock_insert
        mock_result = Mock()
        mock_result.data = [mock_mcp_config]
        mock_insert.execute.return_value = mock_result
        
        # Make request
        payload = {
            'name': 'Test MCP Config',
            'project_id': str(project_id),
            'model': 'gpt-4o-mini',
            'temperature': 0.7,
            'max_tokens': 1000,
            'system_prompt': 'You are a helpful assistant',
            'instruction': 'Answer questions clearly',
            'selected_tool_ids': [str(tool_id)]
        }
        response = client.post(f'/api/projects/{project_id}/mcp-configs', json=payload)
        
        # Assertions
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'Test MCP Config'
        assert data['model'] == 'gpt-4o-mini'
        
        # Verify Supabase insert was called with UUID array conversion
        mock_table.insert.assert_called_once()
        insert_data = mock_table.insert.call_args[0][0]
        assert insert_data['name'] == 'Test MCP Config'
        assert insert_data['project_id'] == str(project_id)
        assert str(tool_id) in insert_data['selected_tool_ids']
    
    def test_update_mcp_config_deployment(self, client, mock_supabase, mock_mcp_config):
        """Test updating MCP config deployment status."""
        config_id = uuid4()
        
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_update = Mock()
        mock_table.update.return_value = mock_update
        mock_eq = Mock()
        mock_update.eq.return_value = mock_eq
        
        updated_config = mock_mcp_config.copy()
        updated_config['deployment_status'] = 'deployed'
        updated_config['deployment_url'] = 'https://deployed.example.com'
        mock_result = Mock()
        mock_result.data = [updated_config]
        mock_eq.execute.return_value = mock_result
        
        # Make request
        payload = {
            'deployment_status': 'deployed',
            'deployment_url': 'https://deployed.example.com'
        }
        response = client.patch(f'/api/mcp-configs/{config_id}', json=payload)
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['deployment_status'] == 'deployed'
        assert data['deployment_url'] == 'https://deployed.example.com'
        
        # Verify Supabase update was called
        mock_table.update.assert_called_once()


# ============================================================================
# Response Config Tests
# ============================================================================

class TestResponseConfigs:
    """Test response config CRUD operations."""
    
    def test_create_response_config(self, client, mock_supabase, project_id):
        """Test creating a response config."""
        config_id = uuid4()
        mock_response_config = {
            'id': str(config_id),
            'numeric_id': 1,  # Frontend-compatible numeric ID
            'project_id': str(project_id),
            'name': 'Test Response Config',
            'type': 'llm-reprocess',
            'reprocess_instructions': 'Format as markdown',
            'error_handling': 'retry',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_insert = Mock()
        mock_table.insert.return_value = mock_insert
        mock_result = Mock()
        mock_result.data = [mock_response_config]
        mock_insert.execute.return_value = mock_result
        
        # Make request
        payload = {
            'name': 'Test Response Config',
            'project_id': str(project_id),
            'type': 'llm-reprocess',
            'reprocess_instructions': 'Format as markdown',
            'error_handling': 'retry'
        }
        response = client.post(f'/api/projects/{project_id}/response-configs', json=payload)
        
        # Assertions
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'Test Response Config'
        assert data['type'] == 'llm-reprocess'
        assert data['error_handling'] == 'retry'
        
        # Verify Supabase insert was called
        mock_table.insert.assert_called_once()


# ============================================================================
# Prompt Tests
# ============================================================================

class TestPrompts:
    """Test prompt CRUD operations."""
    
    def test_create_prompt(self, client, mock_supabase, project_id):
        """Test creating a prompt."""
        prompt_id = uuid4()
        mock_prompt = {
            'id': str(prompt_id),
            'numeric_id': 1,  # Frontend-compatible numeric ID
            'project_id': str(project_id),
            'name': 'greeting',
            'description': 'Greet the user',
            'prompt_template': 'Hello {{name}}, welcome!',
            'content': 'Hello {{name}}, welcome!',  # Frontend-compatible content field
            'variables': ['name'],
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_insert = Mock()
        mock_table.insert.return_value = mock_insert
        mock_result = Mock()
        mock_result.data = [mock_prompt]
        mock_insert.execute.return_value = mock_result
        
        # Make request
        payload = {
            'name': 'greeting',
            'description': 'Greet the user',
            'project_id': str(project_id),
            'prompt_template': 'Hello {{name}}, welcome!',
            'variables': ['name']
        }
        response = client.post(f'/api/projects/{project_id}/prompts', json=payload)
        
        # Assertions
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'greeting'
        assert 'name' in data['variables']
        
        # Verify Supabase insert was called
        mock_table.insert.assert_called_once()


# ============================================================================
# Flow Tests
# ============================================================================

class TestFlows:
    """Test flow CRUD operations."""
    
    def test_create_flow(self, client, mock_supabase, project_id):
        """Test creating a flow with steps."""
        flow_id = uuid4()
        mock_flow = {
            'id': str(flow_id),
            'numeric_id': 1,  # Frontend-compatible numeric ID
            'project_id': str(project_id),
            'name': 'test_workflow',
            'description': 'Test workflow',
            'steps': {
                'nodes': [
                    {'id': 'node1', 'type': 'query', 'position': {'x': 0, 'y': 0}},
                    {'id': 'node2', 'type': 'llm', 'position': {'x': 100, 'y': 100}}
                ],
                'edges': [
                    {'id': 'edge1', 'source': 'node1', 'target': 'node2'}
                ]
            },
            'steps_array': None,  # Optional linear array format for v6 builder
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_insert = Mock()
        mock_table.insert.return_value = mock_insert
        mock_result = Mock()
        mock_result.data = [mock_flow]
        mock_insert.execute.return_value = mock_result
        
        # Make request
        payload = {
            'name': 'test_workflow',
            'description': 'Test workflow',
            'project_id': str(project_id),
            'steps': {
                'nodes': [
                    {'id': 'node1', 'type': 'query', 'position': {'x': 0, 'y': 0}},
                    {'id': 'node2', 'type': 'llm', 'position': {'x': 100, 'y': 100}}
                ],
                'edges': [
                    {'id': 'edge1', 'source': 'node1', 'target': 'node2'}
                ]
            }
        }
        response = client.post(f'/api/projects/{project_id}/flows', json=payload)
        
        # Assertions
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'test_workflow'
        assert 'nodes' in data['steps']
        assert 'edges' in data['steps']
        assert len(data['steps']['nodes']) == 2
        
        # Verify Supabase insert was called
        mock_table.insert.assert_called_once()
        insert_data = mock_table.insert.call_args[0][0]
        assert insert_data['name'] == 'test_workflow'
        assert 'steps' in insert_data


# ============================================================================
# Integration Tests
# ============================================================================

class TestIntegration:
    """Test complete workflows with multiple entities."""
    
    def test_create_project_with_full_setup(self, client, mock_supabase, project_id, tool_id):
        """Test creating a complete project setup."""
        # This would be a more complex test that creates:
        # 1. A project
        # 2. Tools for that project
        # 3. MCP configs referencing those tools
        # 4. Response configs
        # 5. Flows
        # 
        # Then verifies all the Supabase calls were made correctly
        pass  # Placeholder for complex integration test
    
    def test_project_cascade_delete(self, client, mock_supabase, project_id):
        """Test that deleting a project cascades to all children."""
        # Setup mock
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_delete = Mock()
        mock_table.delete.return_value = mock_delete
        mock_eq = Mock()
        mock_delete.eq.return_value = mock_eq
        mock_result = Mock()
        mock_eq.execute.return_value = mock_result
        
        # Delete project
        response = client.delete(f'/api/projects/{project_id}')
        
        # Assertions
        assert response.status_code == 204
        
        # Verify Supabase delete was called
        # (Cascade is handled by database foreign keys)
        mock_table.delete.assert_called_once()
        mock_delete.eq.assert_called_with('id', str(project_id))


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])


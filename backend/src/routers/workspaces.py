from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from src.services.storage import create_workspace, list_workspaces, get_workspace, delete_workspace

router = APIRouter(tags=["workspaces"])


class CreateWorkspaceRequest(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        if len(v) > 200:
            raise ValueError("name must be 200 characters or fewer")
        return v


@router.post("/workspaces", status_code=201)
async def create_workspace_endpoint(body: CreateWorkspaceRequest):
    workspace = create_workspace(body.name)
    return workspace


@router.get("/workspaces")
async def list_workspaces_endpoint():
    return {"workspaces": list_workspaces()}


@router.delete("/workspaces/{ws_id}", status_code=204)
async def delete_workspace_endpoint(ws_id: str):
    if not get_workspace(ws_id):
        raise HTTPException(status_code=404, detail="Workspace not found")
    delete_workspace(ws_id)

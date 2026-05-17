from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.db.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserProfile
from app.schemas.common import MessageResponse
from app.services.auth import authenticate_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.username, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    token = create_access_token(str(user.id), {"role": user.role})
    return TokenResponse(access_token=token)


@router.post("/logout", response_model=MessageResponse)
def logout():
    return MessageResponse(message="Client should discard the token on logout")


@router.get("/me", response_model=UserProfile)
def me(current_user=Depends(get_current_user)):
    return current_user

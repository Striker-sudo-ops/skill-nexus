"""
Bidirectional inbox messaging between Employers and Students.
Employers can contact students; students can reply.
Both parties have an inbox showing conversations.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.db.session import SessionLocal
from app.models.entities import Message, User, Student, Employer
from app.api.v1.auth import get_current_user

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class SendMessageReq(BaseModel):
    recipient_user_id: int
    subject: str
    body: str
    parent_id: Optional[int] = None


def _serialize_message(msg: Message, db: Session) -> dict:
    sender = db.query(User).filter(User.id == msg.sender_user_id).first()
    recipient = db.query(User).filter(User.id == msg.recipient_user_id).first()

    sender_name = sender.email if sender else "Unknown"
    recipient_name = recipient.email if recipient else "Unknown"

    # Try to get display names
    if sender:
        if sender.role == 'STUDENT':
            s = db.query(Student).filter(Student.user_id == sender.id).first()
            if s:
                sender_name = s.full_name or sender.email
        elif sender.role in ('EMPLOYER',):
            e = db.query(Employer).filter(Employer.user_id == sender.id).first()
            if e:
                sender_name = e.company_name or sender.email

    if recipient:
        if recipient.role == 'STUDENT':
            s = db.query(Student).filter(Student.user_id == recipient.id).first()
            if s:
                recipient_name = s.full_name or recipient.email
        elif recipient.role in ('EMPLOYER',):
            e = db.query(Employer).filter(Employer.user_id == recipient.id).first()
            if e:
                recipient_name = e.company_name or recipient.email

    return {
        "id": msg.id,
        "sender_user_id": msg.sender_user_id,
        "recipient_user_id": msg.recipient_user_id,
        "sender_name": sender_name,
        "sender_role": sender.role if sender else None,
        "recipient_name": recipient_name,
        "subject": msg.subject,
        "body": msg.body,
        "is_read": msg.is_read,
        "parent_id": msg.parent_id,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


@router.post("/messages/send")
def send_message(req: SendMessageReq, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Send a message to another user (employer → student or student → employer)."""
    recipient = db.query(User).filter(User.id == req.recipient_user_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    # Validate threading: parent must exist and involve both parties
    if req.parent_id:
        parent = db.query(Message).filter(Message.id == req.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent message not found")

    msg = Message(
        sender_user_id=current_user.id,
        recipient_user_id=req.recipient_user_id,
        subject=req.subject,
        body=req.body,
        parent_id=req.parent_id,
        created_at=datetime.utcnow(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _serialize_message(msg, db)


@router.get("/messages/inbox")
def get_inbox(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all messages received by the current user (sorted newest first)."""
    msgs = db.query(Message).filter(
        Message.recipient_user_id == current_user.id
    ).order_by(Message.created_at.desc()).all()
    return [_serialize_message(m, db) for m in msgs]


@router.get("/messages/sent")
def get_sent(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all messages sent by the current user."""
    msgs = db.query(Message).filter(
        Message.sender_user_id == current_user.id
    ).order_by(Message.created_at.desc()).all()
    return [_serialize_message(m, db) for m in msgs]


@router.get("/messages/conversation/{other_user_id}")
def get_conversation(other_user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get full thread between current user and another user."""
    msgs = db.query(Message).filter(
        ((Message.sender_user_id == current_user.id) & (Message.recipient_user_id == other_user_id)) |
        ((Message.sender_user_id == other_user_id) & (Message.recipient_user_id == current_user.id))
    ).order_by(Message.created_at.asc()).all()
    return [_serialize_message(m, db) for m in msgs]


@router.put("/messages/{message_id}/read")
def mark_read(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Mark a message as read (only recipient can mark)."""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.recipient_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    msg.is_read = True
    db.commit()
    return {"success": True}


@router.get("/messages/unread-count")
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get count of unread messages for the current user."""
    count = db.query(Message).filter(
        Message.recipient_user_id == current_user.id,
        Message.is_read == False
    ).count()
    return {"unread_count": count}


@router.get("/messages/contacts")
def get_contacts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get list of unique users the current user has exchanged messages with."""
    sent = db.query(Message.recipient_user_id).filter(Message.sender_user_id == current_user.id).distinct().all()
    received = db.query(Message.sender_user_id).filter(Message.recipient_user_id == current_user.id).distinct().all()

    contact_ids = set([r[0] for r in sent] + [r[0] for r in received])
    contacts = []
    for uid in contact_ids:
        u = db.query(User).filter(User.id == uid).first()
        if not u:
            continue
        name = u.email
        if u.role == 'STUDENT':
            s = db.query(Student).filter(Student.user_id == u.id).first()
            if s:
                name = s.full_name or u.email
        elif u.role == 'EMPLOYER':
            e = db.query(Employer).filter(Employer.user_id == u.id).first()
            if e:
                name = e.company_name or u.email

        unread = db.query(Message).filter(
            Message.sender_user_id == uid,
            Message.recipient_user_id == current_user.id,
            Message.is_read == False
        ).count()

        # Latest message timestamp
        latest = db.query(Message).filter(
            ((Message.sender_user_id == current_user.id) & (Message.recipient_user_id == uid)) |
            ((Message.sender_user_id == uid) & (Message.recipient_user_id == current_user.id))
        ).order_by(Message.created_at.desc()).first()

        contacts.append({
            "user_id": u.id,
            "name": name,
            "role": u.role,
            "email": u.email,
            "unread_count": unread,
            "last_message_at": latest.created_at.isoformat() if latest and latest.created_at else None,
        })

    contacts.sort(key=lambda c: c['last_message_at'] or '', reverse=True)
    return contacts

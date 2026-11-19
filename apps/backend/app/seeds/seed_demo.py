from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.enums.user_role import UserRole
from app.models.user import User

DEMO_USERS = [
    {
        "name": "Inspector de Campo (Demo)",
        "email": "inspector@atajaderos.ar",
        "role": UserRole.INSPECTOR.value,
        "password": "password",
    },
    {
        "name": "Referente de Mesa (Demo)",
        "email": "referente@atajaderos.ar",
        "role": UserRole.REFERENTE_MESA.value,
        "password": "password",
    },
]


def seed_demo_users(db: Session) -> list[User]:
    seeded: list[User] = []
    for item in DEMO_USERS:
        existing = db.scalar(select(User).where(User.email == item["email"]))
        if existing is None:
            user = User(
                name=item["name"],
                email=item["email"],
                role=item["role"],
                hashed_password=hash_password(item["password"]),
            )
            db.add(user)
            seeded.append(user)
        else:
            existing.name = item["name"]
            existing.role = item["role"]
            existing.hashed_password = hash_password(item["password"])
            seeded.append(existing)
    db.commit()
    for user in seeded:
        db.refresh(user)
    return seeded


def main() -> None:
    db = SessionLocal()
    try:
        users = seed_demo_users(db)
        print(f"Seed completado (DATO DE PRUEBA): {len(users)} usuarios demo disponibles.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

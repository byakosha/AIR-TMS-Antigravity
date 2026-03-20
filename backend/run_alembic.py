import sys
import alembic.config

if __name__ == "__main__":
    alembic.config.main(argv=["revision", "--autogenerate", "-m", "rules_v2"])

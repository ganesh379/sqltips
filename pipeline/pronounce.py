"""Make English voiceover text easy for Sarvam TTS to say the way a PostgreSQL DBA says it.

Only the text sent to the voice changes; captions and episode.json keep the real spelling.
Rules were picked by round-trip tests (Sarvam TTS -> Sarvam speech-to-text, verbatim mode):
  raw "psql" was heard as "E Sukal", "DBA" as "Dabba", "WAL" as "Bhal",
  "pg_hba.conf" was read with the word "underscore", "PostgreSQL" sometimes as "Posgre sequel".
Letters joined by hyphens ("P-S-Q-L") are spelled out reliably.
Official pronunciation of PostgreSQL: "Post-Gres-Q-L" (PostgreSQL wiki FAQ).

Usage: from pronounce import speakable; speakable("Run psql as the DBA")
Test:  python3 pronounce.py "Edit pg_hba.conf, then run psql"
"""
import re
import sys

# Whole words, matched case-sensitively unless listed in CASELESS. Order does not matter:
# longer keys are tried first.
WORDS = {
    # product and tools
    "PostgreSQL": "Postgres-Q-L", "Postgresql": "Postgres-Q-L", "postgresql": "Postgres-Q-L",
    "POSTGRESQL": "Postgres-Q-L",
    "psql": "P-S-Q-L", "PSQL": "P-S-Q-L", "appdb": "app D-B",
    "pg": "P-G", "PG": "P-G",
    "pgBouncer": "P-G Bouncer", "PgBouncer": "P-G Bouncer", "pgbouncer": "P-G Bouncer",
    "pgAdmin": "P-G Admin", "pgadmin": "P-G Admin",
    "pgBackRest": "P-G Back Rest", "pgbackrest": "P-G Back Rest",
    "pgpool": "P-G Pool", "Pgpool": "P-G Pool", "pgbench": "P-G bench",
    "initdb": "init D-B", "createdb": "create D-B", "dropdb": "drop D-B",
    "createuser": "create user", "vacuumdb": "vacuum D-B", "reindexdb": "reindex D-B",
    "pg_ctl": "P-G control", "pg_ctlcluster": "P-G control cluster",
    "fsync": "F-sync", "systemctl": "system control", "sudo": "soo-doo",
    "etcd": "E-T-C-D",
    # acronyms
    "SQL": "S-Q-L", "DBA": "D-B-A", "DBAs": "D-B-As", "DBMS": "D-B-M-S", "RDBMS": "R-D-B-M-S",
    "WAL": "wall", "wal": "wall", "MVCC": "M-V-C-C", "XID": "X-I-D", "XIDs": "X-I-Ds",
    "LSN": "L-S-N", "OID": "O-I-D", "OIDs": "O-I-Ds", "CTE": "C-T-E", "CTEs": "C-T-Es",
    "OLTP": "O-L-T-P", "OLAP": "O-lap", "ACID": "acid", "DDL": "D-D-L", "DML": "D-M-L",
    "DCL": "D-C-L", "TCL": "T-C-L", "PITR": "P-I-T-R", "RPO": "R-P-O", "RTO": "R-T-O",
    "HA": "H-A", "TPS": "T-P-S", "QPS": "Q-P-S", "CPU": "C-P-U", "CPUs": "C-P-Us",
    "SSD": "S-S-D", "HDD": "H-D-D", "OS": "O-S", "ID": "I-D", "IDs": "I-Ds",
    "UUID": "U-U-I-D", "JSON": "jay-son", "JSONB": "jay-son B", "jsonb": "jay-son B",
    "GiST": "gist", "GIST": "gist", "SP-GiST": "S-P gist", "BRIN": "brin", "GIN": "gin",
    "TOAST": "toast", "HOT": "hot", "SSL": "S-S-L", "TLS": "T-L-S", "TCP": "T-C-P",
    "IP": "I-P", "VM": "V-M", "AWS": "A-W-S", "RDS": "R-D-S", "API": "A-P-I",
    "ERP": "E-R-P", "UI": "U-I", "I/O": "I-O", "IO": "I-O", "LRU": "L-R-U",
    "SCRAM": "scram", "MD5": "M-D-5", "md5": "M-D-5", "RLS": "R-L-S",
    "hba": "H-B-A", "HBA": "H-B-A", "ctl": "control", "conf": "conf", "mem": "mem",
    "stat": "stat", "xact": "transaction", "lsn": "L-S-N", "xid": "X-I-D", "oid": "O-I-D",
    "autovacuum": "auto vacuum", "basebackup": "base backup", "isready": "is ready",
    "waldump": "wall dump", "receivewal": "receive wall", "dumpall": "dump all",
    "statio": "stat I-O", "repack": "re-pack",
    "walsender": "wall sender", "walreceiver": "wall receiver", "walwriter": "wall writer",
    # extensions, tools and related products
    "pgvector": "P-G vector", "pgaudit": "P-G audit", "pglogical": "P-G logical",
    "pgBadger": "P-G Badger", "pgbadger": "P-G Badger", "PostGIS": "Post-G-I-S",
    "TimescaleDB": "Timescale D-B", "CloudNativePG": "Cloud Native P-G", "pgcrypto": "P-G crypto",
    "PL/pgSQL": "P-L P-G S-Q-L", "plpgsql": "P-L P-G S-Q-L", "PL/SQL": "P-L S-Q-L",
    "MySQL": "My-S-Q-L", "NoSQL": "No-S-Q-L", "SQLite": "S-Q-Lite", "pg_stat": "P-G stat",
    "IVFFlat": "I-V-F flat", "HNSW": "H-N-S-W", "GUC": "G-U-C", "GUCs": "G-U-Cs",
    # infrastructure acronyms
    "IOPS": "I-ops", "OOM": "O-O-M", "NVMe": "N-V-M-E", "RAID": "raid", "NUMA": "noo-ma",
    "EBS": "E-B-S", "S3": "S-3", "GCP": "G-C-P", "VPC": "V-P-C", "DNS": "D-N-S", "TTL": "T-T-L",
    "ETL": "E-T-L", "ORM": "O-R-M", "SLA": "S-L-A", "SLAs": "S-L-As", "DR": "D-R", "BI": "B-I",
    "LDAP": "L-D-A-P", "CIDR": "cider", "SSH": "S-S-H", "CI": "C-I", "CD": "C-D",
    "K8s": "Kubernetes", "YAML": "yamel", "CSV": "C-S-V", "PDF": "P-D-F", "URL": "U-R-L",
    "LTS": "L-T-S", "EOL": "E-O-L", "CVE": "C-V-E", "CVEs": "C-V-Es", "FK": "foreign key",
    "PK": "primary key", "SQLSTATE": "S-Q-L state", "XLOG": "X-log", "WALs": "walls",
    "pgdata": "P-G data", "PGDATA": "P-G data", "PGHOST": "P-G host", "PGPORT": "P-G port",
    "PGUSER": "P-G user", "PGPASSWORD": "P-G password",
    # sizes (write "8 MB", not "8MB")
    "kB": "kilobytes", "KB": "kilobytes", "MB": "megabytes", "GB": "gigabytes", "TB": "terabytes",
    "ms": "milliseconds",
}

# Words read aloud as words even when typed in capitals (SQL keywords are fine as words,
# but some all-caps tokens get spelled letter by letter, so lower-case them for the voice).
SPOKEN_CAPS = {"VACUUM", "ANALYZE", "EXPLAIN", "SELECT", "INSERT", "UPDATE", "DELETE",
               "TRUNCATE", "ROLLBACK", "COMMIT", "BEGIN", "CREATE", "DROP", "ALTER", "GRANT",
               "REVOKE", "INDEX", "TABLE", "WHERE", "JOIN", "NULL", "CHECKPOINT", "REINDEX",
               "CLUSTER", "COPY", "LOCK", "SAVEPOINT", "RETURNING", "COUNT", "DISTINCT",
               "FREEZE", "VERBOSE", "FULL", "CONCURRENTLY", "SHOW", "SET", "RESET", "FROM",
               # EXPLAIN options and other keywords and type names
               "BUFFERS", "COSTS", "TIMING", "FORMAT", "SETTINGS", "SUMMARY", "PRIMARY", "KEY",
               "FOREIGN", "UNIQUE", "VIEW", "SCHEMA", "ROLE", "USER", "DATABASE", "TRIGGER",
               "FUNCTION", "PROCEDURE", "SEQUENCE", "VALUES", "INTO", "ORDER", "GROUP", "HAVING",
               "LIMIT", "OFFSET", "AND", "NOT", "EXISTS", "BETWEEN", "LIKE", "ILIKE", "CASCADE",
               "RESTRICT", "DEFAULT", "CHECK", "CONSTRAINT", "PARTITION", "REFRESH", "MATERIALIZED",
               "LISTEN", "NOTIFY", "PREPARE", "EXECUTE", "DISCARD", "CONFLICT", "NOTHING", "WITH",
               "RECURSIVE", "UNION", "ALL", "CASE", "WHEN", "THEN", "ELSE", "END", "SERIALIZABLE",
               "REPEATABLE", "READ", "COMMITTED", "UNCOMMITTED", "ISOLATION", "LEVEL", "TRANSACTION",
               "ABORT", "START", "OWNER", "SUPERUSER", "LOGIN", "PASSWORD", "REPLICATION",
               "PUBLICATION", "SUBSCRIPTION", "TABLESPACE", "EXTENSION", "TRUE", "FALSE", "INTEGER",
               "TEXT", "VARCHAR", "BOOLEAN", "BIGINT", "SERIAL", "TIMESTAMP", "TIMESTAMPTZ", "DATE",
               "NUMERIC", "ARRAY", "IDENTITY", "GENERATED", "ALWAYS", "CONNECTION", "OUTER", "INNER",
               "LEFT", "RIGHT", "CROSS", "LATERAL", "ONLY", "WINDOW", "OVER", "FILTER", "USING",
               "VACUUMDB", "REASSIGN", "OWNED", "SECURITY", "POLICY", "ENABLE", "DISABLE", "RULE",
               "DECLARE", "CURSOR", "FETCH", "CALL", "DO", "ON", "OR", "IN", "AS", "BY", "IS", "TO",
               "OF", "IF", "AT", "NO", "UP"}

_KEYS = sorted(WORDS, key=len, reverse=True)
_WORD_RE = re.compile(r"(?<![\w-])(" + "|".join(re.escape(k) for k in _KEYS) + r")(?![\w-])")


def _identifier(m):
    """pg_stat_activity -> 'P-G stat activity', postgresql.conf -> 'Postgres-Q-L dot conf'."""
    tok = m.group(0)
    parts = re.split(r"([_.])", tok)
    out = []
    for p in parts:
        if p == "_":
            continue
        if p == ".":
            out.append("dot")
        elif p:
            out.append(WORDS.get(p, p))
    return " ".join(out)


def speakable(text: str) -> str:
    # identifiers with underscores or file-style dots (pg_hba.conf, shared_buffers, postgresql.conf)
    text = re.sub(r"\b[A-Za-z][A-Za-z0-9]*(?:[_.][A-Za-z0-9]+)+\b(?<!\.\d)",
                  lambda m: _identifier(m) if ("_" in m.group(0) or re.search(r"\.[a-z]{2,5}$", m.group(0))) else m.group(0),
                  text)
    text = text.replace("(*)", " star")
    # brackets made the voice stop mid-sentence ("EXPLAIN (ANALYZE, BUFFERS) first" ended after
    # "analyze"), so speak them as short pauses
    text = re.sub(r"\s*\(\s*([^()]*?)\s*\)", r", \1,", text)
    text = re.sub(r",\s*([,.;:!?])", r"\1", text)
    text = re.sub(r"\bFollow so\b", "Follow, so", text)  # heard as "fall so" without the pause
    text = _WORD_RE.sub(lambda m: WORDS[m.group(1)], text)
    text = re.sub(r"\b(\d+)(kB|KB|MB|GB|TB|ms)\b", r"\1 \2", text)  # 8MB -> 8 MB -> 8 megabytes
    text = _WORD_RE.sub(lambda m: WORDS[m.group(1)], text)
    text = re.sub(r"\b[A-Z]{2,}\b", lambda m: m.group(0).lower() if m.group(0) in SPOKEN_CAPS else m.group(0), text)
    return re.sub(r"\s{2,}", " ", text).strip()


if __name__ == "__main__":
    for arg in sys.argv[1:] or [sys.stdin.read()]:
        print(speakable(arg))

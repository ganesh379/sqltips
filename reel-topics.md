# Reel topics (in order)

The nightly task takes the FIRST unchecked topic in each queue, then marks it `[x]` with the date and slot.
Reels own: traps, "why does this happen" concepts and internals. Carousels (post-topics.md) own syntax how-tos and monitoring queries. Never use a topic that appears in post-topics.md or posted.md.
Every hook must be checked against the official Oracle or PostgreSQL documentation and rewritten if it is not exactly true.
When a queue has fewer than 5 unchecked topics, add new ones that follow the same rules.

## 1:00 PM queue: Oracle SQL & PL/SQL
- [x] NOT IN with a NULL returns 0 rows: "This query returned zero rows. But the data is there!" (2026-10-31 13:00)
- [ ] Empty string is NULL: "In Oracle, '' = '' is not TRUE."
- [ ] SELECT INTO exceptions: "This SELECT crashed because it found 2 rows."
- [ ] Implicit conversion: "Your index exists. Oracle ignores it because of missing quotes."
- [ ] ORA-14551: "Your function works alone but fails inside a SELECT."
- [ ] Self join: "Find employees who earn more than their manager."
- [ ] Quiz, COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col): "Same table, three COUNTs, three answers."
- [ ] 2nd highest salary: "The classic interview question, 3 ways."
- [x] ROWNUM + ORDER BY (dropped: the ROWNUM vs LIMIT carousel covers it, 2026-10-31)
- [ ] Exception inside a loop: "One bad row stopped your whole loop."
- [ ] UPPER(col) skips the index: "WHERE UPPER(name) = 'RAVI' ignores your index."
- [ ] ORA-00979: "not a GROUP BY expression: what Oracle is telling you."
- [ ] INTERSECT and MINUS: "Find rows in one table but not the other, without a join."
- [ ] Quiz, NULLs in ORDER BY: "Ascending sort: where do the NULLs go?"
- [ ] Delete duplicates with ROWID: "Remove duplicate rows, keep one, using ROWID."
- [ ] ROWNUM = 2: "WHERE ROWNUM = 2 returns nothing. Always."
- [ ] %TYPE and %ROWTYPE: "The column got bigger. Your PL/SQL didn't break."
- [ ] UNION vs UNION ALL: "UNION quietly removes duplicates, and that costs work."
- [ ] ORA-06502: "Why a VARCHAR2(5) variable breaks your code."
- [ ] Cartesian join: "You forgot one join condition. 1,000 x 1,000 = 1,000,000 rows."
- [ ] Quiz, AND vs OR precedence: "Guess which rows this WHERE returns."
- [ ] WHERE vs HAVING: "WHERE filters rows. HAVING filters groups."
- [ ] Alias in WHERE: "Why can't you use your column alias in WHERE?"
- [ ] NULL in an IF: "x is NULL. Your IF went to ELSE."
- [ ] Leading % in LIKE: "LIKE '%son' can't use a normal index range scan."
- [ ] RAISE_APPLICATION_ERROR: "Custom error codes live only between -20000 and -20999."
- [ ] DDL commits for you: "You ran CREATE TABLE. Your pending INSERTs got committed."
- [ ] Quiz, CHAR padding: "LENGTH of 'RAVI' in a CHAR(10) column?"
- [ ] DELETE vs TRUNCATE vs DROP: "Which ones can you roll back in Oracle?"

## 8:00 PM queue: PostgreSQL DBA
- [x] How a SELECT travels inside PostgreSQL: "What happens after you press Enter?" (2026-10-31 20:00)
- [ ] MVCC: "UPDATE never changes your row. It writes a new one."
- [ ] DROP ... CASCADE: "One word, CASCADE, can drop your views too."
- [ ] VACUUM vs VACUUM FULL: "VACUUM FULL freed space and blocked your app."
- [ ] Stale statistics: "You loaded 1 million rows. Now the query is slow."
- [ ] Quiz, TRUNCATE + ROLLBACK: "TRUNCATE, then ROLLBACK. Is the data back?"
- [ ] shared_buffers and OS cache: "Why your data can sit in memory twice."
- [ ] Table bloat: "A 10 GB table holding 1 GB of live data."
- [ ] work_mem: "work_mem = 64MB does not mean 64 MB per query."
- [ ] WAL: "Power cut right after COMMIT. Is your data safe?"
- [ ] Tablespaces: "Put one big table on a different disk."
- [ ] Index not used: "You created the index. PostgreSQL still does a Seq Scan."
- [ ] Quiz, index types: "B-tree, GIN or BRIN: which one for JSONB search?"
- [ ] HOT updates: "Some UPDATEs never touch your indexes. Why?"
- [ ] How a B-tree lookup works: "From 10 million rows to 1 in a few page reads."
- [ ] UPDATE without WHERE: "How a transaction saves you from your worst UPDATE."
- [ ] Streaming replication: "How a standby copies every change from the primary."
- [ ] pg_dump vs pg_basebackup: "Logical vs physical backup: when to use which."
- [ ] Deadlock: "Two transactions wait for each other. PostgreSQL cancels one."
- [ ] Quiz, COUNT(*) speed: "Does PostgreSQL store your table's row count?"
- [ ] Point-in-time recovery: "Restore to 10:42 AM, one minute before the bad DELETE."
- [ ] TOAST: "Where a 1 MB text value really lives."
- [ ] ALTER COLUMN TYPE: "Changing a column type can rewrite the whole table."
- [ ] Inside an 8 KB page: "How PostgreSQL lays out rows on disk."
- [ ] ADD COLUMN with DEFAULT: "Instant since PostgreSQL 11. Here's the catch."
- [ ] Foreign keys need indexes: "PostgreSQL does not index your foreign key columns for you."
- [ ] Quiz, aborted transaction: "One error inside BEGIN. What happens to the next statement?"
- [ ] Partitioning: "When one big table should become many small ones."

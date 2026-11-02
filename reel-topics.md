# Reel topics (in order)

GOAL: reach people who do not follow the page yet. Topics are ordered broadest first: interview questions and everyday SQL mistakes that students, job seekers and developers share with friends, then more specialist DBA topics.
The nightly task takes the FIRST unchecked topic in each queue, then marks it `[x]` with the date and slot. An unchecked "Part 2 of ..." item always goes first.
Reels own: traps, interview questions, "why does this happen" concepts and internals. Carousels (post-topics.md) own syntax how-tos and monitoring queries. Never use a topic that appears in post-topics.md or posted.md.
Every hook must be checked against the official Oracle or PostgreSQL documentation and rewritten if it is not exactly true.
When a queue has fewer than 5 unchecked topics, add new broad-appeal ones that follow the same rules.

## 1:00 PM queue: SQL interview & everyday SQL (Oracle + PostgreSQL)
- [x] NOT IN with a NULL returns 0 rows: "This query returned zero rows. But the data is there!" (2026-10-31 13:00)
- [x] Empty string is NULL: "In Oracle, '' = '' is not TRUE." (2026-11-01 13:00)
- [x] ROWNUM + ORDER BY (dropped: the ROWNUM vs LIMIT carousel covers it, 2026-10-31)
- [x] 2nd highest salary: "Second highest salary? One way fails." (3 ways, ties trap) (2026-11-02 13:00)
- [x] Quiz, COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col): "Same table, three COUNTs, three answers." (2026-11-03 13:00)
- [ ] SQL execution order: "SQL does not run your query top to bottom." (why a column alias fails in WHERE)
- [ ] LEFT JOIN that lost rows: "Your LEFT JOIN quietly became an INNER JOIN." (a WHERE filter on the right table)
- [ ] WHERE vs HAVING: "WHERE filters rows. HAVING filters groups."
- [ ] DELETE vs TRUNCATE vs DROP: "Oracle and PostgreSQL disagree on which one you can roll back."
- [ ] Find duplicate rows: "Find every duplicate in one query with GROUP BY and HAVING."
- [ ] Self join: "Find employees who earn more than their manager."
- [ ] UNION vs UNION ALL: "UNION quietly removes duplicates, and that costs work."
- [ ] Cartesian join: "You forgot one join condition. 1,000 x 1,000 = 1,000,000 rows."
- [ ] Quiz, AND vs OR precedence: "Guess which rows this WHERE returns."
- [ ] Quiz, NULLs in ORDER BY: "Ascending sort: where do the NULLs go?"
- [ ] Implicit conversion: "Your index exists. Oracle ignores it because of missing quotes."
- [ ] UPPER(col) skips the index: "WHERE UPPER(name) = 'RAVI' ignores your index."
- [ ] SELECT INTO exceptions: "This SELECT crashed because it found 2 rows."
- [ ] Exception inside a loop: "One bad row stopped your whole loop."
- [ ] Delete duplicates with ROWID: "Remove duplicate rows, keep one, using ROWID."
- [ ] ROWNUM = 2: "WHERE ROWNUM = 2 returns nothing. Always."
- [ ] NULL in an IF: "x is NULL. Your IF went to ELSE."
- [ ] DDL commits for you: "You ran CREATE TABLE. Your pending INSERTs got committed."
- [ ] Quiz, CHAR padding: "LENGTH of 'RAVI' in a CHAR(10) column?"
- [ ] INTERSECT and MINUS: "Find rows in one table but not the other, without a join."
- [ ] ORA-14551: "Your function works alone but fails inside a SELECT."
- [ ] ORA-00979: "not a GROUP BY expression: what Oracle is telling you."
- [ ] ORA-06502: "Why a VARCHAR2(5) variable breaks your code."
- [ ] %TYPE and %ROWTYPE: "The column got bigger. Your PL/SQL didn't break."
- [ ] Leading % in LIKE: "LIKE '%son' can't use a normal index range scan."
- [ ] RAISE_APPLICATION_ERROR: "Custom error codes live only between -20000 and -20999."
- [x] Alias in WHERE (merged into "SQL execution order")

## 8:00 PM queue: PostgreSQL DBA
- [x] How a SELECT travels inside PostgreSQL: "What happens after you press Enter?" (2026-10-31 20:00)
- [x] MVCC: "UPDATE does not overwrite your row. It writes a new version." (2026-10-30 17:15)
- [x] Part 2 of "How a SELECT travels inside PostgreSQL" (promised in the 2026-10-31 20:00 reel): what happens after you press Enter on an UPDATE and COMMIT, the write path (new row version in shared_buffers, WAL record, WAL flushed at COMMIT, data page written later). Hook: "Your COMMIT returned. Your table file on disk may not have changed yet." Make it work on its own too. (2026-11-01 20:00)
- [x] UPDATE without WHERE: "Your UPDATE just set every salary to zero." (psql autocommit, BEGIN first) (2026-11-02 20:00)
- [ ] Quiz, TRUNCATE + ROLLBACK: "TRUNCATE, then ROLLBACK. Is the data back?"
- [ ] Index not used: "You created the index. PostgreSQL still does a Seq Scan."
- [ ] Deadlock: "Two transactions wait for each other. PostgreSQL cancels one."
- [ ] Quiz, COUNT(*) speed: "Does PostgreSQL store your table's row count?"
- [ ] Point-in-time recovery: "Restore to 10:42 AM, one minute before the bad DELETE."
- [ ] Stale statistics: "You loaded 1 million rows. Now the query is slow."
- [ ] VACUUM vs VACUUM FULL: "VACUUM FULL freed space and blocked your app."
- [ ] Table bloat: "A 10 GB table holding 1 GB of live data."
- [ ] DROP ... CASCADE: "One word, CASCADE, can drop your views too."
- [ ] Quiz, aborted transaction: "One error inside BEGIN. What happens to the next statement?"
- [ ] Foreign keys need indexes: "PostgreSQL does not index your foreign key columns for you."
- [ ] work_mem: "work_mem = 64MB does not mean 64 MB per query."
- [ ] How a B-tree lookup works: "From 10 million rows to 1 in a few page reads."
- [ ] Streaming replication: "How a standby copies every change from the primary."
- [ ] pg_dump vs pg_basebackup: "Logical vs physical backup: when to use which."
- [ ] HOT updates: "Some UPDATEs never touch your indexes. Why?"
- [ ] Quiz, index types: "B-tree, GIN or BRIN: which one for JSONB search?"
- [ ] ALTER COLUMN TYPE: "Changing a column type can rewrite the whole table."
- [ ] ADD COLUMN with DEFAULT: "Instant since PostgreSQL 11. Here's the catch."
- [ ] TOAST: "Where a 1 MB text value really lives."
- [ ] Inside an 8 KB page: "How PostgreSQL lays out rows on disk."
- [ ] Tablespaces: "Put one big table on a different disk."
- [ ] Partitioning: "When one big table should become many small ones."
- [x] WAL after COMMIT (dropped: covered by the 2026-11-01 20:00 Part 2 reel)
- [x] shared_buffers and OS cache (dropped: covered by the 2026-10-31 20:00 SELECT reel)

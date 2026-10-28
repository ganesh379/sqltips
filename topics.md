# @daily_sql_notes topic backlog

The daily task takes the first unchecked topic in a category, then marks it `[x]` with the date and slot.
When a category has fewer than 5 unchecked topics, the task adds new practical ones (prefer features new in the latest Oracle or PostgreSQL release, checked against release notes). Never repeat a checked topic.

## PostgreSQL SQL
- [x] DISTINCT ON for the latest row per group (2026-10-27)
- [ ] INSERT ... ON CONFLICT and EXCLUDED
- [ ] generate_series to fill date gaps in reports
- [ ] Aggregate FILTER clause
- [ ] LATERAL joins for top-N per group
- [ ] RETURNING on INSERT, UPDATE and DELETE
- [ ] JSONB operators and a GIN index
- [ ] Recursive CTEs for hierarchies
- [ ] Window frames: ROWS vs RANGE, running totals
- [ ] MERGE in PostgreSQL (15+)
- [ ] GROUPING SETS, ROLLUP and CUBE
- [ ] string_agg with ORDER BY
- [ ] UNIQUE NULLS NOT DISTINCT (15+)

## Oracle SQL
- [ ] Top-N with FETCH FIRST n ROWS ONLY and WITH TIES
- [ ] MERGE for upserts
- [ ] LISTAGG and ON OVERFLOW TRUNCATE
- [ ] Hierarchical queries with CONNECT BY and LEVEL
- [ ] PIVOT and UNPIVOT
- [ ] LAG and LEAD
- [ ] NVL, NVL2, COALESCE and NULLIF
- [ ] ROW_NUMBER vs RANK vs DENSE_RANK
- [ ] MATCH_RECOGNIZE basics
- [ ] New SQL in Oracle Database 23ai (only features confirmed in Oracle docs)

## Oracle PL/SQL
- [ ] BULK COLLECT with LIMIT and FORALL
- [ ] FORALL with SAVE EXCEPTIONS
- [ ] Exceptions: WHEN OTHERS, SQLERRM, DBMS_UTILITY.FORMAT_ERROR_BACKTRACE
- [ ] Cursor FOR loops vs explicit cursors
- [ ] Collections: associative arrays, nested tables, VARRAYs
- [ ] Packages: spec, body and package state
- [ ] ORA-04091 mutating table and compound triggers
- [ ] Autonomous transactions for error logging
- [ ] EXECUTE IMMEDIATE with bind variables
- [ ] RETURNING INTO and SQL%ROWCOUNT
- [ ] Pipelined table functions

## PL/pgSQL
- [x] Functions vs procedures: CALL and COMMIT (2026-10-29 06:07)
- [ ] RAISE, EXCEPTION blocks and GET STACKED DIAGNOSTICS
- [ ] RETURN QUERY and RETURNS TABLE
- [ ] Trigger functions: NEW, OLD, TG_OP, BEFORE vs AFTER
- [ ] DO blocks for one-off scripts
- [ ] Dynamic SQL with EXECUTE format() and %I / %L
- [ ] FOUND and GET DIAGNOSTICS ROW_COUNT
- [ ] FOR ... IN query loops and FOREACH over arrays
- [ ] SECURITY DEFINER functions and SET search_path
- [ ] ASSERT for sanity checks
- [ ] Cursors in PL/pgSQL

## PostgreSQL DBA
- [ ] Long-running queries in pg_stat_activity, pg_cancel_backend vs pg_terminate_backend
- [ ] Find blocking sessions with pg_blocking_pids()
- [ ] Dead tuples and autovacuum in pg_stat_user_tables
- [ ] Table and index sizes with pg_total_relation_size and pg_size_pretty
- [ ] Unused indexes from pg_stat_user_indexes
- [ ] Top queries with pg_stat_statements
- [ ] Replication lag in pg_stat_replication
- [ ] Checkpoint stats (check which view holds them in each version)
- [ ] CREATE INDEX CONCURRENTLY and its failure mode
- [ ] statement_timeout, lock_timeout and idle_in_transaction_session_timeout
- [ ] Transaction ID age and freezing (age(datfrozenxid))
- [ ] Reading EXPLAIN (ANALYZE, BUFFERS)

## Oracle vs PostgreSQL
- [ ] ROWNUM vs LIMIT / OFFSET and FETCH FIRST (the ROWNUM + ORDER BY trap)
- [ ] Sequences and identity columns
- [ ] Empty string vs NULL
- [ ] What's new in PostgreSQL 19 (only after checking whether 19 is released; GA was planned for 2026-11-19)
- [ ] SYSDATE vs now() and date arithmetic
- [ ] VARCHAR2 vs VARCHAR / TEXT
- [ ] Oracle (+) outer joins vs ANSI joins
- [ ] DECODE vs CASE
- [ ] Data dictionary: USER_TABLES vs information_schema and pg_catalog
- [ ] DUAL and SELECT without FROM

## SQL quiz
- [ ] What NULL = NULL returns; IS NULL and IS NOT DISTINCT FROM
- [ ] COUNT(*) vs COUNT(column)
- [ ] NOT IN with a NULL in the list
- [ ] No ORDER BY means no guaranteed order
- [ ] UNION vs UNION ALL
- [ ] WHERE vs HAVING
- [ ] 5/2 in PostgreSQL vs Oracle
- [ ] DELETE vs TRUNCATE vs DROP
- [ ] Why WHERE upper(name) = ... skips a normal index
- [ ] LEFT JOIN with a WHERE filter on the right table
- [ ] BETWEEN with timestamps

# Mobile Sync Strategy (Draft)

## Goals

Provide offline-first capability for field technicians capturing pond readings, feed events, and mortality records with eventual consistency and conflict resolution.

## Data Classes

1. Immutable append-only (e.g., water quality readings) – last-write-wins only for identical primary key collisions.
2. Mutable aggregate (e.g., fish batch) – versioned via incrementing revision and conflict detection.
3. Reference / lookup (e.g., farms, ponds) – small sets; replaced wholesale via delta snapshots.

## Sync Architecture

Client maintains:

- Local write-ahead log (WAL) of pending mutations.
- Vector clock per aggregate root (fish batch, pond) with {lastServerVersion, localMutations}.
- High watermark timestamp for last successful full sync.

Server endpoints:

- POST /sync/push – accepts batch of mutations (idempotent: client includes clientMutationId UUIDs).
- POST /sync/pull – returns changes since `since` watermark (bounded by pageSize, includes tombstones).
- Conflict semantics: if serverVersion > clientBaseVersion reject with CONFLICT + latest aggregate snapshot.

## Conflict Resolution Patterns

| Scenario | Strategy |
|----------|----------|
| Concurrent edits to mutable aggregate | Reject + return latest; client merges and replays |
| Deletion vs update | Tombstone takes precedence; client discards edit |
| Duplicate water reading (same timestamp ± tolerance) | Accept first; subsequent returns reference to existing id |

## Tombstones

Each deletable entity table gains `deletedAt` nullable timestamp. Sync pull includes records where deletedAt IS NOT NULL as tombstones until client acknowledges receipt (ack vector). Periodic purge after retention window (e.g., 30 days).

## Delta Encoding

For large lists (readings) use incremental pagination with stable sort (createdAt, id). Client stores last tuple and resumes.

## Security & Multi-Tenancy

- All sync endpoints require tenant header and JWT.
- Mutation log tables include tenantId and are prunable per tenant.

## Future Enhancements

- Protobuf or FlatBuffers payload option for bandwidth optimization.
- CRDT (LWW-Element-Set) for certain aggregate types if conflict frequency becomes high.
- Binary Bloom filter summary for quick changed-set estimation.

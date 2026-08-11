import { ASCEND_LOCAL_SCHEMA_VERSION } from "./storageKeys";

export type VersionedLocalRecord<T> = {
  schemaVersion: number;
  data: T;
};

export function migrateVersionedRecord<T>(value: VersionedLocalRecord<T>): VersionedLocalRecord<T> {
  if (value.schemaVersion === ASCEND_LOCAL_SCHEMA_VERSION) return value;
  throw new Error(`No local migration is registered for schema version ${value.schemaVersion}.`);
}

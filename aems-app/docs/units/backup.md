# backup

**State:** unbuilt

## Contract

Scheduled, encrypted database backups and their restore. It guarantees that a backup taken can be
restored. It does not back up volumes other than the database.

## Claims

- On first boot the backup sidecar generates an age keypair into `docker/secrets/backup/`.
- The sidecar takes encrypted Postgres snapshots on a schedule.
- A snapshot restores with the backup-restore scripts into a working database.

## Dependencies

background

## Scenarios

| Name | Proves |
|---|---|
| `backup-keypair-first-boot` | keypair generation |
| `backup-scheduled-encrypted` | scheduled encrypted snapshots |
| `backup-restores` | restore round trip |

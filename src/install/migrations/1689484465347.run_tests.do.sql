--   - migrations.executeTests((start), (end))

--   - migrations.migrateTo(version)
CREATE OR REPLACE FUNCTION migrations.executeMigrationStatement(_version bigint, statement text) RETURNS boolean AS $executeMigrationStatement$
	BEGIN
			execute trim(both ';' from statement);
			update migrations.versions set applied = true where version = _version;
			RETURN true;
	EXCEPTION WHEN OTHERS THEN
		RAISE EXCEPTION 'Migration exception, rolling back. \nStatement: % \nError: %', statement, SQLERRM;
		RETURN false;
	END;
$executeMigrationStatement$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.executeMigration(migration migrations.versions) RETURNS boolean AS $migrateTo$
	DECLARE
    tests_succeeded boolean := false;
	BEGIN
    -- execute up
		PERFORM migrations.executeMigrationStatement(migration.version, trim(both ' \n' from migration.up));
    -- begin test subtransaction
    IF migration.test IS NOT NULL THEN
      RAISE NOTICE ' Testing migration %', migration.name;
      PERFORM migrations.executeMigrationStatement(migration.version, trim(both ' \n' from migration.test));
    END IF;
		RETURN true;
	END;
$migrateTo$ LANGUAGE plpgsql;

--   - trigger for migrating to new version once settled (with exclusive lock!)
CREATE OR REPLACE FUNCTION migrations.auto_migrate() RETURNS trigger AS $auto_migrate$
	BEGIN
		-- exclusive lock
		PERFORM pg_advisory_xact_lock(('x'||substr(md5('migrate'),1,16))::bit(64)::bigint);
		PERFORM migrations.executeMigration(NEW);
		NEW.applied := true;
		RETURN NEW;
	END;
$auto_migrate$ LANGUAGE plpgsql;

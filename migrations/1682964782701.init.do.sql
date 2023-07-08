CREATE SCHEMA migrations;

-- Versions with actual migration code embedded
CREATE TABLE migrations.versions (
	version bigint PRIMARY KEY,
	name text NOT NULL,
	up text NOT NULL,
	down text,
	test text,
	applied boolean NOT NULL DEFAULT false
);

-- Add constraints:
--   - Only new versions can be added, not historic
CREATE FUNCTION migrations.max_version() RETURNS bigint AS $max_version$
	BEGIN
		RETURN COALESCE((SELECT max(version) FROM migrations.versions), 0);
	END;
$max_version$ LANGUAGE plpgsql;

ALTER TABLE migrations.versions ADD CONSTRAINT migration_versions_in_order CHECK (version >= migrations.max_version());

-- Holds MD5 hashes of contents for fast comparison
CREATE TABLE migrations.signatures (
	branch text DEFAULT 'main',
	version bigint NOT NULL REFERENCES migrations.versions (version),
	up text NOT NULL,
	down text,
	test text,
	primary key (branch, version)
);

-- Add trigger for migration insert (plus generate signatures)
CREATE FUNCTION migrations.generate_signatures() RETURNS trigger AS $generate_signatures$
	BEGIN
		INSERT INTO migrations.signatures (version, up, down, test) VALUES (NEW.version, md5(NEW.up), md5(coalesce(NEW.down, '')), md5(coalesce(NEW.test, '')));
		RETURN NEW;
	END;
$generate_signatures$ LANGUAGE plpgsql;

CREATE TRIGGER migrations_generate_signatures AFTER INSERT ON migrations.versions FOR EACH ROW EXECUTE FUNCTION migrations.generate_signatures();

CREATE TYPE migrations.migration_log_action AS ENUM ('install', 'up', 'down', 'start', 'finish', 'test', 'config', 'add', 'remove', 'migrate', 'rollback', 'info', 'debug', 'performance', 'set_env', 'progress', 'statement', 'error');

-- Log of actions
CREATE TABLE migrations.log (
	version bigint REFERENCES migrations.versions (version),
	action migrations.migration_log_action NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb,
	logged_at timestamptz NOT NULL DEFAULT now(),
	output text,
	errors text
);

--   - migrations.log(version, action, (output), (errors))
-- Logger
CREATE FUNCTION migrations.log(_version bigint, _action migrations.migration_log_action) RETURNS void AS $log$
	BEGIN
		INSERT INTO migrations.log (version, action) VALUES (_version, _action);
	END;
$log$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.log(_version bigint, _action migrations.migration_log_action, _metadata jsonb) RETURNS void AS $log$
	BEGIN
		INSERT INTO migrations.log (version, action, metadata) VALUES (_version, _action, _metadata);
	END;
$log$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.log(_version bigint, _action migrations.migration_log_action, _metadata jsonb, _output text) RETURNS void AS $log$
	BEGIN
		INSERT INTO migrations.log (version, action, metadata, output) VALUES (_version, _action, _metadata, _output);
	END;
$log$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.log(_version bigint, _action migrations.migration_log_action, _metadata jsonb, _output text, _errors text) RETURNS void AS $log$
	BEGIN
		INSERT INTO migrations.log (version, action, metadata, output, errors) VALUES (_version, _action, _metadata, _output, _errors);
	END;
$log$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.log(_action migrations.migration_log_action) RETURNS void AS $log$
	BEGIN
		INSERT INTO migrations.log (action) VALUES (_action);
	END;
$log$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.log(_action migrations.migration_log_action, _metadata jsonb) RETURNS void AS $log$
	BEGIN
		INSERT INTO migrations.log (action, metadata) VALUES (_action, _metadata);
	END;
$log$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.log(_action migrations.migration_log_action, _metadata jsonb, _output text) RETURNS void AS $log$
	BEGIN
		INSERT INTO migrations.log (action, metadata, output) VALUES (_action, _metadata, _output);
	END;
$log$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.log(_action migrations.migration_log_action, _metadata jsonb, _output text, _errors text) RETURNS void AS $log$
	BEGIN
		INSERT INTO migrations.log (action, metadata, output, errors) VALUES (_version, _action, _metadata, _output, _errors);
	END;
$log$ LANGUAGE plpgsql;

-- Settings that can be referred-to in migrations
CREATE TABLE migrations.environment (
	key text PRIMARY KEY,
	value jsonb
);

-- Get env var
CREATE FUNCTION migrations.get_env(_key text, default_val jsonb default '{}'::jsonb) RETURNS jsonb AS $get_env$
	BEGIN
		RETURN coalesce((SELECT value FROM migrations.environment WHERE key = _key), default_val);
	END;
$get_env$ LANGUAGE plpgsql;

-- Set env var
CREATE FUNCTION migrations.set_env(_key text, _value jsonb) RETURNS void AS $set_env$
	BEGIN
		INSERT INTO migrations.environment (key, value) VALUES (_key, _value) ON CONFLICT (key) DO UPDATE SET value = _value;
		PERFORM migrations.log(null, 'set_env'::migrations.migration_log_action, json_build_object('key', _key, 'value', _value)::jsonb);
	END;
$set_env$ LANGUAGE plpgsql;

-- Add trigger for migration update
-- Use database variables for options such as requestedVersion - default is max version

-- Functions:

--   - migrations.addVersion(version, name, up, (down), (test))
-- Add a migration
CREATE FUNCTION migrations.addVersion(_version bigint, _name text, _up text, _down text, _test text, _applied boolean) RETURNS void AS $addVersion$
	BEGIN
		INSERT INTO migrations.versions (version, name, up, down, test, applied) VALUES (_version, _name, _up, _down, _test, _applied);
		PERFORM migrations.log(_version, 'add'::migrations.migration_log_action, json_build_object('name', _name)::jsonb);
	END;
$addVersion$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.addVersion(_version bigint, _name text, _up text, _down text, _test text) RETURNS void AS $addVersion$
	BEGIN
		PERFORM migrations.addVersion(_version, _name, _up, _down, _test, false);
	END;
$addVersion$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.addVersion(_version bigint, _name text, _up text, _down text) RETURNS void AS $addVersion$
	BEGIN
		PERFORM migrations.addVersion(_version, _name, _up, _down, '', false);
	END;
$addVersion$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.addVersion(_version bigint, _name text, _up text) RETURNS void AS $addVersion$
	BEGIN
		PERFORM migrations.addVersion(_version, _name, _up, '', '', false);
	END;
$addVersion$ LANGUAGE plpgsql;

--   - migrations.executeTests((start), (end))

--   - migrations.migrateTo(version)
CREATE FUNCTION migrations.executeMigrationStatement(_version bigint, statement text) RETURNS boolean AS $executeMigrationStatement$
	BEGIN
			execute trim(both ';' from statement);
			update migrations.versions set applied = true where version = _version;
			RETURN true;
	EXCEPTION WHEN OTHERS THEN
		RAISE EXCEPTION 'Migration exception, rolling back. \nStatement: % \nError: %', statement, SQLERRM;
		RETURN false;
	END;
$executeMigrationStatement$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.statementError(statement text) RETURNS text AS $statementError$
	BEGIN
			execute format('DO $statementError_internal$ BEGIN RETURN; %s; END; $statementError_internal$;', statement);
			RETURN null;
	EXCEPTION WHEN OTHERS THEN
		RAISE DEBUG 'Invalid statement: %', SQLERRM;
		RETURN SQLERRM;
	END;
$statementError$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.checkStatementSyntax(statement text) RETURNS boolean AS $checkStatementSyntax$
	BEGIN
			execute format('DO $checkStatementSyntax_internal$ BEGIN RETURN; %s; END; $checkStatementSyntax_internal$;', statement);
			RETURN true;
	EXCEPTION WHEN OTHERS THEN
		RAISE DEBUG 'Invalid statement: %', SQLERRM;
		RETURN false;
	END;
$checkStatementSyntax$ LANGUAGE plpgsql;

CREATE FUNCTION migrations.migrateTo(_version bigint) RETURNS boolean AS $migrateTo$
	DECLARE
		_up text;
		_test text;
		raw_single_statement text;
		single_statement text;
		_errors text[];
		_statement_start timestamptz;
		_statement_array text[];
		_statement_number integer;
		_current_error text;
	BEGIN
		PERFORM migrations.log(_version, 'up'::migrations.migration_log_action, json_build_object('version', _version)::jsonb);
		SELECT up INTO _up from migrations.versions where version = _version;
		raw_single_statement := _up;
		single_statement := trim(both ' \n' from raw_single_statement);
		_statement_start := clock_timestamp();
		PERFORM migrations.executeMigrationStatement(_version, single_statement);
		PERFORM migrations.log(_version, 'finish'::migrations.migration_log_action, json_build_object('errors', _errors, 'timing-ms', 1000 * (extract(epoch FROM clock_timestamp() - _statement_start)))::jsonb);
		RETURN true;
	END;
$migrateTo$ LANGUAGE plpgsql;

--   - trigger for migrating to new version once settled (with exclusive lock!)
CREATE FUNCTION migrations.auto_migrate() RETURNS trigger AS $auto_migrate$
	BEGIN
		-- exclusive lock
		PERFORM pg_advisory_xact_lock(('x'||substr(md5('migrate'),1,16))::bit(64)::bigint);
		PERFORM migrations.executeMigrationStatement(NEW.version, NEW.up);
		NEW.applied := true;
		RETURN NEW;
	END;
$auto_migrate$ LANGUAGE plpgsql;

CREATE TRIGGER migrations_auto_migrate BEFORE INSERT ON migrations.versions FOR EACH ROW EXECUTE FUNCTION migrations.auto_migrate();

--   - migrations.rollbackTo(version)

--   - migrations.updateVersion(version, name, up, (down), (test))

--   - migrations.reset()

SELECT * FROM migrations.addVersion(1, 'init', 'select 1');
SELECT * from migrations.log(1, 'install'::migrations.migration_log_action, '"your database will migrate itself. feed it."'::jsonb);

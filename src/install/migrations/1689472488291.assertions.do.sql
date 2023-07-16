CREATE SCHEMA assertions;

CREATE FUNCTION assertions.equal(reported anyelement, expected anyelement, msg text DEFAULT 'Equality Check') RETURNS void AS $Equal$
  BEGIN
    IF reported = expected THEN
      RAISE NOTICE '   ✔ PASS - % - % = %', msg, reported, expected;
      RETURN;
    END IF;
    RAISE NOTICE '   ✘ FAIL - % - % = %', msg, reported, expected;
    RAISE EXCEPTION '% - % = %', msg, reported, expected USING ERRCODE = 'failed_assertion';
  END;
$Equal$ LANGUAGE plpgsql;

CREATE FUNCTION assertions.ne(reported anyelement, expected anyelement, msg text DEFAULT 'Inequality Check') RETURNS void AS $Equal$
  BEGIN
    IF reported != expected THEN
      RAISE NOTICE '   ✔ PASS - % - % != %', msg, reported, expected;
      RETURN;
    END IF;
    RAISE NOTICE '   ✘ FAIL - % - % != %', msg, reported, expected;
    RAISE EXCEPTION '% - % != %', msg, reported, expected USING ERRCODE = 'failed_assertion';
  END;
$Equal$ LANGUAGE plpgsql;

CREATE FUNCTION assertions.gt(reported anyelement, expected anyelement, msg text DEFAULT 'Greater Than') RETURNS void AS $Equal$
  BEGIN
    IF reported > expected THEN
      RAISE NOTICE '   ✔ PASS - % - % > %', msg, reported, expected;
      RETURN;
    END IF;
    RAISE NOTICE '   ✘ FAIL - % - % > %', msg, reported, expected;
    RAISE EXCEPTION '% - % > %', msg, reported, expected USING ERRCODE = 'failed_assertion';
  END;
$Equal$ LANGUAGE plpgsql;

CREATE FUNCTION assertions.lt(reported anyelement, expected anyelement, msg text DEFAULT 'Less Than') RETURNS void AS $Equal$
  BEGIN
    IF reported < expected THEN
      RAISE NOTICE '   ✔ PASS - % - % < %', msg, reported, expected;
      RETURN;
    END IF;
    RAISE NOTICE '   ✘ FAIL - % - % < %', msg, reported, expected;
    RAISE EXCEPTION '% - % < %', msg, reported, expected USING ERRCODE = 'failed_assertion';
  END;
$Equal$ LANGUAGE plpgsql;

SELECT assertions.equal((SELECT count(*) FROM test)::integer, 0, 'Test Count');
SELECT assertions.lt((SELECT count(*) FROM test)::integer, 1, 'Test Count');

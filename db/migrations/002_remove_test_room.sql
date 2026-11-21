-- One-time cleanup: remove the "nabbo" room, which was only ever a test account.
-- Its books, borrow requests, sessions and login all go with it, which frees its email
-- so the founding room can be claimed. Limited to rooms created before this cleanup,
-- so anyone who picks the handle "nabbo" later is never touched.
do $$
declare
  test_id uuid;
begin
  select id into test_id from profiles
  where handle = 'nabbo' and id <> '00000000-0000-4000-8000-000000000001' and created_at < '2026-11-22T00:00:00Z';
  if test_id is null then
    return;
  end if;
  delete from borrow_requests where owner_id = test_id;
  delete from books where owner_id = test_id;
  delete from users where id = test_id;
  delete from profiles where id = test_id;
end $$;

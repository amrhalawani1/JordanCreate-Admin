-- Dummy tickets for the admin approval queue.
-- Requires tickets-setup SQL (table + tickets_queue view) to have been run first.
-- Idempotent on ticket_ref. Does not touch guest_profiles or conversation_messages.
-- qr_token is only set on the already-approved sample row.

insert into public.tickets (
  id, phone, email, customer_name, holder_name, ticket_ref, ticket_type,
  qr_token, status, match_status, approved_at, rejected_at, rejected_by,
  rejection_note, source, created_at
) values
  -- Arabic holder name (RTL inside an LTR table)
  (
    'a0000000-0000-4000-a000-000000000001',
    '+962779453525',
    'aisha.khatib@example.com',
    'عائشة الخطيب',
    'عائشة الخطيب',
    'TZK-DUMMY-AR-001',
    'general',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '6 days'
  ),
  -- Name long enough to wrap
  (
    'a0000000-0000-4000-a000-000000000002',
    '+962790111222',
    'alexandra.fellowship@example.com',
    'Alexandra Constantinopoulou-Papadimitriou of the Jordan Create Fellowship',
    'Alexandra Constantinopoulou-Papadimitriou of the Jordan Create Fellowship',
    'TZK-DUMMY-LONG-002',
    'vip',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '5 days 12 hours'
  ),
  -- Null holder_name
  (
    'a0000000-0000-4000-a000-000000000003',
    '+962791234567',
    'unknown.holder@example.com',
    'Sami Nasser',
    null,
    'TZK-DUMMY-NOHOLDER-003',
    'general',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '5 days'
  ),
  -- No email
  (
    'a0000000-0000-4000-a000-000000000004',
    '+962798765432',
    null,
    'Hana Qudah',
    'Hana Qudah',
    'TZK-DUMMY-NOEMAIL-004',
    'student',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '4 days 18 hours'
  ),
  -- Non-Jordanian phone
  (
    'a0000000-0000-4000-a000-000000000005',
    '+14155552671',
    'maya.guest@example.com',
    'Maya Chen',
    'Maya Chen',
    'TZK-DUMMY-US-005',
    'early-bird',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '4 days'
  ),
  -- Buyer differs from holder
  (
    'a0000000-0000-4000-a000-000000000006',
    '+962777000111',
    'nour.saleh@example.com',
    'Omar Saleh',
    'Nour Saleh',
    'TZK-DUMMY-BUYER-006',
    'general',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '3 days 20 hours'
  ),
  -- Conflict pair: same phone, different holder names
  (
    'a0000000-0000-4000-a000-000000000007',
    '+962791111111',
    'parent.booking@example.com',
    'Tariq Mansour',
    'Tariq Mansour',
    'TZK-DUMMY-CONFLICT-A-007',
    'general',
    null, 'active', 'conflict', null, null, null, null, 'webhook',
    now() - interval '3 days 6 hours'
  ),
  (
    'a0000000-0000-4000-a000-000000000008',
    '+962791111111',
    'child.booking@example.com',
    'Tariq Mansour',
    'Leen Mansour',
    'TZK-DUMMY-CONFLICT-B-008',
    'general',
    null, 'active', 'conflict', null, null, null, null, 'webhook',
    now() - interval '3 days 5 hours'
  ),
  -- Legitimate group order: one buyer, four phones (should NOT warn)
  (
    'a0000000-0000-4000-a000-000000000009',
    '+962793000001',
    'rami.haddad@example.com',
    'Rami Haddad',
    'Rami Haddad',
    'TZK-DUMMY-GROUP-A-009',
    'vip',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '2 days 20 hours'
  ),
  (
    'a0000000-0000-4000-a000-00000000000a',
    '+962793000002',
    'lina.haddad@example.com',
    'Rami Haddad',
    'Lina Haddad',
    'TZK-DUMMY-GROUP-B-00A',
    'general',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '2 days 19 hours'
  ),
  (
    'a0000000-0000-4000-a000-00000000000b',
    '+962793000003',
    'yousef.haddad@example.com',
    'Rami Haddad',
    'Yousef Haddad',
    'TZK-DUMMY-GROUP-C-00B',
    'general',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '2 days 18 hours'
  ),
  (
    'a0000000-0000-4000-a000-00000000000c',
    '+962793000004',
    'sara.haddad@example.com',
    'Rami Haddad',
    'Sara Haddad',
    'TZK-DUMMY-GROUP-D-00C',
    'student',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '2 days 17 hours'
  ),
  -- Broken group order: one buyer, SAME phone on every ticket (must warn)
  (
    'a0000000-0000-4000-a000-00000000000d',
    '+962792222222',
    'lina.masri@example.com',
    'Lina Al-Masri',
    'Lina Al-Masri',
    'TZK-DUMMY-WARN-A-00D',
    'general',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '2 days'
  ),
  (
    'a0000000-0000-4000-a000-00000000000e',
    '+962792222222',
    'guest2.masri@example.com',
    'Lina Al-Masri',
    'Guest 2 Al-Masri',
    'TZK-DUMMY-WARN-B-00E',
    'general',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '1 day 23 hours'
  ),
  (
    'a0000000-0000-4000-a000-00000000000f',
    '+962792222222',
    'guest3.masri@example.com',
    'Lina Al-Masri',
    'Guest 3 Al-Masri',
    'TZK-DUMMY-WARN-C-00F',
    'comp',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '1 day 22 hours'
  ),
  (
    'a0000000-0000-4000-a000-000000000010',
    '+962792222222',
    'guest4.masri@example.com',
    'Lina Al-Masri',
    'Guest 4 Al-Masri',
    'TZK-DUMMY-WARN-D-010',
    'comp',
    null, 'active', 'pending', null, null, null, null, 'webhook',
    now() - interval '1 day 21 hours'
  ),
  -- Already approved (Approved tab is not empty; token is stored but never selected by the admin view)
  (
    'a0000000-0000-4000-a000-000000000011',
    '+962795555555',
    'approved.guest@example.com',
    'Zaid Ammari',
    'Zaid Ammari',
    'TZK-DUMMY-APPROVED-011',
    'vip',
    'seed-approved-token-do-not-display',
    'active', 'matched',
    now() - interval '12 hours',
    null, null, null, 'webhook',
    now() - interval '1 day 6 hours'
  ),
  -- Already rejected (Rejected tab is not empty)
  (
    'a0000000-0000-4000-a000-000000000012',
    '+962796666666',
    'rejected.guest@example.com',
    'Duplicate Purchase',
    'Duplicate Purchase',
    'TZK-DUMMY-REJECTED-012',
    'general',
    null, 'active', 'pending',
    null,
    now() - interval '8 hours',
    null,
    'Duplicate Tzkrti webhook for a refunded order. Buyer confirmed by email.',
    'webhook',
    now() - interval '20 hours'
  ),
  -- Manual crew/press ticket. A later webhook with this ticket_ref must collide, not overwrite.
  (
    'a0000000-0000-4000-a000-000000000013',
    '+962797777777',
    'press.desk@example.com',
    'Jordan Create Press',
    'Rana Odeh',
    'TZK-DUMMY-MANUAL-013',
    'comp',
    null, 'active', 'pending', null, null, null, null, 'manual',
    now() - interval '18 hours'
  )
on conflict (ticket_ref) do nothing;

export const ADMIN_VIEW_ONLY_SETUP_SQL = `-- Allow Admin - View Only on the admin_level enum.
-- Existing 'admin' rows stay Admin - Full Edit. Do not rename them.

alter type public.admin_level add value if not exists 'admin_view_only';
`;

-- فحص جميع الـ triggers المتعلقة بجدول orders
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'orders'
ORDER BY trigger_name;

-- فحص الـ functions المتعلقة بـ order_status_history
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%order%status%'
   OR routine_definition LIKE '%order_status_history%'
ORDER BY routine_name;

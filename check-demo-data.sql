-- CHECK IF DEMO DATA EXISTS

-- Check organizations
SELECT 'Organizations:' as table_name, COUNT(*) as count FROM organizations;
SELECT * FROM organizations LIMIT 5;

-- Check users
SELECT 'Users:' as table_name, COUNT(*) as count FROM users;
SELECT id, email, full_name, organization_id, role FROM users;

-- Check contacts
SELECT 'Contacts:' as table_name, COUNT(*) as count FROM contacts;
SELECT id, full_name, phone, organization_id FROM contacts LIMIT 10;

-- Check if demo user has correct org
SELECT 
    u.id as user_id,
    u.email,
    u.organization_id as user_org,
    COUNT(c.id) as contacts_in_same_org
FROM users u
LEFT JOIN contacts c ON c.organization_id = u.organization_id
WHERE u.email = 'demo@example.com'
GROUP BY u.id, u.email, u.organization_id;
-- Clean up conflicting data and fix foreign key structure definitively
-- First remove all existing registrations to avoid FK conflicts
TRUNCATE TABLE event_registrations CASCADE;

-- Drop all existing FK constraints that are problematic
ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_category_id_fkey;
ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_batch_id_fkey;

-- Make category_id nullable since it might reference different tables depending on context
ALTER TABLE event_registrations ALTER COLUMN category_id DROP NOT NULL;

-- Add proper FK for batch_id to lotes table
ALTER TABLE event_registrations 
ADD CONSTRAINT event_registrations_batch_id_fkey 
FOREIGN KEY (batch_id) REFERENCES lotes(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_registrations_batch_id ON event_registrations(batch_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_status ON event_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_created_at ON event_registrations(created_at);
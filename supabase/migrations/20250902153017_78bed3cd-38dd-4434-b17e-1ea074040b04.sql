-- Fix foreign key constraint issue in event_registrations
-- Remove the problematic foreign key constraint
ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_category_id_fkey;

-- Allow category_id to reference event_category.id directly
ALTER TABLE event_registrations 
ADD CONSTRAINT event_registrations_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES event_category(id);

-- Ensure we have a proper lote/batch reference
ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_batch_id_fkey;
ALTER TABLE event_registrations 
ADD CONSTRAINT event_registrations_batch_id_fkey 
FOREIGN KEY (batch_id) REFERENCES lotes(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_registrations_category_id ON event_registrations(category_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_batch_id ON event_registrations(batch_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_status ON event_registrations(payment_status);
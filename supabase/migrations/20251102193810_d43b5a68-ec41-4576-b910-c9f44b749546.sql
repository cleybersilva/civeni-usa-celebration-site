-- Create persistent rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits(ip_address, endpoint, window_start);

-- Create index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_window 
ON public.rate_limits(window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow system/service role to access rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true);

-- Cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours';
$$;

-- Function to check and enforce rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_address INET,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1,
  p_block_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_window_start TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- Calculate window start
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check for existing rate limit record
  SELECT * INTO v_record
  FROM public.rate_limits
  WHERE ip_address = p_ip_address
    AND endpoint = p_endpoint
    AND window_start > v_window_start
  ORDER BY window_start DESC
  LIMIT 1;
  
  -- Check if IP is blocked
  IF v_record.blocked_until IS NOT NULL AND NOW() < v_record.blocked_until THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'blocked',
      'blocked_until', v_record.blocked_until,
      'retry_after', EXTRACT(EPOCH FROM (v_record.blocked_until - NOW()))
    );
  END IF;
  
  -- If record exists and within window
  IF v_record.id IS NOT NULL THEN
    -- Check if limit exceeded
    IF v_record.request_count >= p_max_requests THEN
      -- Block the IP
      UPDATE public.rate_limits
      SET blocked_until = NOW() + (p_block_minutes || ' minutes')::INTERVAL,
          updated_at = NOW()
      WHERE id = v_record.id;
      
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'rate_limit_exceeded',
        'requests_made', v_record.request_count,
        'max_requests', p_max_requests,
        'retry_after', p_block_minutes * 60
      );
    ELSE
      -- Increment counter
      UPDATE public.rate_limits
      SET request_count = request_count + 1,
          updated_at = NOW()
      WHERE id = v_record.id;
      
      RETURN jsonb_build_object(
        'allowed', true,
        'requests_remaining', p_max_requests - v_record.request_count - 1
      );
    END IF;
  ELSE
    -- Create new rate limit record
    INSERT INTO public.rate_limits (ip_address, endpoint, request_count, window_start)
    VALUES (p_ip_address, p_endpoint, 1, NOW());
    
    RETURN jsonb_build_object(
      'allowed', true,
      'requests_remaining', p_max_requests - 1
    );
  END IF;
END;
$$;
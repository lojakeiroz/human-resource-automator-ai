-- Adicionar constraint única para evitar configurações duplicadas por usuário e provider
ALTER TABLE public.ai_configs 
ADD CONSTRAINT ai_configs_user_provider_unique 
UNIQUE (user_id, provider);
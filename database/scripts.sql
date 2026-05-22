-- 1. Criamos um tipo customizado para os perfis (Atores)
create type user_role as ENUM('CLIENTE', 'PROMOTOR', 'ADMIN');

-- 2. Tabela de Perfis
create table profiles (
  id UUID primary key references auth.users (id) on delete CASCADE,
  full_name TEXT not null,
  role user_role default 'CLIENTE' not null,
  created_at timestamp with time zone default timezone ('utc'::text, now()) not null
);

-- 3. Tabela de Eventos (Catálogo)
create table events (
  id SERIAL primary key,
  promoter_id UUID references profiles (id) not null,
  title TEXT not null,
  description TEXT,
  date timestamp with time zone not null,
  image_url TEXT,
  status TEXT default 'PUBLISHED' check (status in ('DRAFT', 'PUBLISHED', 'CANCELLED')),
  created_at timestamp with time zone default timezone ('utc'::text, now()) not null
);

-- 4. Tabela de Tipos de Ingresso / Lotes
create table ticket_types (
  id SERIAL primary key,
  event_id INTEGER references events (id) on delete CASCADE not null,
  name TEXT not null, -- Ex: VIP, Pista
  price DECIMAL(10, 2) not null,
  total_capacity INTEGER not null,
  available_quantity INTEGER not null,
  -- Atende ao [RNF07] Concorrência: O banco BLOQUEIA compras se a quantidade cair abaixo de 0!
  constraint prevent_overselling check (available_quantity >= 0)
);

-- 5. Tabela de Ingressos Comprados (A Carteira)
create table tickets (
  id UUID primary key default gen_random_uuid (),
  ticket_type_id INTEGER references ticket_types (id) not null,
  user_id UUID references profiles (id) not null,
  status TEXT default 'VALID' check (status in ('VALID', 'SCANNED', 'CANCELLED')),
  created_at timestamp with time zone default timezone ('utc'::text, now()) not null
);

-- Ativando o RLS nas tabelas sensíveis
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Regra 1 (Atende [RF02]): Qualquer pessoa pode ver eventos 'PUBLISHED' (Públicos)
CREATE POLICY "Eventos publicados são visíveis para todos" 
ON events FOR SELECT 
USING (status = 'PUBLISHED');

-- Regra 2 (Atende [RF06] e [RNF01]): O Promotor só edita e vê os seus PRÓPRIOS eventos privados
CREATE POLICY "Promotores gerenciam apenas seus próprios eventos" 
ON events FOR ALL 
USING (auth.uid() = promoter_id);

-- Regra 3 (Atende [RF03], [RF04] e [RNF01]): O Cliente só consegue ler os SEUS PRÓPRIOS ingressos
CREATE POLICY "Clientes veem apenas sua própria carteira de ingressos" 
ON tickets FOR SELECT 
USING (auth.uid() = user_id);

-- Regra 4: Clientes podem inserir (comprar) ingressos para si mesmos
CREATE POLICY "Clientes compram ingressos para si mesmos" 
ON tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Função que será executada pelo gatilho
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'CLIENTE');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- O Gatilho: Dispara após cada INSERT na tabela de utilizadores do Supabase
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

  -- 1. Demole a tabela antiga que falhou
drop table if exists public.tickets;

-- 2. Constrói a tabela com a tipagem exata (integer para o event_id)
create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  event_id integer references public.events(id) not null, -- <-- O AJUSTE MÁGICO AQUI
  purchase_date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'VALID'
);

-- 3. Ativa a Segurança (RLS)
alter table public.tickets enable row level security;

-- 4. Regra: O usuário só pode ver os seus PRÓPRIOS ingressos
create policy "Usuários veem seus próprios ingressos" 
on tickets for select using (auth.uid() = user_id);

-- 5. Regra: O usuário pode inserir um ingresso para si mesmo
create policy "Usuários podem comprar ingressos" 
on tickets for insert with check (auth.uid() = user_id);

-- 1. Adiciona o dono do evento na tabela de eventos
alter table public.events add column if not exists promoter_id uuid references public.profiles(id);

-- 2. Ativa RLS na tabela de eventos
alter table public.events enable row level security;

-- 3. Regra: Qualquer um pode VER eventos publicados
create policy "Eventos são públicos" on events for select using (true);

-- 4. Regra: Apenas PROMOTORES e ADMINS podem criar eventos
create policy "Promotores e Admins criam eventos" 
on events for insert 
with check (
  exists (
    select 1 from profiles 
    where id = auth.uid() 
    and (role = 'PROMOTOR' or role = 'ADMIN')
  )
);

-- 5. Regra: Promotores editam apenas os SEUS eventos, Admins editam todos
create policy "Edição de eventos" 
on events for update
using (
  auth.uid() = promoter_id OR 
  exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')
);

alter table public.events add column if not exists price numeric default 0;

alter table public.events add column if not exists total_tickets integer default 100;
alter table public.events add column if not exists tickets_sold integer default 0;
-- Users
create table if not exists users
(
  id uuid primary key,
  email varchar(255),
  created_at timestamp with time zone not null default now()
);

create unique index if not exists users_pkey on users(id uuid_ops);

-- Addresses
create table if not exists addresses (
    user_id uuid not null references users(id) on delete cascade on update cascade,
    blockchain character varying(50) not null default  '''ethereum'''::character varying,
    network character varying(50) not null,
    address character varying(100) not null,
    created_at timestamp with time zone not null default now()
);

-- Kyc
create table if not exists kyc (
    user_id uuid not null references users(id) on delete cascade on update cascade,
    provider character varying(100) not null,
    provider_account_id character varying(255) not null,
    digest jsonb,
    created_at timestamp with time zone not null default now(),
    verified_at timestamp with time zone
);

create unique index if not exists kyc_unique on kyc (user_id, provider, provider_account_id);

-- Agreements
create table if not exists agreements (
    id uuid primary key,
    user_id uuid not null references users(id) on delete cascade on update cascade,
    pool_id character(42) not null,
    provider character varying(100) not null,
    provider_template_id character varying(100) not null,
    provider_envelope_id character varying(100) not null,
    created_at timestamp with time zone not null default now(),
    signed_at timestamp with time zone,
    counter_signed_at timestamp with time zone
);

create unique index if not exists agreements_pkey on agreements(id uuid_ops);
create unique index if not exists agreements_unique on agreements (user_id, provider, provider_envelope_id);

-- users
create table if not exists users (
    id uuid primary key,
    email varchar(255),
    full_name character varying(255),
    entity_name character varying(255),
    country_code character varying(5),
    created_at timestamp with time zone not null default now()
);

create unique index if not exists users_pkey on users(id uuid_ops);
create unique index if not exists users_unique_email_idx on users (lower(email));

-- addresses
create table if not exists addresses (
    id uuid primary key,
    user_id uuid not null references users(id) on delete cascade on update cascade,
    blockchain character varying(50) not null default  '''ethereum'''::character varying,
    network character varying(50) not null,
    address character varying(100) not null,
    unlinked_at character varying(100),
    created_at timestamp with time zone not null default now()
);

create index if not exists addresses_lookup_idx on addresses (lower(address));
create unique index if not exists addresses_unique_idx on addresses (blockchain, network, lower(address));

-- kyc
create table if not exists kyc (
    user_id uuid not null references users(id) on delete cascade on update cascade,
    provider character varying(100) not null,
    provider_account_id character varying(255) not null,
    digest jsonb,
    created_at timestamp with time zone not null default now(),
    status character varying(20) not null default 'none'::character varying,
    usa_tax_resident boolean not null default false,
    accredited boolean not null default false,
    invalidated_at timestamp with time zone
);

create unique index if not exists kyc_unique on kyc (provider, provider_account_id);
create index if not exists kyc_user_id_lookup on kyc(user_id uuid_ops);
create unique index if not exists kyc_unique_upsert on kyc (user_id, provider, provider_account_id); -- required for the upsert method

-- agreements
create table if not exists agreements (
    id uuid primary key,
    user_id uuid not null references users(id) on delete cascade on update cascade,
    pool_id character(42) not null,
    tranche character varying(20) not null default '''senior'''::character varying,
    name character varying(100) not null default ''::character varying,
    provider character varying(100) not null,
    provider_template_id character varying(100) not null,
    provider_envelope_id character varying(100) not null,
    created_at timestamp with time zone not null default now(),
    signed_at timestamp with time zone,
    counter_signed_at timestamp with time zone,
    voided_at timestamp with time zone,
    declined_at timestamp with time zone
);

create unique index if not exists agreements_pkey on agreements(id uuid_ops);
create index if not exists agreements_user_id_lookup on agreements(user_id uuid_ops);
create unique index if not exists agreements_unique on agreements (provider, provider_envelope_id);

-- investments
create table if not exists investments (
    id uuid primary key,
    address_id uuid not null references addresses(id) on delete cascade on update cascade,
    pool_id character(42) not null,
    tranche character varying(10) not null default '''senior'''::character varying,
    is_whitelisted boolean not null default false,
    balance double precision not null default '0'::double precision,
    updated_at timestamp with time zone not null default now()
);

create unique index if not exists investments_pkey on investments(id uuid_ops);
create unique index if not exists investments_unique on investments (address_id, pool_id, tranche);

-- user_pools
create table if not exists user_pools (
    user_id uuid references users(id) on delete cascade on update cascade,
    pool_id character(42) not null,
    tranche character varying(10),
    created_at timestamp with time zone not null default now()
);
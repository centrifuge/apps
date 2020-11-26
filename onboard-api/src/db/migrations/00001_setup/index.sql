-- Users
create table if not exists users
(
  id uuid primary key,
  email varchar(255)
);

create unique index if not exists users_pkey on users(id uuid_ops);

-- Addresses
create table if not exists addresses (
    user_id uuid not null references users(id) on delete cascade on update cascade,
    blockchain character varying(50) not null default  '''ethereum'''::character varying,
    network character varying(50) not null,
    address character varying(100) not null
);
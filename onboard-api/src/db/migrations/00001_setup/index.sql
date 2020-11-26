create table if not exists users
(
  id uuid primary key,
  email varchar(255)
);

create unique index if not exists users_pkey on users(id uuid_ops);

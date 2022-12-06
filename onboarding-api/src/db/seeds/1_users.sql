insert into users (id, email)
    values ('9bc53ad4-2a58-41f2-8b67-4d129213bcb7', 'kovan-admin@centrifuge.io')
    on conflict do nothing;

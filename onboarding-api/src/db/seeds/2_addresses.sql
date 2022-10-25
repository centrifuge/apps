insert into addresses (user_id, blockchain, network, address)
    values ('9bc53ad4-2a58-41f2-8b67-4d129213bcb7', 'ethereum', 'goerli', '0x0A735602a357802f553113F5831FE2fbf2F0E2e0')
    on conflict do nothing;

# Argus Vigil Database Schema

SQLite is the MVP storage target. The backend should keep metadata by default and only persist raw packet bytes when the user explicitly enables raw capture storage.

## Tables

### network_interfaces

- `id`
- `name`
- `description`
- `ip_address`
- `mac_address`
- `status`
- `capture_available`
- `last_seen_at`

### capture_sessions

- `id`
- `mode`
- `name`
- `interface_id`
- `uploaded_file_name`
- `started_at`
- `ended_at`
- `status`
- `packet_count`
- `byte_count`
- `store_raw_packets`
- `created_at`

### packet_records

- `id`
- `session_id`
- `packet_number`
- `timestamp`
- `source_address`
- `destination_address`
- `source_port`
- `destination_port`
- `protocol`
- `length`
- `info`
- `raw_packet_ref`

### decoded_packets

- `id`
- `packet_id`
- `summary`
- `redaction_applied`

### protocol_layers

- `id`
- `decoded_packet_id`
- `name`
- `order_index`
- `byte_offset`
- `byte_length`

### packet_fields

- `id`
- `protocol_layer_id`
- `name`
- `value`
- `byte_offset`
- `byte_length`
- `explanation`
- `redacted`

### traffic_flows

- `id`
- `session_id`
- `source_ip`
- `source_port`
- `destination_ip`
- `destination_port`
- `protocol`
- `packet_count`
- `byte_count`
- `start_time`
- `end_time`
- `duration_ms`

### dns_records

- `id`
- `session_id`
- `packet_id`
- `queried_domain`
- `query_type`
- `response_ips`
- `response_code`
- `timestamp`
- `requesting_client`

### http_records

- `id`
- `session_id`
- `packet_id`
- `method`
- `host`
- `path`
- `status_code`
- `user_agent`
- `content_type`
- `redacted_headers`
- `timestamp`

### tls_records

- `id`
- `session_id`
- `packet_id`
- `server_name_indication`
- `tls_version`
- `cipher_suite`
- `certificate_subject`
- `certificate_issuer`
- `handshake_timing_ms`
- `timestamp`

### security_findings

- `id`
- `session_id`
- `observation`
- `why_it_matters`
- `confidence`
- `possible_benign_explanation`
- `suggested_next_step`
- `created_at`

### reports

- `id`
- `session_id`
- `title`
- `format`
- `content`
- `created_at`

### user_settings

- `id`
- `learning_mode_enabled`
- `raw_packet_storage_enabled`
- `backend_url`
- `created_at`
- `updated_at`

## Retention Controls

The backend should provide operations to:

- Delete a session permanently.
- Delete all stored data.
- Disable raw packet storage.
- Warn before saving raw captures.

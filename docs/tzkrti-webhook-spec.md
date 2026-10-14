# Jordan Create ticket webhook — integration spec for Tzkrti

Version 1.1 · 15 October 2026 · Contact: Amr Halawani (Jordan Create)

Tzkrti sends Jordan Create one HTTP request whenever a ticket for the event is created, changed or cancelled. Jordan Create stores the ticket and shows the pass inside the Jordan Create guest app.

## 1. Endpoint

| | |
|---|---|
| URL | `https://admin.jordancreate.com/api/tzkrti/webhook` |
| Method | `POST` |
| Content-Type | `application/json; charset=utf-8` |
| Body | JSON, UTF-8, up to 512 KB |
| Timeout on our side | 10 seconds |

A `GET` on the same URL answers `200 {"ok":true,"service":"jordan-create-tzkrti-webhook","configured":true}` and can be used to check reachability. It does not need authentication.

## 2. Authentication

Jordan Create gives Tzkrti one shared secret over a private channel. The secret is never sent in the body. Use **either** method on every `POST`:

**A. Bearer token** (simplest)

```
Authorization: Bearer <shared secret>
```

**B. HMAC signature** (if your platform signs webhooks)

```
X-Tzkrti-Signature: sha256=<HMAC-SHA256 of the raw request body, keyed with the shared secret>
```

The signature is computed over the exact bytes of the body you send. Hex or base64 are both accepted, with or without the `sha256=` prefix.

A request with neither header, or with a wrong value, gets `401`. Do not retry a `401`; the secret is wrong.

## 3. Request body

```json
{
  "event": "ticket.created",
  "delivery_id": "dlv_8f3c2a",
  "sent_at": "2026-10-15T10:21:45Z",
  "data": {
    "order": {
      "id": "ORD-10492",
      "customer": { "name": "Rana Haddad", "email": "rana@example.com", "phone": "+962791234567" }
    },
    "tickets": [
      {
        "ticket_ref": "JC3-000123",
        "type": "VIP",
        "status": "paid",
        "code": "8F3C2A9D1E",
        "updated_at": "2026-10-15T10:21:40Z",
        "holder": {
          "first_name": "Rana",
          "last_name": "Haddad",
          "email": "rana@example.com",
          "phone": "+962791234567"
        }
      }
    ]
  }
}
```

### Envelope

| Field | Type | Required | Notes |
|---|---|---|---|
| `event` | string | yes | `ticket.created`, `ticket.updated`, `ticket.cancelled`, `ticket.refunded`. Other values are accepted; anything containing *cancel*, *refund* or *void* voids the tickets in the message. `ping` or `test` is acknowledged and ignored. |
| `delivery_id` | string | strongly recommended | Unique per delivery attempt. Used to ignore duplicate deliveries. May be sent as the header `X-Tzkrti-Delivery` instead. If absent we fall back to a hash of the body. |
| `sent_at` | ISO 8601 | no | |
| `data.order` | object | no | One order can carry several tickets. |
| `data.order.id` | string | no | Stored as the order reference. |
| `data.order.customer` | object | no | The buyer. Stored separately from the ticket holder. |
| `data.tickets[]` | array | yes | One entry per attendee. A single `data.ticket` object is also accepted. |

### Ticket

| Field | Type | Required | Notes |
|---|---|---|---|
| `ticket_ref` | string | **yes** | Your unique ticket id or number. This is the key we update on later messages. |
| `holder.first_name` | string | **yes** | `holder.name` (full name) is accepted instead and split on the first space. |
| `holder.last_name` | string | recommended | |
| `holder.email` | string | **yes** | Must be a valid address. This is how the guest app recognises the ticket holder, so it must be the attendee's own email. |
| `holder.phone` | string | no | Any format; stored in E.164. Jordanian numbers without a country code are assumed to be +962. |
| `type` | string | no | Ticket category as you name it, e.g. `VIP`, `General Admission`, `Early Bird`, `Student`. |
| `status` | string | no | `paid`, `valid`, `cancelled`, `refunded`, etc. Anything containing *cancel*, *refund*, *void*, *invalid* or *expired* voids the ticket. |
| `code` | string | recommended | The value encoded in the QR that your scanners read at the door. When present, the guest app shows this code as the attendee's pass. When absent, we generate a pass code once and keep it stable. |
| `updated_at` | ISO 8601 | recommended | When this ticket last changed on your side. A message with an older `updated_at` than one we already stored is ignored, so out-of-order deliveries are safe. |

Field names are matched case-insensitively and common alternatives are understood (`ticketRef`, `ticket_id`, `attendee` instead of `holder`, `qr_code` instead of `code`, and so on). The names above are the canonical ones; please use them where you can.

### What each event should contain

- **ticket.created** — every ticket in the order, with `code` if your QR is already generated.
- **ticket.updated** — the changed tickets only, full record each (not a diff).
- **ticket.cancelled / ticket.refunded** — the affected tickets with `status` set accordingly. `holder` is still required so we can confirm it is the same person.

Group orders: send one ticket per attendee, each with that attendee's own `holder.email`. If attendee details are collected later, send `ticket.updated` once they are known.

## 4. Responses

| Status | Meaning | Retry? |
|---|---|---|
| `200` | Delivery stored and applied. Body lists an outcome per ticket. | No |
| `200` with `"duplicate": true` | Same `delivery_id` (or identical body) seen before; nothing changed. | No |
| `200` with `"status": "unmapped"` | Stored, but we could not find a ticket in it. We keep it and replay it once the mapping is fixed; please also tell us. | No |
| `400` | Body is not JSON. | No. Fix the payload. |
| `401` | Missing or wrong secret / signature. | No. Check the secret. |
| `413` | Body larger than 512 KB. | No |
| `500` | Our storage failed. The delivery is kept and will be replayed, but a retry is welcome. | **Yes**, with back-off (e.g. 1 min, 5 min, 30 min, 2 h, up to 24 h). |
| `503` | Endpoint not configured on our side. | Yes, later. Tell us. |

Example `200`:

```json
{
  "ok": true,
  "status": "processed",
  "outcomes": [
    { "ticketRef": "JC3-000123", "outcome": "inserted" },
    { "ticketRef": "JC3-000124", "outcome": "updated" },
    { "ticketRef": "JC3-000125", "outcome": "skipped", "note": "Older than the last change already applied to JC3-000125." },
    { "ticketRef": "JC3-000126", "outcome": "skipped", "note": "Ticket JC3-000126 has no valid attendee email, so no guest could find it." }
  ]
}
```

Outcomes: `inserted`, `updated`, `voided`, `skipped` (with the reason), `conflict` (a ticket our team created by hand with the same reference; yours was not applied). `skipped` entries were not stored, so please check the response and resend corrected records as `ticket.updated`.

## 5. Idempotency and ordering

- Deliveries are deduplicated on `delivery_id` (body field or `X-Tzkrti-Delivery` header). Retrying the same delivery is always safe.
- Tickets are keyed on `ticket_ref`. Sending the same ticket again updates it in place.
- `updated_at` decides which version wins when messages arrive out of order.
- A ticket that the Jordan Create team created by hand with the same `ticket_ref` is never overwritten; the response says `conflict`.

## 6. Test call

Replace `<secret>` with the shared secret.

```bash
curl -sS -X POST "https://admin.jordancreate.com/api/tzkrti/webhook" \
  -H "Authorization: Bearer <secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "ticket.created",
    "delivery_id": "test-001",
    "data": {
      "order": { "id": "TEST-ORDER-1" },
      "tickets": [{
        "ticket_ref": "TEST-0001",
        "type": "General",
        "status": "paid",
        "code": "TESTQR0001",
        "updated_at": "2026-10-15T10:00:00Z",
        "holder": { "first_name": "Test", "last_name": "Holder", "email": "test.holder@example.com", "phone": "+962790000000" }
      }]
    }
  }'
```

Expected: `200` with `"outcome": "inserted"`. Send it a second time: `200` with `"duplicate": true`. Use `ticket_ref` values starting with `TEST-` for anything that is not a real sale; we delete those.

## 7. Questions for Tzkrti

1. Which events can you send, and do cancellations and refunds come through the same webhook?
2. Does each ticket carry its own attendee email, or only the buyer's?
3. What exactly is encoded in the QR your scanners read? We want to show the same value in the app.
4. What is your retry policy when we answer `500`?
5. Can you share a sample payload from your system so we can confirm the field mapping before go-live?

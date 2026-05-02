# Scale National - GHL Automation Setup Spec

## Status Summary

The PIT token (`pit-78da4d2d-b177-4112-ad8c-15a2a9ac8c36`) only has read access to `/locations/{id}` and `/companies/{id}` endpoints. All write operations (pipelines, custom fields, tags, contacts, workflows) return `401 - The token is not authorized for this scope.`

**To fix this:** Go to Settings > Integrations > Private Integrations in the GHL agency dashboard, edit the token, and enable the following scopes:
- opportunities.readonly, opportunities.write (for pipelines)
- locations/customFields.readonly, locations/customFields.write
- locations/tags.readonly, locations/tags.write
- contacts.readonly, contacts.write
- workflows.readonly

Once scopes are updated, re-run the API calls below. Until then, everything must be set up manually in the GHL UI.

---

## 2a. Pipeline: "Scale National Clients"

**Location:** Settings > Pipelines > Create New Pipeline

Name: `Scale National Clients`

Stages (in order):
1. New Lead
2. Contacted
3. Quote Sent
4. Onboarding
5. Active Client
6. Churned

**API call (once scopes are fixed):**
```
POST https://services.leadconnectorhq.com/opportunities/pipelines
Authorization: Bearer pit-78da4d2d-b177-4112-ad8c-15a2a9ac8c36
Version: 2021-07-28
Content-Type: application/json

{
  "locationId": "bxAx2g1z6Dd09kSdJZYt",
  "name": "Scale National Clients",
  "stages": [
    {"name": "New Lead", "position": 0},
    {"name": "Contacted", "position": 1},
    {"name": "Quote Sent", "position": 2},
    {"name": "Onboarding", "position": 3},
    {"name": "Active Client", "position": 4},
    {"name": "Churned", "position": 5}
  ]
}
```

---

## 2b. Custom Fields

**Location:** Settings > Custom Fields > Add Field

| Field Name | Data Type |
|---|---|
| job_type | Text |
| monthly_revenue | Text |
| review_count | Number |
| review_rating | Decimal |

**API calls (once scopes are fixed):**
```
POST https://services.leadconnectorhq.com/locations/bxAx2g1z6Dd09kSdJZYt/customFields
Body: {"name": "job_type", "dataType": "TEXT"}
Body: {"name": "monthly_revenue", "dataType": "TEXT"}
Body: {"name": "review_count", "dataType": "NUMERICAL"}
Body: {"name": "review_rating", "dataType": "DECIMAL"}
```

---

## 2c. Tags

**Location:** Settings > Tags (or they auto-create when applied to a contact)

Create the following tags:
- `new-lead`
- `review-requested`
- `reviewed`
- `vip-client`
- `missed-call`
- `quote-sent`

**API call (once scopes are fixed):**
```
POST https://services.leadconnectorhq.com/locations/bxAx2g1z6Dd09kSdJZYt/tags
Body: {"name": "new-lead"}
(repeat for each tag)
```

---

## 2d. Workflows (Must Be Built Manually in GHL UI)

The GHL API does not support workflow creation via REST. Workflows can only be read (`GET /workflows/`) but not created or modified through the API. All 5 workflows below must be built manually in Automation > Workflows.

---

### Workflow 1: Missed Call Text Back

**Trigger:** Call Status = Missed (or Voicemail)

**Steps:**
1. Wait 30 seconds
2. Send SMS:
   ```
   Hey {{contact.first_name}}, sorry we missed your call! We'd love to help. Reply here or book a time: https://calendar.app.google/XPiWCwELdEtymrVS6
   ```
3. Add tag: `missed-call`

---

### Workflow 2: New Lead Notification

**Trigger:** Contact Tag Added = `new-lead`

**Steps:**
1. Send Internal Notification (SMS to Eric: +16468844584):
   ```
   New lead alert! {{contact.full_name}} - {{contact.phone}} - {{contact.email}}. Check your pipeline.
   ```
2. Send Internal Notification (Email to eric@scalenational.com):
   ```
   Subject: New Lead: {{contact.full_name}}
   Body: A new lead just came in.
   Name: {{contact.full_name}}
   Phone: {{contact.phone}}
   Email: {{contact.email}}
   Source: {{contact.source}}
   ```

---

### Workflow 3: Review Request Funnel

**Trigger:** Contact Tag Added = `review-requested`

**Steps:**
1. Send SMS:
   ```
   Hi {{contact.first_name}}, thanks for choosing {{location.name}}! How was your experience? We'd love your feedback: {{trigger_link.review_form}}
   ```
2. **Review form logic (built as a funnel/survey, not workflow steps):**
   - If rating is 4 or 5 stars: Redirect to Google Review page
   - If rating is 1 to 3 stars: Redirect to private feedback form ("Sorry to hear that. We'd like to make it right. Please share your feedback here.")
3. On 4-5 star submission: Add tag `reviewed`
4. On 1-3 star submission: Send internal notification to Eric with feedback details

**Note:** The star-rating logic is best implemented as a GHL Survey/Form with conditional redirect, not as workflow branching. Create a 2-page survey:
- Page 1: "Rate your experience" (1-5 stars)
- Page 2A (4-5 stars): "Thank you! Leave us a Google review" with redirect to Google review link
- Page 2B (1-3 stars): "Sorry to hear that. Tell us how we can improve." (text field, submitted privately)

---

### Workflow 4: Lead Follow-up Sequence

**Trigger:** Contact Created (or Tag Added = `new-lead`)

**Steps:**
1. Immediately send SMS:
   ```
   Thanks for reaching out to {{location.name}}! We'll be in touch shortly. Reply here if you have any questions.
   ```
2. Wait 1 day
3. Send SMS:
   ```
   Hi {{contact.first_name}}, just following up. Are you still looking for help with your project? We'd love to chat. Book a time here: https://calendar.app.google/XPiWCwELdEtymrVS6
   ```
4. Wait 2 days
5. Send SMS:
   ```
   Hey {{contact.first_name}}, just checking in one more time. If you're still interested, reply here or book a call: https://calendar.app.google/XPiWCwELdEtymrVS6
   ```
6. Wait 4 days
7. Send SMS:
   ```
   Hi {{contact.first_name}}, this is our last follow-up. If you ever need help down the road, we're here. Just reply to this text anytime.
   ```
8. Remove tag `new-lead`, add tag `quote-sent` (if applicable) or leave as-is

**Exit conditions:** Contact replies (moves to "Contacted" stage), or contact books appointment.

---

### Workflow 5: Text Remarketing Campaign (Template)

**Type:** Manual campaign (not automated trigger)

**Setup:** Create as a Workflow with a Manual Trigger (bulk action from contact list).

**Steps:**
1. Send SMS:
   ```
   Hey {{contact.first_name}}! {{location.name}} here. We're offering 15% off any job booked this month. Interested? Reply YES or book here: https://calendar.app.google/XPiWCwELdEtymrVS6
   ```

**Usage:** Select contacts from the contact list > Run this workflow via bulk action. Ideal for seasonal promotions, slow periods, or re-engagement campaigns.

---

## 2e. Snapshot

Snapshot creation requires an **Agency-level OAuth token** with the `snapshots.readonly` and `snapshots.write` scopes. The PIT token does not have access to snapshot endpoints.

**To create a snapshot:**
1. Go to the GHL Agency Dashboard (app.scalenational.com)
2. Navigate to Sub-accounts > Scale National > Click the three dots menu
3. Select "Save as Snapshot"
4. Name it "Scale National Master System"
5. Select all assets to include (pipelines, custom fields, workflows, tags, funnels, etc.)

**Alternatively**, if you set up OAuth for the agency:
```
POST https://services.leadconnectorhq.com/snapshots/
Authorization: Bearer {AGENCY_OAUTH_TOKEN}
Version: 2021-07-28
Content-Type: application/json

{
  "companyId": "7tH0VQLix4VkbO4GZopO",
  "locationId": "bxAx2g1z6Dd09kSdJZYt",
  "name": "Scale National Master System"
}
```

---

## Quick Reference

- **Location ID:** bxAx2g1z6Dd09kSdJZYt
- **Company ID:** 7tH0VQLix4VkbO4GZopO
- **Agency Dashboard:** app.scalenational.com
- **Sub-account CRM:** go.scalenational.com
- **Booking Link:** https://calendar.app.google/XPiWCwELdEtymrVS6
- **Eric's Email:** eric@scalenational.com
- **Tim's Email:** tim@scalenational.com

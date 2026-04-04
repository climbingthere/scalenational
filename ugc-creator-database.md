# ScaleNational UGC Creator Database
**Agency:** ScaleNational | **Owner:** Eric Kirtchakov (@kirtoutdoors)
**Last Updated:** April 4, 2026

---

## Part 1: Airtable Schema — "ScaleNational UGC Creators"

### Base Setup Instructions
Create a new Airtable base called **ScaleNational UGC Creators**. Use the field types listed below. Add a Grid View as the default, then create filtered views per Status and per Niche.

### Field Definitions

| Field Name | Airtable Field Type | Notes / Options |
|---|---|---|
| **Name** | Single line text | Creator's real name (first + last if known) |
| **Handle** | Single line text | Primary handle — e.g. @traildustkyle |
| **IG Handle** | URL | Link directly to IG profile |
| **TikTok Handle** | URL | Link directly to TikTok profile |
| **YouTube Handle** | URL | Link directly to YT channel |
| **Platform(s)** | Multiple select | Options: Instagram, TikTok, YouTube, X/Twitter, Pinterest |
| **IG Followers** | Number | Integer — raw follower count |
| **TikTok Followers** | Number | Integer — raw follower count |
| **YouTube Subscribers** | Number | Integer |
| **Niche Tags** | Multiple select | Hiking, Mountaineering, Camping, Van Life, Fishing, Hunting, Gear Review, E-Commerce, Golf, Lifestyle, Overlanding, Climbing, Trail Running, Kayaking/Paddling |
| **Content Style** | Single select | Options: Raw/Authentic, Cinematic, Educational/Tutorial, POV, Review/Demo, Aesthetic/Lifestyle |
| **Location** | Single line text | City, State — e.g. Denver, CO |
| **Past Brand Work** | Long text | Brand names and campaign types — e.g. "YETI (product review), REI (affiliate), Patagonia (gifted)" |
| **Contact Email** | Email | Preferred for formal outreach |
| **Contact DM** | Single line text | Platform + handle for DM — e.g. "IG: @traildustkyle" |
| **Rate — Short Video (15-30s)** | Currency | Per deliverable, usage rights only |
| **Rate — Long Video (60-90s)** | Currency | Per deliverable, usage rights only |
| **Rate — Photo Bundle (5-10)** | Currency | Per bundle, usage rights only |
| **Rate — Bundle Deal** | Currency | 3 videos + photos package |
| **Response Rate** | Single select | Options: High (replied <48h), Medium (replied <1 week), Low (slow/inconsistent), No Response |
| **Status** | Single select | Options: New, Contacted, Negotiating, Active, On Hold, Inactive, Blacklisted |
| **Notes** | Long text | Quality notes, personality, reliability flags, collab history |
| **Last Contacted Date** | Date | Date of most recent outreach |
| **Campaign(s) Assigned** | Link to another record | Link to a "Campaigns" table |
| **Sample Content Link** | URL | Best example of their UGC work |
| **Contract Signed** | Checkbox | Toggle when contract/agreement is in place |
| **Added By** | Single line text | Who sourced this creator — useful if team grows |
| **Date Added** | Date | Auto-populate when record is created |

### Recommended Views
- **All Creators** — Default grid, all fields visible
- **Active Roster** — Filtered: Status = Active
- **Outreach Queue** — Filtered: Status = New or Contacted, sorted by Last Contacted Date
- **By Niche** — Grouped by Niche Tags
- **Rate Sheet** — Hide notes/contact fields, show only rates and content style
- **Needs Follow-Up** — Filtered: Status = Contacted AND Last Contacted Date is more than 7 days ago

---

## Part 2: Creator Sourcing Strategy — 5 Free Methods

### Method 1: Hashtag Hunting (IG + TikTok)

Search these hashtags on both Instagram and TikTok. Sort by "Recent" not "Top" to find smaller creators who are actively posting. Look for accounts with 10K–100K followers and strong engagement (comments, saves, shares — not just likes).

**Hiking/Mountaineering:**
- `#hikingcreator` `#traillife` `#hikemore` `#summitlife` `#peakbagging` `#hikingadventures`
- `#solotrails` `#mountainlife` `#hikersofinstagram` `#coloradohiker`

**Camping/Van Life:**
- `#vanlife` `#campvibes` `#campingcreator` `#wildcamping` `#overlanding`
- `#trucklife` `#campinglife` `#offroadlife` `#vanlifecommunity`

**Fishing/Hunting:**
- `#fishingcontent` `#fishingcreator` `#flyfishing` `#bassfishing` `#deerhunting`
- `#huntingseason` `#fisherman` `#duckhunting` `#troutfishing`

**Gear/E-Commerce:**
- `#gearreview` `#outdoorgear` `#ugccreator` `#ugcoutdoor` `#productreview`
- `#outdoorproduct` `#campinggear` `#hikingessentials`

**Golf/Outdoor Lifestyle:**
- `#golfer` `#golflife` `#golftiktok` `#outdoorlifestyle` `#activeliving`

**Pro Tip:** On TikTok, use the search bar to type "outdoor UGC creator" — many creators explicitly self-identify in their bios. Filter to accounts with under 100K followers for realistic rate expectations.

---

### Method 2: Competitor Brand Tag Mining

Go to the Instagram/TikTok profiles of brands in your clients' niches and mine their tagged posts and mentions. These people are already doing outdoor content — many are undiscovered.

**Brands to mine (check "Tagged" tab and recent mentions):**
- YETI, Hydro Flask, Stanley (drinkware — universal outdoor)
- KUIU, First Lite, Sitka (hunting apparel)
- Topo Designs, Cotopaxi, Arc'teryx (hiking/outdoor apparel)
- ORCA Coolers, Engel, Pelican (coolers/outdoor storage)
- Fishpond, Simms, Orvis (fly fishing)
- Jackery, BioLite, Goal Zero (power/solar — camping)
- Leupold, Vortex Optics, Maven (hunting/optics)
- Titleist, Callaway, Ping (golf — if running golf campaigns)

**Process:**
1. Go to brand's IG profile → tap "Tagged" (the tag icon)
2. Sort by engagement visually — look for posts with genuine comments
3. Click through to profiles, check follower count + content quality
4. Save to your Airtable immediately

**Also check:** Brand's TikTok comment sections. Creators often comment on brand posts to get noticed.

---

### Method 3: TikTok/IG Search for "Outdoor Creators"

Search these specific phrases directly in TikTok and Instagram search bars:

**TikTok Search Terms:**
- "outdoor UGC creator"
- "UGC creator outdoor"
- "camping content creator"
- "hiking content creator"
- "outdoor gear reviewer"
- "UGC creator for hire"

**Instagram Search Terms (in bio search):**
- "outdoor content creator"
- "outdoor UGC"
- "nature creator"
- "hiking creator"
- "outdoor brand ambassador"

**Why this works:** A growing number of micro-creators explicitly label themselves as UGC creators in their bios and often LIST their niches. These are warm leads — they already know what UGC is and are actively seeking brand work.

**Filter criteria as you browse:**
- Engagement rate above 3% (rough check: comments + saves should look proportional to likes)
- Content quality consistent over last 10–15 posts
- Not already exclusive to a competitor brand
- Has email in bio or "collab" language

---

### Method 4: Creator Marketplaces — Free Tiers Only

These platforms allow free browsing or free creator sign-up. Use them to inbound source or post briefs at no cost.

| Platform | Free Access | How to Use for ScaleNational |
|---|---|---|
| **Billo** | Free brand account to post projects | Post a brief, creators apply — pay only per approved video |
| **Insense** | Free to browse creator profiles | Search "outdoor" niche, save profiles to outreach manually |
| **Collabstr** | Free to browse creator marketplace | Filter by niche + follower range; creators list rates upfront |
| **TikTok Creator Marketplace** | Free with TikTok Business account | Search by category, follower count, engagement rate |
| **Instagram Creator Marketplace** | Free with Meta Business Suite | Filter by niche, audience location, age demographics |
| **#UGCcreator community on Reddit** | Free | r/ugcmarketing, r/UGCcreators — post briefs or recruit there |

**Billo and Collabstr are the two highest-ROI free options.** Billo is pay-per-video (no subscription), and Collabstr lets creators come to you by posting a brief for free.

---

### Method 5: Mine Your Own Audience (@kirtoutdoors)

Eric has 18K TikTok followers and 7K Instagram followers — that is a warm, pre-qualified outdoor audience that already trusts him. Some of those followers ARE creators.

**Step-by-step process:**

1. **Post a "Creator Call" on both platforms:**
   - TikTok caption: *"Building a roster of outdoor UGC creators for brand campaigns — if you make outdoor content and want paid brand work, drop your handle below or DM me 'COLLAB'"*
   - IG Story with a poll or question box: *"Are you an outdoor content creator looking for paid UGC work? Drop your handle"*

2. **Check who engages most with your content:**
   - Go to your last 20–30 posts
   - Click into the likes/comments
   - Open every commenter's profile — look for anyone making outdoor content
   - If they have 5K–100K followers and good content, they're a candidate

3. **Use IG's "Followers" list strategically:**
   - Sort followers by "Most Interacted With" in your IG insights
   - Open the top 50–100 — some will be creators in your niche

4. **Story shoutout swap:** DM 2–3 fellow outdoor creators you already know and ask them to share your "Creator Call" story — this multiplies reach into adjacent audiences for free.

**Why this converts best:** These creators already follow you, they know ScaleNational exists (or will recognize Eric), and the trust barrier is far lower than cold outreach. Expect a higher response rate than cold sourcing.

---

## Part 3: Starter Creator List Template

> **Important Note:** The handles below are realistic-sounding example entries created as a template framework. Before adding to Airtable, conduct real research using the sourcing methods in Part 2 to verify real accounts. Use these as placeholders and replace with actual verified creators.

---

### Category 1: Hiking & Mountaineering (8 Creators)

| # | Example Handle | Platform | Est. Followers | Content Type | UGC Value |
|---|---|---|---|---|---|
| 1 | @traildustkyle | TikTok/IG | 45K TT / 22K IG | Solo thru-hike POV, gear-on-trail demos | Raw authentic style — great for "real world" product tests on trail |
| 2 | @summitsisters.co | Instagram | 67K IG | Women's hiking lifestyle, aesthetics | Strong female demographic — ideal for apparel, hydration, suncare brands |
| 3 | @peakpursuitjosh | TikTok | 31K TT | Colorado 14er summit logs, packing tutorials | Educational tone — great for technical gear explainer UGC |
| 4 | @hikewithmadie | TikTok/IG | 88K TT / 41K IG | Pacific Crest Trail content, storytelling | High storytelling ability — good for brand narrative-style UGC |
| 5 | @theridgelineco | YouTube/IG | 19K YT / 28K IG | Mountaineering, gear hauls, Pacific NW | Long-form review style — ideal for detailed gear/kit campaigns |
| 6 | @coldbootscaleb | TikTok | 52K TT | Winter alpine hiking, cold-weather gear | Niche cold-weather audience — strong fit for insulation/boot brands |
| 7 | @trailandfernstudio | Instagram | 34K IG | Aesthetic nature photography, product flats | Clean editorial aesthetic — best for product photography UGC bundles |
| 8 | @hikingdadventures | TikTok/IG | 29K TT / 14K IG | Family hiking, kid-friendly trail content | Unique family niche — good for lifestyle outdoor brands targeting parents |

---

### Category 2: Fishing & Hunting (6 Creators)

| # | Example Handle | Platform | Est. Followers | Content Type | UGC Value |
|---|---|---|---|---|---|
| 9 | @flyrodfrancesca | TikTok/IG | 41K TT / 19K IG | Fly fishing, women's outdoor lifestyle | Underrepresented demographic in fishing — high engagement, unique audience |
| 10 | @buckdownbrody | TikTok | 73K TT | Whitetail deer hunting, habitat scouting | Large engaged hunting audience — great for optics, camo, and call brands |
| 11 | @bassbaitbennett | TikTok/YT | 55K TT / 12K YT | Bass fishing, lure reviews, tournament tips | Authentic gear-use content — ideal for tackle, electronics, apparel |
| 12 | @waterfowlwes | Instagram/TikTok | 38K IG / 22K TT | Duck hunting, retriever dogs, marshland | Strong visual content style — good for decoy, shotgun, and call brands |
| 13 | @trouttailsandtrails | TikTok | 27K TT | Trout fishing + hiking combo content | Cross-niche audience overlap — good for multi-category outdoor brands |
| 14 | @elkseasonemma | TikTok/IG | 33K TT / 16K IG | Elk hunting, backcountry public land | Women hunting niche — strong fit for KUIU, Sitka, Vortex-type clients |

---

### Category 3: Camping & Van Life (6 Creators)

| # | Example Handle | Platform | Est. Followers | Content Type | UGC Value |
|---|---|---|---|---|---|
| 15 | @campfirechronicles | TikTok/IG | 61K TT / 33K IG | Car camping, campfire cooking, family trips | Accessible/relatable style — best for mass-market camping brands |
| 16 | @vanlifewithnora | TikTok/IG | 94K TT / 47K IG | Solo female van life, build tours, travel | Large audience, aspirational content — premium lifestyle brand fit |
| 17 | @dirtroadsanddiesel | TikTok/YT | 44K TT / 9K YT | Truck overlanding, off-road camping | Strong overlanding niche — great for vehicle accessories, recovery gear |
| 18 | @campkitchenkev | TikTok | 38K TT | Camp cooking, outdoor recipes, gear demos | Food-adjacent content — strong fit for cookware, stove, and cooler brands |
| 19 | @twopacksandadog | Instagram/TikTok | 52K IG / 28K TT | Couple van life, dog-friendly camping | Pet + outdoor crossover audience — ideal for lifestyle brand collaborations |
| 20 | @solarandsolitude | YouTube/IG | 22K YT / 31K IG | Off-grid power, van build tutorials, solar | Highly technical content — best fit for power/solar/battery brand UGC |

---

### Category 4: Outdoor E-Commerce & Gear Review (6 Creators)

| # | Example Handle | Platform | Est. Followers | Content Type | UGC Value |
|---|---|---|---|---|---|
| 21 | @gearheadgrayson | TikTok/YT | 67K TT / 24K YT | Gear unboxings, honest reviews, comparison vids | High purchase intent audience — best for conversion-focused UGC ads |
| 22 | @trailtestedtara | TikTok/IG | 43K TT / 21K IG | Women's outdoor gear reviews, budget picks | Budget-conscious female audience — strong for value proposition UGC |
| 23 | @outdoorunderdogreviews | YouTube | 18K YT | In-depth gear reviews, 60–90s format | Long-form comfort — ideal for detailed product demo UGC |
| 24 | @packlistpro | TikTok | 55K TT | Packing tips, gear roundups, top-5 lists | Listicle content style — great for multi-product showcase UGC |
| 25 | @firstlightfinnegan | Instagram | 29K IG | Aesthetic gear flat lays, golden hour product shots | Strong visual brand — best for premium product photography bundles |
| 26 | @budgetbackcountry | TikTok/IG | 81K TT / 39K IG | Affordable outdoor gear, Amazon outdoors | Price-sensitive massive audience — ideal for DTC brands with strong price angle |

---

### Category 5: Golf & Outdoor Lifestyle (4 Creators)

| # | Example Handle | Platform | Est. Followers | Content Type | UGC Value |
|---|---|---|---|---|---|
| 27 | @greens_and_granite | TikTok/IG | 38K TT / 19K IG | Golf + outdoor lifestyle hybrid — morning rounds, mountain views | Affluent crossover audience — premium brand fit for golf and outdoor apparel |
| 28 | @fairwayfrankco | TikTok | 72K TT | Entertaining golf commentary, course vlogs, gear hauls | High-engagement humorous style — great for brand awareness UGC |
| 29 | @sunriseswingssarah | Instagram | 44K IG | Women's golf lifestyle, fashion-forward | Female golf demographic — strong for apparel and accessory brands |
| 30 | @linksloungelife | TikTok/IG | 33K TT / 17K IG | Golf travel, resort courses, lifestyle content | Travel-forward affluent audience — good for premium golf and lifestyle brands |

---

## Part 4: Creator Outreach DM Templates

These are for recruiting creators INTO ScaleNational's network — they will be doing UGC work on behalf of brand clients.

---

### DM 1 — The Opener (Send First)

**Keep it short. No pitch yet. Just spark curiosity.**

> Hey [Name]! Found your content through [specific post/hashtag/mutual] — your [specific thing, e.g. "Colorado 14er content" / "camp cooking videos"] is exactly the style our clients are looking for right now.
>
> We run paid UGC campaigns for outdoor brands — you'd create content for their ads (no posting required on your end, just filming). Paying $[X]–$[Y] per video depending on format.
>
> Would you be open to hearing more? Happy to share what we're working on.

**Notes:**
- Personalize the [specific thing] — generic DMs get ignored
- Drop a real number range upfront — it filters serious creators and shows you're legitimate
- Keep under 5 sentences in the first message

---

### DM 2 — The Follow-Up / Brief Share (Send After "Yes, tell me more")

> Awesome! Here's how it works with ScaleNational:
>
> - You film short videos (15–90s) using products we ship to you — think real, authentic use, not overly polished
> - You own zero deliverable obligations beyond the agreed videos — no posting requirements
> - You keep the product + get paid within [X] days of approval
> - We handle all brand communication — you just focus on creating
>
> Right now we're sourcing for [specific niche, e.g. "a hiking apparel brand" / "a cooler company"] and your vibe fits well. Rates are [$X for short videos / $Y for photo bundles] and we can do bundles if you want more volume.
>
> Want me to send over a quick 1-page brief so you can see the exact deliverables?

**Notes:**
- This message removes friction — address the "what do I have to do?" question before they ask it
- End with a binary yes/no ask (the brief) — easier to say yes to than open-ended questions
- Mention "keep the product" — it's an underrated incentive for micro-creators
- Customize the niche/brand type based on what you're actually working on at the time

---

## Part 5: UGC Rate Card Reference

These are **usage rights only** rates — meaning the creator films and delivers the content, but does NOT post it to their channel. These rates are standard in the outdoor/lifestyle niche for micro-creators (10K–100K followers) as of 2025–2026.

### Base Rates by Deliverable

| Deliverable | Low End | Mid Range | High End | Notes |
|---|---|---|---|---|
| **Short-form video (15–30s)** | $75 | $150–$200 | $350 | Raw/authentic style on the lower end; cinematic on the higher end |
| **Short-form video (30–60s)** | $100 | $200–$275 | $450 | Most common UGC format for paid ads |
| **Long-form video (60–90s)** | $175 | $300–$400 | $600 | Demo/review style; more scripting/editing effort |
| **Photo bundle (5 photos)** | $75 | $125–$175 | $300 | Lifestyle use photos, usage rights included |
| **Photo bundle (10 photos)** | $125 | $200–$275 | $450 | Full campaign shoot; flat lay + lifestyle mix |
| **Bundle: 3 short videos** | $200 | $375–$500 | $850 | Volume discount expected; negotiate as a package |
| **Bundle: 3 videos + photo bundle** | $300 | $500–$700 | $1,100 | Full campaign asset package; most efficient rate |
| **Raw footage / B-roll** | $50 | $75–$125 | $200 | Often added as an upsell — ask for it always |

---

### Rate Modifiers (Add or Subtract)

| Factor | Rate Impact |
|---|---|
| Creator ships product back after filming | -$25–$50 (they lose the product) |
| Creator keeps product (gifted) | No discount — it's already baked in |
| Expedited turnaround (under 5 days) | +$50–$100 rush fee |
| Exclusivity clause (30 days, category) | +$75–$150 |
| Exclusivity clause (90+ days) | +$200–$400 |
| Whitelisting / dark posting rights | +$100–$300 (separate from usage rights) |
| Script provided by brand | Slight reduction — less creative lift for creator |
| Creator writes own script/concept | Standard rate or slight premium |
| Multiple usage platforms (Meta + TikTok + CTV) | +$50–$150 for extended platform rights |

---

### What to Budget Per Campaign (ScaleNational Reference)

| Campaign Type | Creator Count | Budget Range | Expected Deliverables |
|---|---|---|---|
| Small test campaign | 3 creators | $800–$1,500 | 6–9 short videos, 2–3 styles to test |
| Standard client campaign | 5–8 creators | $2,500–$5,000 | 15–25 videos, photo bundles, b-roll |
| Full UGC content sprint | 10–15 creators | $6,000–$12,000 | 30–50 assets across formats and styles |

---

### Agency Margin Note
When billing clients, ScaleNational can mark up creator rates by **20–40%** to cover sourcing, coordination, briefing, quality review, and revision management. This is standard agency practice and should be built into client proposals as a "Content Production" or "Creator Management" line item — not disclosed as markup.

Example: Creator rate = $200/video → Bill client at $260–$280/video + any platform ad spend separately.

---

*Template created for ScaleNational | @kirtoutdoors | April 2026*
*Research all creator handles before use — example entries are illustrative only*

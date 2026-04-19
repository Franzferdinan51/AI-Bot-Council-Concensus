# Advanced Topic Analysis & Councilor Selection

**Intelligent councilor selection based on deep topic analysis**

---

## 🧠 Topic Analysis Algorithm

### Step 1: Keyword Extraction
- Extract key terms from topic
- Identify domain-specific terminology
- Detect urgency indicators
- Identify stakeholder mentions

### Step 2: Category Classification
- Primary category (Business, Technical, Security, UX, etc.)
- Secondary categories (multi-label classification)
- Confidence score for each category

### Step 3: Impact Assessment
- **Scope:** Individual, Team, Department, Company, Industry
- **Urgency:** Low, Medium, High, Critical
- **Risk Level:** Low, Medium, High, Critical
- **Cost Impact:** <$1K, $1K-10K, $10K-100K, >$100K
- **User Impact:** Internal, Customer-facing, All users

### Step 4: Councilor Selection
- Core councilors (always included)
- Category specialists (based on classification)
- Impact-based additions (high risk/cost adds more councilors)
- Diversity check (ensure balanced perspectives)

---

## 🎯 Advanced Topic Categories

### Business & Strategy
**Keywords:** revenue, cost, ROI, market, competition, partnership, acquisition, investment, budget, funding, valuation, growth, strategy

**Auto-Select:**
- Core: Speaker, Economist, Product Manager
- Standard: + Finance Expert, Risk Manager, Marketing Expert
- High Impact: + Legal Expert, Compliance Officer

**Example Topics:**
- "Should we raise Series B funding?" → Comprehensive (12 councilors)
- "What's our Q4 marketing budget?" → Standard (8 councilors)
- "Should we partner with Company X?" → Comprehensive (11 councilors)

---

### Technical & Architecture
**Keywords:** architecture, microservices, monolith, API, database, cloud, infrastructure, scalability, performance, migration, refactor, tech debt

**Auto-Select:**
- Core: Speaker, Solutions Architect, Technocrat
- Standard: + DevOps Engineer, Performance Engineer, Security Expert
- High Impact: + Data Scientist, Quality Assurance, Technical Writer

**Example Topics:**
- "Should we migrate to Kubernetes?" → Comprehensive (13 councilors)
- "Which database should we use?" → Standard (9 councilors)
- "How do we reduce API latency?" → Standard (8 councilors)

---

### Security & Compliance
**Keywords:** security, vulnerability, threat, attack, breach, compliance, GDPR, CCPA, audit, certification, SOC2, ISO, privacy, encryption

**Auto-Select:**
- Core: Speaker, Security Expert, Sentinel
- Standard: + Risk Manager, Legal Expert, Compliance Officer
- High Impact: + Privacy Officer, DevOps Engineer, Communications

**Example Topics:**
- "We found a critical vulnerability" → Comprehensive (12 councilors)
- "Do we need SOC 2 certification?" → Comprehensive (11 councilors)
- "Is this GDPR compliant?" → Standard (9 councilors)

---

### User Experience & Design
**Keywords:** UX, UI, design, user, customer, accessibility, usability, interface, workflow, onboarding, retention, churn, satisfaction

**Auto-Select:**
- Core: Speaker, User Advocate, Product Manager
- Standard: + Accessibility Expert, Customer Support, Psychologist
- High Impact: + Community Manager, Marketing Expert, Data Scientist

**Example Topics:**
- "Redesign the checkout flow" → Standard (10 councilors)
- "Improve accessibility compliance" → Standard (9 councilors)
- "Reduce user churn by 20%" → Comprehensive (11 councilors)

---

### Product & Features
**Keywords:** feature, product, roadmap, release, launch, MVP, beta, GA, deprecate, sunset, prioritize, backlog

**Auto-Select:**
- Core: Speaker, Product Manager, Technocrat
- Standard: + User Advocate, Economist, Marketing Expert
- High Impact: + Legal Expert, Customer Support, Community Manager

**Example Topics:**
- "Should we build feature X?" → Standard (9 councilors)
- "What's our Q1 roadmap?" → Comprehensive (12 councilors)
- "Should we deprecate old API?" → Comprehensive (11 councilors)

---

### Innovation & Research
**Keywords:** innovation, research, experiment, pilot, prototype, breakthrough, disruption, emerging, trend, future, AI, ML, blockchain

**Auto-Select:**
- Core: Speaker, Innovation Coach, Visionary
- Standard: + Conspiracist, Product Manager, Data Scientist
- High Impact: + Ethicist, Legal Expert, Marketing Expert

**Example Topics:**
- "Should we invest in AI research?" → Comprehensive (12 councilors)
- "Experiment with blockchain?" → Standard (9 councilors)
- "What are emerging trends?" → Standard (8 councilors)

---

### Team & Organization
**Keywords:** team, hiring, firing, culture, org, structure, management, leadership, remote, hybrid, diversity, inclusion, training

**Auto-Select:**
- Core: Speaker, HR Specialist, Pragmatist
- Standard: + Ethicist, Legal Expert, Community Manager
- High Impact: + Risk Manager, Communications, Finance Expert

**Example Topics:**
- "Should we go fully remote?" → Comprehensive (12 councilors)
- "Hire 10 engineers this quarter" → Standard (9 councilors)
- "Improve team culture" → Standard (8 councilors)

---

### Legal & Regulatory
**Keywords:** legal, contract, agreement, terms, policy, regulation, compliance, lawsuit, liability, patent, trademark, copyright

**Auto-Select:**
- Core: Speaker, Legal Expert, Compliance Officer
- Standard: + Risk Manager, Privacy Officer, Product Manager
- High Impact: + Security Expert, Communications, Finance Expert

**Example Topics:**
- "Review this vendor contract" → Standard (9 councilors)
- "New privacy regulations" → Comprehensive (11 councilors)
- "Should we patent this?" → Standard (8 councilors)

---

### Environmental & Social
**Keywords:** environment, sustainability, carbon, green, climate, social, responsibility, ESG, ethical, impact, community

**Auto-Select:**
- Core: Speaker, Environmental Specialist, Ethics Philosopher
- Standard: + Legal Expert, Marketing Expert, Product Manager
- High Impact: + Finance Expert, Community Manager, Risk Manager

**Example Topics:**
- "Reduce carbon footprint by 50%" → Comprehensive (11 councilors)
- "Should we go carbon neutral?" → Comprehensive (10 councilors)
- "Community impact assessment" → Standard (9 councilors)

---

## 📊 Impact-Based Scaling

### Impact Level: Low
**Criteria:**
- Affects <10 people
- Cost <$1K
- No regulatory impact
- Reversible decision

**Councilors:** 5-7 (Quick Review)

---

### Impact Level: Medium
**Criteria:**
- Affects 10-100 people
- Cost $1K-10K
- Minor regulatory impact
- Partially reversible

**Councilors:** 7-10 (Standard Review) ⭐ **DEFAULT**

---

### Impact Level: High
**Criteria:**
- Affects 100-1000 people
- Cost $10K-100K
- Significant regulatory impact
- Hard to reverse

**Councilors:** 10-15 (Comprehensive Review)

---

### Impact Level: Critical
**Criteria:**
- Affects 1000+ people
- Cost >$100K
- Major regulatory/legal impact
- Irreversible decision

**Councilors:** 15-20+ (Full Deliberation)

---

## 🔧 Selection Weights

### Councilor Priority Weights

**Core Councilors (Always Considered):**
- Speaker: 1.0 (always included as facilitator)
- Skeptic: 0.9 (almost always included)
- Ethicist: 0.8 (included for most decisions)
- Pragmatist: 0.8 (included for most decisions)
- Technocrat: 0.7 (included for technical decisions)

**Category Specialists (Topic-Dependent):**
- Primary category match: 0.9
- Secondary category match: 0.6
- Tertiary category match: 0.3

**Impact-Based Additions:**
- High risk: +Risk Manager (0.9)
- High cost: +Economist, Finance Expert (0.8)
- High user impact: +User Advocate (0.9)
- Legal implications: +Legal Expert (0.9)
- Security implications: +Security Expert, Sentinel (0.9)

---

## 🎯 Smart Presets

### `--preset balanced` ⭐ **DEFAULT**
- 7-10 councilors
- Diverse perspectives
- Cost-effective
- Good for most decisions

### `--preset conservative`
- 10-15 councilors
- More risk-averse
- Include more compliance/legal
- For regulated industries

### `--preset innovative`
- 7-10 councilors
- More creative perspectives
- Include Innovation Coach, Visionary
- For brainstorming sessions

### `--preset technical`
- 7-10 councilors
- More technical expertise
- Include architects, engineers
- For technical decisions

### `--preset business`
- 7-10 councilors
- More business focus
- Include economists, finance
- For business decisions

### `--preset security`
- 10-12 councilors
- Security-focused
- Include security, legal, compliance
- For security reviews

### `--preset minimal`
- 3-5 councilors
- Core perspectives only
- Fastest, cheapest
- For simple questions

### `--preset thorough`
- 15-20 councilors
- Comprehensive coverage
- Multiple perspectives per category
- For major decisions

---

## 📈 Topic Analysis Examples

### Example 1: "Should we migrate from monolith to microservices?"

**Analysis:**
- **Categories:** Technical (primary), Business (secondary)
- **Impact:** High (affects entire engineering team, costly, hard to reverse)
- **Keywords:** microservices, monolith, migration, architecture
- **Risk Level:** High

**Auto-Selected (13 councilors):**
- Core: Speaker, Skeptic, Ethicist, Pragmatist, Technocrat
- Technical: Solutions Architect, DevOps Engineer, Performance Engineer
- Business: Economist, Product Manager
- Risk: Risk Manager, Security Expert
- Quality: Quality Assurance

---

### Example 2: "Is our new feature GDPR compliant?"

**Analysis:**
- **Categories:** Compliance (primary), Legal (primary), Product (secondary)
- **Impact:** High (regulatory, legal risk)
- **Keywords:** GDPR, compliant, privacy, regulation
- **Risk Level:** Critical

**Auto-Selected (12 councilors):**
- Core: Speaker, Skeptic, Ethicist, Pragmatist
- Compliance: Compliance Officer, Privacy Officer, Legal Expert
- Product: Product Manager, User Advocate
- Risk: Risk Manager, Security Expert
- Technical: DevOps Engineer, Data Scientist

---

### Example 3: "What should our Q4 roadmap be?"

**Analysis:**
- **Categories:** Product (primary), Business (primary), Strategy (secondary)
- **Impact:** High (affects entire company direction)
- **Keywords:** roadmap, Q4, planning, strategy
- **Risk Level:** Medium-High

**Auto-Selected (12 councilors):**
- Core: Speaker, Skeptic, Ethicist, Pragmatist
- Product: Product Manager, User Advocate
- Business: Economist, Finance Expert, Marketing Expert
- Strategy: Visionary, Historian
- Risk: Risk Manager

---

### Example 4: "Fix the login bug"

**Analysis:**
- **Categories:** Technical (primary), UX (secondary)
- **Impact:** Low (affects users temporarily, reversible)
- **Keywords:** bug, fix, login, technical
- **Risk Level:** Low

**Auto-Selected (5 councilors):**
- Core: Speaker, Skeptic, Pragmatist
- Technical: Coder, User Advocate

---

## 💡 Best Practices

### Do's:
- ✅ Let the system auto-select councilors (default)
- ✅ Use presets for specific scenarios
- ✅ Override manually when you have specific needs
- ✅ Consider impact level when choosing preset
- ✅ Review selected councilors before deliberation

### Don'ts:
- ❌ Don't manually select all 38 councilors
- ❌ Don't skip core councilors (Speaker, Skeptic, Ethicist)
- ❌ Don't use minimal preset for critical decisions
- ❌ Don't ignore impact assessment
- ❌ Don't select only like-minded councilors

---

## 🎛️ Configuration

### Override Auto-Selection

```bash
# Use preset
council deliberate "topic" --preset balanced

# Manual selection
council deliberate "topic" --councilors "Speaker,Technocrat,Ethicist,Skeptic,Pragmatist,Sentinel"

# Adjust impact level
council deliberate "topic" --impact high

# Force specific number
council deliberate "topic" --count 10
```

### Custom Presets

Create custom presets in config:

```json
{
  "councilor_selection": {
    "presets": {
      "startup": {
        "count": "7-10",
        "focus": ["business", "technical", "product"],
        "councilors": ["Speaker", "Product Manager", "Technocrat", "Economist", "Skeptic", "Pragmatist", "User Advocate"]
      },
      "enterprise": {
        "count": "12-15",
        "focus": ["compliance", "security", "business"],
        "councilors": ["Speaker", "Legal Expert", "Compliance Officer", "Security Expert", "Risk Manager", "Product Manager", "Economist"]
      }
    }
  }
}
```

---

**Advanced topic analysis ensures you get the right councilors for every decision - automatically!** 🏛️🧠

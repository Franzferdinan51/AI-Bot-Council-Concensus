# Smart Councilor Selection Guide

**Principle:** Select the right councilors for each decision, not all 38 every time.

---

## 🎯 Selection Strategy

### Quick Decisions (3-5 councilors)
**Use for:** Simple decisions, quick feedback, initial assessment

**Default Selection:**
- Speaker (facilitator - always included)
- Technocrat (technical perspective)
- Ethicist (ethical perspective)
- Skeptic (challenge assumptions)
- Pragmatist (feasibility check)

**API Calls:** ~5 calls
**Context Usage:** Low
**Response Time:** Fast (<30s)

---

### Standard Review (7-10 councilors)
**Use for:** Most decisions, feature reviews, planning sessions

**Default Selection:**
- Speaker (facilitator)
- Technocrat (technical)
- Ethicist (ethics)
- Skeptic (challenges)
- Pragmatist (feasibility)
- Sentinel (security)
- Product Manager (product value)
- User Advocate (user needs)
- [1-2 topic-specific councilors]

**API Calls:** ~7-10 calls
**Context Usage:** Medium
**Response Time:** Moderate (30-60s)

---

### Comprehensive Review (12-15 councilors)
**Use for:** Major decisions, architectural reviews, strategic planning

**Default Selection:**
- Speaker (facilitator)
- Technocrat (technical)
- Ethicist (ethics)
- Skeptic (challenges)
- Pragmatist (feasibility)
- Sentinel (security)
- Product Manager (product)
- User Advocate (users)
- Economist (financial)
- Legal Expert (legal)
- DevOps Engineer (infrastructure)
- [3-4 topic-specific councilors]

**API Calls:** ~12-15 calls
**Context Usage:** High
**Response Time:** Slower (60-90s)

---

### Full Deliberation (20+ councilors)
**Use for:** Critical decisions, company-wide impact, major investments

**Selection:** All relevant councilors from each category

**API Calls:** 20+ calls
**Context Usage:** Very High
**Response Time:** Slow (90s+)

---

## 🎯 Topic-Based Selection

### Business Decisions
**Auto-Select:**
- Speaker, Economist, Product Manager, Finance Expert, Risk Manager
- **Optional:** Marketing Expert, Legal Expert

**Count:** 5-7 councilors

### Technical Decisions
**Auto-Select:**
- Speaker, Technocrat, Solutions Architect, DevOps Engineer, Security Expert
- **Optional:** Performance Engineer, Data Scientist

**Count:** 5-7 councilors

### Security Reviews
**Auto-Select:**
- Speaker, Security Expert, Sentinel, Risk Manager, Legal Expert
- **Optional:** Compliance Officer, Privacy Officer

**Count:** 5-6 councilors

### User Experience Decisions
**Auto-Select:**
- Speaker, User Advocate, Accessibility Expert, Customer Support, Community Manager
- **Optional:** Psychologist, Marketing Expert

**Count:** 5-6 councilors

### Compliance Decisions
**Auto-Select:**
- Speaker, Legal Expert, Compliance Officer, Privacy Officer, Risk Manager
- **Optional:** Security Expert

**Count:** 5-6 councilors

### Innovation Sessions
**Auto-Select:**
- Speaker, Innovation Coach, Visionary, Conspiracist, Product Manager
- **Optional:** Marketing Expert, Ethics Philosopher

**Count:** 5-6 councilors

### Code Reviews
**Auto-Select:**
- Speaker, Coder, Quality Assurance, Performance Engineer, Security Expert
- **Optional:** Technical Writer, DevOps Engineer

**Count:** 5-6 councilors

### Strategic Planning
**Auto-Select:**
- Speaker, Product Manager, Visionary, Historian, Economist, Risk Manager
- **Optional:** Marketing Expert, Legal Expert

**Count:** 6-7 councilors

---

## 🔧 Automatic Selection Algorithm

The AI Council uses this algorithm to auto-select councilors:

1. **Analyze Topic** - Extract keywords and themes
2. **Match Categories** - Identify relevant categories
3. **Select Core Councilors** - Always include Speaker + 4 core
4. **Add Specialists** - Add 2-3 topic-specific councilors
5. **Balance Perspectives** - Ensure diverse viewpoints
6. **Limit Total** - Cap at 10 for standard, 15 for comprehensive

---

## 💡 Best Practices

### Do's:
- ✅ Start with 5-7 councilors for most decisions
- ✅ Add specialists based on topic
- ✅ Ensure diverse perspectives
- ✅ Consider cost vs. benefit
- ✅ Use comprehensive review for major decisions only

### Don'ts:
- ❌ Don't run all 38 councilors by default
- ❌ Don't select only like-minded councilors
- ❌ Don't skip core councilors (Speaker, Skeptic, Ethicist)
- ❌ Don't use comprehensive review for simple decisions
- ❌ Don't ignore cost implications

---

## 💰 Cost Optimization

### API Cost Estimates (per deliberation):

**Quick (5 councilors):**
- Tokens: ~5,000
- Cost: ~$0.01-0.05
- Time: <30s

**Standard (7-10 councilors):**
- Tokens: ~10,000
- Cost: ~$0.02-0.10
- Time: 30-60s

**Comprehensive (12-15 councilors):**
- Tokens: ~20,000
- Cost: ~$0.05-0.20
- Time: 60-90s

**Full (20+ councilors):**
- Tokens: ~40,000+
- Cost: ~$0.10-0.50+
- Time: 90s+

### Recommendations:
- Use Quick for: Simple questions, initial feedback
- Use Standard for: Most decisions, feature reviews
- Use Comprehensive for: Major decisions, architecture
- Use Full for: Critical, company-wide decisions only

---

## 🎯 Quick Reference

| Decision Type | Councilors | Cost | Time |
|--------------|------------|------|------|
| Simple Question | 3-5 | $ | <30s |
| Feature Review | 7-10 | $$ | 30-60s |
| Architecture | 10-12 | $$$ | 60-90s |
| Strategic | 12-15 | $$$$ | 90s+ |
| Critical | 20+ | $$$$$ | 90s+ |

**Default:** 7-10 councilors (Standard Review)

---

## 🏛️ Smart Selection in Action

### Example 1: "Should we add two-factor authentication?"

**Auto-Selected (7 councilors):**
- Speaker (facilitator)
- Security Expert (security implications)
- Sentinel (threat analysis)
- User Advocate (user experience impact)
- Product Manager (product value)
- Pragmatist (implementation feasibility)
- Skeptic (challenges assumptions)

**Not Selected:** Environmental Specialist, HR Specialist, etc. (not relevant)

### Example 2: "Should we migrate to microservices?"

**Auto-Selected (10 councilors):**
- Speaker (facilitator)
- Solutions Architect (architecture)
- DevOps Engineer (infrastructure)
- Performance Engineer (performance)
- Security Expert (security)
- Economist (cost analysis)
- Product Manager (product impact)
- User Advocate (user impact)
- Skeptic (challenges)
- Pragmatist (feasibility)

### Example 3: "What's our Q4 roadmap?"

**Auto-Selected (8 councilors):**
- Speaker (facilitator)
- Product Manager (product strategy)
- Economist (financial)
- Visionary (future thinking)
- Historian (learn from past)
- User Advocate (user needs)
- Technocrat (technical feasibility)
- Risk Manager (risks)

---

**Smart selection ensures you get the right perspectives without wasting API calls or flooding context!** 🏛️💡

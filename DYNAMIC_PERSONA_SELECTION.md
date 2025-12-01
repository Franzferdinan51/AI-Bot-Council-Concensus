# Dynamic Persona Selection Guide

## 🎯 Overview

The controlling AI can now **dynamically select** which council personas participate in each session! Instead of using the default enabled bots, you can specify exactly which personalities should join based on the topic at hand.

This ensures the right expertise is present for every discussion, leading to more informed and relevant deliberations.

## 💡 Why Use Dynamic Selection?

**Default Mode**: Uses pre-configured enabled bots (good for general use)
**Dynamic Mode**: AI selects optimal personas for specific topics (better for targeted expertise)

### Example Scenarios:

**Science Question** (Default):
- Gets: Speaker, Technocrat, Ethicist, Pragmatist
- **Result**: Generic responses, missing scientific depth

**Science Question** (Dynamic):
- Gets: Speaker, Specialist-Science, Technocrat, Ethicist, Historian
- **Result**: Deep scientific analysis with historical context and ethical implications

## 🔧 How It Works

Each council session tool accepts a `settings.bots` parameter:

```json
{
  "name": "council_proposal",
  "arguments": {
    "topic": "Should we implement universal basic income?",
    "settings": {
      "bots": [
        { "id": "speaker-high-council", "enabled": true },
        { "id": "councilor-technocrat", "enabled": true },
        { "id": "councilor-ethicist", "enabled": true },
        { "id": "councilor-pragmatist", "enabled": true },
        { "id": "councilor-scientist", "enabled": true }
      ]
    }
  }
}
```

**Note**: Only specify bots you want to change. Unspecified bots will use their default enabled/disabled state.

## 🗺️ Persona-to-Topic Mapping

### Science & Technology
**Topics**: Research, AI, physics, chemistry, biology, space, engineering
**Recommended Personas**:
- `specialist-science` - Hard science expertise
- `councilor-technocrat` - Technology focus
- `councilor-visionary` - Future implications
- `councilor-skeptic` - Scientific skepticism
- `councilor-historian` - Scientific history

**Example**:
```json
"settings": {
  "bots": [
    { "id": "specialist-science", "enabled": true },
    { "id": "councilor-technocrat", "enabled": true },
    { "id": "councilor-visionary", "enabled": true }
  ]
}
```

### Medicine & Health
**Topics**: Healthcare, diseases, medical policy, pharmaceuticals
**Recommended Personas**:
- `specialist-medical` - Medical expertise
- `councilor-ethicist` - Medical ethics
- `councilor-pragmatist` - Healthcare economics
- `councilor-psychologist` - Mental health
- `councilor-sentinel` - Public health security

### Legal & Regulatory
**Topics**: Laws, regulations, compliance, rights
**Recommended Personas**:
- `specialist-legal` - Legal expertise
- `councilor-ethicist` - Moral law perspective
- `councilor-pragmatist` - Implementation feasibility
- `councilor-diplomat` - International law
- `councilor-sentinel` - Security implications

### Economics & Finance
**Topics**: Markets, inflation, trade, taxation, UBI
**Recommended Personas**:
- `specialist-finance` - Economic expertise
- `councilor-pragmatist` - Practical economics
- `councilor-technocrat` - Data-driven finance
- `councilor-libertarian` - Free market perspective
- `councilor-progressive` - Economic equity

### Military & Defense
**Topics**: Security, warfare, defense policy, geopolitics
**Recommended Personas**:
- `specialist-military` - Defense expertise
- `councilor-sentinel` - Security focus
- `councilor-diplomat` - International relations
- `councilor-pragmatist` - Defense budgets
- `councilor-ethicist` - Just war theory

### Politics & Society
**Topics**: Elections, social issues, culture, ideology
**Recommended Personas**:
- `councilor-journalist` - Public interest
- `councilor-ethicist` - Social morality
- `councilor-progressive` - Liberal perspective
- `councilor-conservative` - Traditional values
- `councilor-independent` - Centrist view
- `councilor-diplomat` - Compromise solutions

### Environmental
**Topics**: Climate change, pollution, conservation, energy
**Recommended Personas**:
- `specialist-science` - Environmental science
- `councilor-visionary` - Long-term sustainability
- `councilor-pragmatist` - Economic trade-offs
- `councilor-ethicist` - Environmental ethics
- `councilor-sentinel` - Resource security

### Technology Ethics
**Topics**: AI ethics, privacy, surveillance, data rights
**Recommended Personas**:
- `councilor-ethicist` - Moral implications
- `councilor-technocrat` - Technical feasibility
- `councilor-sentinel` - Security concerns
- `councilor-skeptic` - Risk assessment
- `councilor-journalist` - Public transparency

### Coding & Software
**Topics**: Programming, software architecture, development practices
**Recommended Personas**:
- `specialist-code` - Technical implementation
- `councilor-technocrat` - Efficiency focus
- `councilor-pragmatist` - Business value
- `councilor-sentinel` - Security considerations
- `councilor-ethicist` - Open source ethics

## 🎨 Flexible Combinations

Mix and match based on topic complexity:

**Complex Multi-Domain Issue** (e.g., "Should we regulate AI?"):
```json
"bots": [
  { "id": "specialist-science", "enabled": true },
  { "id": "specialist-legal", "enabled": true },
  { "id": "councilor-ethicist", "enabled": true },
  { "id": "councilor-technocrat", "enabled": true },
  { "id": "councilor-sentinel", "enabled": true }
]
```

**Quick Decision** (e.g., "Which approach is better?"):
```json
"bots": [
  { "id": "speaker-high-council", "enabled": true },
  { "id": "councilor-technocrat", "enabled": true },
  { "id": "councilor-pragmatist", "enabled": true }
]
```

**Historical Perspective** (e.g., "Lessons from past policies"):
```json
"bots": [
  { "id": "councilor-historian", "enabled": true },
  { "id": "councilor-ethicist", "enabled": true },
  { "id": "councilor-pragmatist", "enabled": true }
]
```

## 🤖 AI-Driven Selection Logic

Here's how a controlling AI can implement smart persona selection:

```python
def select_personas(topic: str) -> List[dict]:
    """Select optimal personas based on topic analysis"""

    # Define keyword-to-persona mappings
    topic_patterns = {
        'science': ['specialist-science', 'councilor-visionary', 'councilor-skeptic'],
        'medical': ['specialist-medical', 'councilor-ethicist', 'councilor-psychologist'],
        'legal': ['specialist-legal', 'councilor-diplomat', 'councilor-ethicist'],
        'technology': ['specialist-code', 'councilor-technocrat', 'councilor-sentinel'],
        'economics': ['specialist-finance', 'councilor-pragmatist', 'councilor-progressive'],
        'security': ['specialist-military', 'councilor-sentinel', 'councilor-diplomat'],
        'environment': ['specialist-science', 'councilor-visionary', 'councilor-ethicist']
    }

    # Analyze topic and select matching personas
    selected = []
    for keyword, personas in topic_patterns.items():
        if keyword in topic.lower():
            for persona_id in personas:
                selected.append({"id": persona_id, "enabled": True})

    # Always include core participants
    core = ["speaker-high-council"]
    for persona_id in core:
        if not any(p["id"] == persona_id for p in selected):
            selected.append({"id": persona_id, "enabled": True})

    return selected

# Usage
personas = select_personas("Should we implement nuclear fusion power?")
# Returns speakers, scientists, environmentalists, economists, etc.
```

## 📋 All Available Personas

| Persona ID | Name | Specialty | Enabled by Default |
|------------|------|-----------|-------------------|
| `speaker-high-council` | High Speaker | Moderation | ✅ Yes |
| `moderator-facilitator` | Facilitator | Discussion flow | ✅ Yes |
| `councilor-technocrat` | Technocrat | Technology & data | ✅ Yes |
| `councilor-ethicist` | Ethicist | Morality & ethics | ✅ Yes |
| `councilor-pragmatist` | Pragmatist | Practicality | ✅ Yes |
| `councilor-visionary` | Visionary | Future-focused | ❌ No |
| `councilor-sentinel` | Sentinel | Security | ❌ No |
| `councilor-historian` | Historian | Past precedents | ❌ No |
| `councilor-diplomat` | Diplomat | International relations | ❌ No |
| `councilor-skeptic` | Skeptic | Risk assessment | ❌ No |
| `councilor-conspiracist` | Conspiracist | Alternative views | ❌ No |
| `councilor-journalist` | Journalist | Public interest | ❌ No |
| `councilor-propagandist` | Propagandist | Narrative & framing | ❌ No |
| `councilor-psychologist` | Psychologist | Human behavior | ❌ No |
| `councilor-libertarian` | Libertarian | Individual liberty | ❌ No |
| `councilor-progressive` | Progressive | Social justice | ❌ No |
| `councilor-conservative` | Conservative | Traditional values | ❌ No |
| `councilor-independent` | Independent | Centrist view | ❌ No |
| `specialist-code` | Coder | Programming | ❌ No |
| `specialist-legal` | Legal | Law & regulations | ❌ No |
| `specialist-science` | Science | Hard sciences | ❌ No |
| `specialist-finance` | Finance | Economics | ❌ No |
| `specialist-military` | Military | Defense | ❌ No |
| `specialist-medical` | Medical | Health & medicine | ❌ No |

## 💡 Pro Tips

1. **Always include the Speaker** - Needed to summarize and conclude
2. **Mix perspectives** - Include at least 3-5 diverse viewpoints
3. **Use specialists for domain expertise** - They provide deeper insights
4. **Balance specialists with generalists** - Specialists know the details, generalists see the big picture
5. **Enable specialists in disabled state by default** - They're powerful but cost more tokens
6. **Consider topic complexity** - Simple questions need fewer personas

## 🔍 Example: Complete API Call

```json
{
  "name": "council_deliberation",
  "arguments": {
    "topic": "What are the ethical implications of CRISPR gene editing?",
    "userPrompt": "As a bioethics researcher, I'm particularly concerned about consent and equity.",
    "settings": {
      "bots": [
        { "id": "speaker-high-council", "enabled": true },
        { "id": "specialist-medical", "enabled": true },
        { "id": "specialist-science", "enabled": true },
        { "id": "councilor-ethicist", "enabled": true },
        { "id": "councilor-historian", "enabled": true },
        { "id": "councilor-journalist", "enabled": true }
      ],
      "verboseLogging": true,
      "progressDelay": 600
    }
  }
}
```

## 🎯 Best Practices

### ✅ DO:
- Select personas based on topic keywords
- Include diverse perspectives (at least 3 different viewpoints)
- Always enable the Speaker for closing remarks
- Use specialists when discussing technical topics
- Balance idealism with pragmatism

### ❌ DON'T:
- Enable too many personas (limits effectiveness, increases cost)
- Forget to enable the Speaker
- Use only one perspective (defeats the purpose of a council)
- Enable all specialists by default (expensive)
- Ignore the controlling bot's userPrompt

## 🚀 Advanced: Pattern Matching

For advanced AIs, implement semantic matching:

```python
def smart_persona_selection(topic: str, context: str = "") -> List[dict]:
    """
    AI-powered persona selection based on semantic analysis
    """
    # Use embeddings or keyword extraction
    # Match against persona expertise databases
    # Return optimized configuration
    pass
```

## 📚 See Also

- `CONNECTION_GUIDE.md` - Integration examples
- `ENHANCED_FEATURES.md` - Bot participation and logging
- `TROUBLESHOOTING_MCP_CLIENT.md` - Connection issues

---

**Dynamic Persona Selection** - The controlling AI's power to curate the perfect council for any topic! 🎨🤖

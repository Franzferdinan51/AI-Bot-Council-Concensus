# 👁️ Vision Council Mode - Complete Guide

**AI-powered image analysis with multi-agent deliberation**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Vision Councilors](#vision-councilors)
- [Supported Models](#supported-models)
- [How to Use](#how-to-use)
- [Deliberation Workflow](#deliberation-workflow)
- [Use Cases](#use-cases)
- [API Reference](#api-reference)
- [Export Options](#export-options)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**Vision Council** is the 11th deliberation mode, specialized for image-based analysis. Upload a photo and get multi-perspective analysis from 8+ vision-specialized AI councilors.

### Key Features

- 👁️ **8 Vision Specialists** - Each analyzes different aspects
- 🤖 **Multi-Model Analysis** - Compare insights from different vision models
- 📸 **Easy Upload** - Drag & drop, camera capture, or file picker
- 💬 **Collaborative Deliberation** - Councilors discuss and debate
- 📊 **Comprehensive Analysis** - From patterns to emotions to symbolism
- 📤 **Rich Export** - PDF, Markdown, JSON with images

---

## 👥 Vision Councilors

### 8 Specialized Vision Councilors

#### 1. **Visual Analyst** 🔍
- **Role:** General image analysis
- **Focus:** Overall composition, main subjects, context
- **Typical Output:** "This image shows [subject] in [setting] with [key elements]..."

#### 2. **Pattern Recognizer** 🔷
- **Role:** Patterns, anomalies, repetitions
- **Focus:** Visual patterns, irregularities, trends
- **Typical Output:** "I notice a repeating pattern of... The anomaly here is..."

#### 3. **Color Specialist** 🎨
- **Role:** Color theory, mood, harmony
- **Focus:** Color palette, emotional impact, color relationships
- **Typical Output:** "The dominant colors are... creating a [mood] atmosphere..."

#### 4. **Composition Expert** 📐
- **Role:** Layout, balance, framing
- **Focus:** Rule of thirds, symmetry, visual flow
- **Typical Output:** "The composition uses [technique] effectively... The balance is..."

#### 5. **Context Interpreter** 🌍
- **Role:** Scene understanding, setting
- **Focus:** Location, time, cultural context, situation
- **Typical Output:** "This appears to be [location/time] because... The context suggests..."

#### 6. **Detail Observer** 🔬
- **Role:** Fine details, textures, small elements
- **Focus:** Textures, small objects, subtle details
- **Typical Output:** "Looking closely, I can see... The texture shows..."

#### 7. **Emotion Reader** 😊
- **Role:** Emotional content, mood, feelings
- **Focus:** Facial expressions, body language, atmosphere
- **Typical Output:** "The emotional tone is... The subjects appear to feel..."

#### 8. **Symbol Interpreter** 🔮
- **Role:** Symbols, meanings, cultural context
- **Focus:** Symbolic elements, cultural significance, metaphors
- **Typical Output:** "The [object] symbolizes... In [culture], this represents..."

---

## 🤖 Supported Models

### Vision Models

| Model | Provider | Best For | Latency |
|-------|----------|----------|---------|
| **qwen/qwen3.5-9b** | Local Qwen3.5 | General analysis | 100-500ms |
| **GPT-4 Vision** | OpenAI | Detailed analysis | 1000-2000ms |
| **Gemini Pro Vision** | Google | Multi-modal | 500-1500ms |
| **Qwen-VL** | Local (LM Studio/Ollama) | Privacy, offline | 100-500ms |

### Model Selection

**Auto-Select (Default):**
- Uses best available model
- Falls back through chain if unavailable

**Manual Selection:**
- Choose specific model for analysis
- Compare insights across models

---

## 📸 How to Use

### Step 1: Start Vision Session

1. Click **"New Deliberation"**
2. Select **"👁️ Vision Council"** mode
3. Upload image (drag & drop, camera, or file picker)
4. Add prompt/question (optional)
5. Click **"Start Analysis"**

### Step 2: Upload Image

**Supported Formats:**
- JPEG/JPG
- PNG
- WebP
- GIF (static)

**Size Limits:**
- Maximum: 10MB
- Recommended: <5MB for faster processing

**Upload Methods:**
- **Drag & Drop** - Drag image onto upload area
- **Camera** - Capture photo (mobile)
- **File Picker** - Browse and select file

### Step 3: Add Prompt (Optional)

**Example Prompts:**
- "Analyze this photo for composition and color"
- "What emotions does this image convey?"
- "Identify any safety concerns in this image"
- "What's the story behind this photo?"
- "Analyze the symbolism in this artwork"

### Step 4: Review Analysis

**Individual Analysis:**
- Each councilor provides initial analysis
- View insights from all 8 councilors

**Collaborative Deliberation:**
- Councilors discuss and debate
- Ask questions, challenge each other
- Build on each other's insights

**Final Synthesis:**
- Speaker synthesizes key insights
- Recommendations provided
- Export options available

---

## 🔄 Deliberation Workflow

### Phase 1: Image Upload & Preprocessing (10-30s)
- Image validation
- Compression optimization
- EXIF data handling
- Privacy protection

### Phase 2: Individual Vision Analysis (30-60s)
- Each councilor analyzes image
- Model processes image
- Initial insights generated

### Phase 3: Collaborative Discussion (60-90s)
- Councilors share insights
- Ask questions, challenge interpretations
- Build consensus or note disagreements

### Phase 4: Synthesis & Recommendations (30-60s)
- Speaker synthesizes key points
- Recommendations provided
- Confidence scores assigned

### Phase 5: Export Results (10-30s)
- Choose export format
- Generate report
- Download or share

**Total Time:** 2.5-5 minutes

---

## 💡 Use Cases

### 📷 Photo Analysis & Feedback
- **Use:** Get feedback on photography
- **Councilors:** Composition Expert, Color Specialist, Detail Observer
- **Output:** Composition tips, color grading suggestions, technical feedback

### 🎨 Design Review
- **Use:** Review designs, layouts, UI/UX
- **Councilors:** Visual Analyst, Composition Expert, Pattern Recognizer
- **Output:** Design strengths, areas for improvement, usability insights

### 🖼️ Art Critique
- **Use:** Analyze artwork, understand meaning
- **Councilors:** Color Specialist, Symbol Interpreter, Emotion Reader
- **Output:** Artistic analysis, symbolic meaning, emotional impact

### 🏠 Real Estate Photo Analysis
- **Use:** Evaluate property photos
- **Councilors:** Visual Analyst, Context Interpreter, Detail Observer
- **Output:** Property features, condition assessment, marketing insights

### 🛍️ Product Photo Optimization
- **Use:** Optimize product photos for e-commerce
- **Councilors:** Composition Expert, Color Specialist, Detail Observer
- **Output:** Composition tips, lighting suggestions, background recommendations

### 📱 Social Media Content Review
- **Use:** Review content before posting
- **Councilors:** Emotion Reader, Symbol Interpreter, Visual Analyst
- **Output:** Emotional impact, potential interpretations, engagement potential

### 🔍 Security Camera Analysis
- **Use:** Analyze security footage
- **Councilors:** Pattern Recognizer, Detail Observer, Context Interpreter
- **Output:** Anomaly detection, activity summary, security insights

### 🌿 Plant/Animal Identification
- **Use:** Identify plants or animals
- **Councilors:** Detail Observer, Context Interpreter, Visual Analyst
- **Output:** Species identification, characteristics, care tips

### 📄 Document Analysis
- **Use:** Analyze documents, forms, diagrams
- **Councilors:** Visual Analyst, Detail Observer, Pattern Recognizer
- **Output:** Content summary, key information extraction, anomalies

### 🎯 Marketing Material Review
- **Use:** Review ads, brochures, marketing materials
- **Councilors:** Color Specialist, Emotion Reader, Symbol Interpreter
- **Output:** Brand alignment, emotional appeal, cultural considerations

---

## 📡 API Reference

### Upload & Analyze

```bash
POST /api/v2/vision/analyze

{
  "image": "base64_encoded_image",
  "prompt": "Analyze this image for composition and color",
  "models": ["qwen/qwen3.5-9b", "openai/gpt-4-vision"],
  "councilors": ["all"]
}

Response:
{
  "session_id": "vision_abc123",
  "status": "processing",
  "estimated_time": 180
}
```

### Get Session

```bash
GET /api/v2/vision/session/{id}

Response:
{
  "id": "vision_abc123",
  "status": "complete",
  "image_url": "...",
  "prompt": "...",
  "analyses": [...],
  "deliberation": [...],
  "synthesis": "..."
}
```

### Start Deliberation

```bash
POST /api/v2/vision/session/{id}/deliberate

{
  "mode": "collaborative"
}

Response:
{
  "status": "started",
  "session_id": "vision_abc123"
}
```

### List Vision Models

```bash
GET /api/v2/vision/models

Response:
{
  "models": [
    {
      "id": "qwen/qwen3.5-9b",
      "name": "Kimi Vision",
      "provider": "Local"
    },
    ...
  ]
}
```

### Upload Image

```bash
POST /api/v2/vision/upload

FormData:
- image: (file)

Response:
{
  "url": "https://...",
  "metadata": {...}
}
```

---

## 📤 Export Options

### PDF Report
- Full analysis with image embedded
- Professional formatting
- Downloadable and shareable

### Markdown
- Analysis in Markdown format
- Image embedded or linked
- Easy to edit and share

### JSON
- Structured data export
- All analysis data
- Integration friendly

### Share
- Direct share to social media
- Email integration
- Copy link

---

## 🎯 Best Practices

### Image Quality

✅ **Do:**
- Use high-resolution images
- Ensure good lighting
- Keep file size <5MB
- Use JPEG or PNG format

❌ **Don't:**
- Use blurry images
- Upload extremely large files (>10MB)
- Use unsupported formats

### Prompt Engineering

✅ **Do:**
- Be specific about what you want
- Mention specific aspects to analyze
- Provide context if relevant

❌ **Don't:**
- Use vague prompts
- Ask too many questions at once

### Model Selection

✅ **Do:**
- Use auto-select for best results
- Try multiple models for comparison
- Consider privacy (use local for sensitive images)

❌ **Don't:**
- Always use most expensive model
- Ignore model limitations

---

## 🐛 Troubleshooting

### Issue: Image upload fails

**Solutions:**
- Check file size (<10MB)
- Check format (JPEG, PNG, WebP)
- Try different browser
- Clear browser cache

### Issue: Analysis takes too long

**Solutions:**
- Check internet connection
- Try smaller image
- Use fewer models
- Try local model (Qwen-VL)

### Issue: Poor analysis quality

**Solutions:**
- Use higher resolution image
- Provide more specific prompt
- Try different model
- Add more context

### Issue: Model unavailable

**Solutions:**
- Check API key configuration
- Try fallback model
- Check provider status
- Use local model instead

---

**Vision Council mode provides comprehensive image analysis through multi-agent deliberation!** 👁️✨

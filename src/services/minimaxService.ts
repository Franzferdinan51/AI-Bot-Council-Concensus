// MiniMax API Service - Speech & Image Generation

const API_BASE = 'https://api.minimax.io'
const TTS_ENDPOINT = `${API_BASE}/v1/t2a_v2`
const IMAGE_ENDPOINT = `${API_BASE}/v1/image_generation`

// Voice options for TTS
export const VOICES = [
  { id: 'English_expressive_narrator', name: 'Expressive Narrator', lang: 'English' },
  { id: 'English_expressive_casual', name: 'Casual Chat', lang: 'English' },
  { id: 'English_expressive_sad', name: 'Sad Tone', lang: 'English' },
  { id: 'Chinese_expressive', name: 'Chinese Expressive', lang: 'Chinese' },
  { id: 'Japanese_expressive', name: 'Japanese Expressive', lang: 'Japanese' },
  { id: 'Korean_expressive', name: 'Korean Expressive', lang: 'Korean' },
]

// Aspect ratios for image generation
export const ASPECT_RATIOS = [
  { id: '1:1', name: 'Square (1024x1024)', icon: '◻️' },
  { id: '16:9', name: 'Landscape (1280x720)', icon: '🖼️' },
  { id: '9:16', name: 'Portrait (720x1280)', icon: '📱' },
  { id: '4:3', name: 'Standard (1152x864)', icon: '🖼️' },
  { id: '3:2', name: 'Photo (1248x832)', icon: '📷' },
  { id: '2:3', name: 'Portrait Photo (832x1248)', icon: '📸' },
  { id: '3:4', name: 'Portrait Standard (864x1152)', icon: '🖼️' },
  { id: '21:9', name: 'Ultrawide (1344x576)', icon: '🎬' },
]

class MiniMaxService {
  private apiKey: string

  constructor() {
    this.apiKey = import.meta.env.VITE_MINIMAX_TOKEN_KEY || import.meta.env.VITE_BAILIAN_API_KEY || ''
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  // Text-to-Speech
  async textToSpeech(
    text: string,
    voiceId: string = 'English_expressive_narrator',
    speed: number = 1
  ): Promise<{ audioUrl: string; duration: number }> {
    if (!this.apiKey) {
      throw new Error('MiniMax API key not configured')
    }

    const response = await fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'speech-2.8-hd',
        text,
        stream: false,
        voice_setting: {
          voice_id: voiceId,
          speed,
          vol: 1,
          pitch: 0,
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3',
          channel: 1,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`TTS Error ${response.status}: ${error}`)
    }

    const data = await response.json()
    
    // Convert hex audio to blob URL
    const audioHex = data.data?.audio
    if (!audioHex) {
      throw new Error('No audio returned')
    }

    const audioBytes = new Uint8Array(audioHex.length / 2)
    for (let i = 0; i < audioHex.length; i += 2) {
      audioBytes[i / 2] = parseInt(audioHex.substr(i, 2), 16)
    }
    const audioBlob = new Blob([audioBytes], { type: 'audio/mp3' })
    const audioUrl = URL.createObjectURL(audioBlob)

    return {
      audioUrl,
      duration: data.extra_info?.audio_length || 0,
    }
  }

  // Image Generation
  async generateImage(
    prompt: string,
    aspectRatio: string = '1:1',
    count: number = 1
  ): Promise<{ urls: string[]; successCount: number }> {
    if (!this.apiKey) {
      throw new Error('MiniMax API key not configured')
    }

    const response = await fetch(IMAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'image-01',
        prompt,
        aspect_ratio: aspectRatio,
        n: count,
        response_format: 'url',
        prompt_optimizer: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Image Error ${response.status}: ${error}`)
    }

    const data = await response.json()
    
    if (data.base_resp?.status_code !== 0) {
      throw new Error(data.base_resp?.status_msg || 'Image generation failed')
    }

    return {
      urls: data.data?.image_urls || [],
      successCount: data.metadata?.success_count || 0,
    }
  }

  // Generate councilor avatar
  async generateCouncilorAvatar(councilorName: string, style: string = 'professional portrait'): Promise<string> {
    const prompt = `Avatar for AI councilor named "${councilorName}". ${style} style, circular avatar format, transparent background, high quality digital art.`
    const result = await this.generateImage(prompt, '1:1', 1)
    return result.urls[0]
  }

  // Generate illustration for topic
  async generateTopicIllustration(topic: string, style: string = 'digital art'): Promise<string> {
    const prompt = `Illustration for deliberation topic: "${topic}". ${style} style, professional quality, wide aspect ratio suitable for discussion context.`
    const result = await this.generateImage(prompt, '16:9', 1)
    return result.urls[0]
  }
}

export const miniMaxService = new MiniMaxService()

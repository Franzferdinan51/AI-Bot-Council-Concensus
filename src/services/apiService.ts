// AI Council API Service - LM Studio (Free) Primary

class CouncilApiService {
  private apiKey: string
  private model: string
  private useLocal: boolean = true
  private localUrl: string = 'http://localhost:1234/v1'

  constructor() {
    this.apiKey = import.meta.env.VITE_BAILIAN_API_KEY || ''
    this.model = 'local-model'
    this.useLocal = true
  }

  isConfigured(): boolean {
    return this.useLocal || !!this.apiKey
  }

  isLocalAvailable(): Promise<boolean> {
    return fetch(this.localUrl + '/models')
      .then(r => r.ok)
      .catch(() => false)
  }

  async sendMessage(
    messages: Array<{ role: string; content: string }>,
    councilorName: string,
    onChunk?: (text: string) => void
  ): Promise<string> {
    // Try LM Studio first (free)
    try {
      return await this.callLocal(messages, onChunk)
    } catch (error) {
      console.error('LM Studio failed:', error)
    }

    // Fall back to cloud if available and configured
    if (this.apiKey && !this.useLocal) {
      return await this.callCloud(messages, onChunk)
    }

    throw new Error('LM Studio offline. Start LM Studio to use the Council.')
  }

  private async callLocal(
    messages: Array<{ role: string; content: string }>,
    onChunk?: (text: string) => void
  ): Promise<string> {
    const response = await fetch(this.localUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'local-model',
        messages,
        stream: !!onChunk,
      }),
    })

    if (!response.ok) {
      throw new Error(`LM Studio error: ${response.status}`)
    }

    if (onChunk && response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                fullText += content
                onChunk(content)
              }
            } catch {}
          }
        }
      }
      return fullText
    } else {
      const data = await response.json()
      return data.choices?.[0]?.message?.content || ''
    }
  }

  private async callCloud(
    messages: Array<{ role: string; content: string }>,
    onChunk?: (text: string) => void
  ): Promise<string> {
    const response = await fetch('https://coding-intl.dashscope.aliyuncs.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: !!onChunk,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Cloud API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }
}

export const councilApi = new CouncilApiService()

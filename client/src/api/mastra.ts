const API_BASE_URL = '/api'

export interface WeatherRequest {
  location: string
}

export interface WeatherResponse {
  location: string
  temperature: number
  description: string
  humidity?: number
  windSpeed?: number
}

export class MastraAPI {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async getWeather(location: string): Promise<WeatherResponse> {
    const response = await fetch(`${this.baseUrl}/weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location }),
    })

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`)
    }

    return response.json()
  }

  async runWorkflow(workflowId: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Workflow API error: ${response.statusText}`)
    }

    return response.json()
  }
}

export const mastraAPI = new MastraAPI()
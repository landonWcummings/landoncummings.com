import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://landoncummings.com'
  
  // Main portfolio pages
  const mainPages = [
    '',
    '/nbodysimulation',
    '/imessageanalysisapp', 
    '/WhartonInvestmentQuant',
    '/snakePlusAi-V1-NEAT',
    '/LandonGPT',
    '/2048AI',
    '/Connect4Bot',
    '/PokerPilot',
    '/nova'
  ]

  return mainPages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: page === '' ? 1 : 0.8,
  }))
}
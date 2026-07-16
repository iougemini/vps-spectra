import type { StreamingTest, ParseError } from '@/types'

export function parseStreamingTest(section: string, errors: ParseError[]): StreamingTest {
  try {
    const services: Array<{
      name: string
      ipv4Status: string
      ipv4Region?: string
      ipv6Status: string
      ipv6Region?: string
    }> = []

    // 提取 TikTok Region
    let tiktokRegion: string | undefined
    const tiktokMatch = section.match(/Tiktok Region:\s*(\S+)/i)
    if (tiktokMatch) {
      tiktokRegion = tiktokMatch[1]
    }

    // 找到 IPV4 跨国平台部分
    const ipv4Match = section.match(/=========\[\s*IPV4.*?\]=========/i)
    if (!ipv4Match) {
      return {
        unlockTests: { services: [], tiktokRegion }
      }
    }

    const start = ipv4Match.index! + ipv4Match[0].length
    // 找到 TikTok 解锁或下一个大 section 结束
    const endMatch = section.match(/TikTok解锁|={5,}\s*IP质量检测/i)
    const end = endMatch ? endMatch.index! : section.length

    const ipv4Content = section.substring(start, end)

    // 按行解析（比正则更稳定）
    const lines = ipv4Content.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // 匹配服务名 + 状态
      // 格式示例：Amazon Prime Video        YES (Region: AU)
      const match = trimmed.match(/^(.+?)\s{2,}(YES|NO|Banned|Error|Failed|Unknown)(.*)$/i)
      if (!match) continue

      let name = match[1].trim()
      let status = match[2].trim()
      const extra = match[3] || ''

      // 提取 Region（如果有）
      let region: string | undefined
      const regionMatch = extra.match(/Region:\s*([^)]+)/i)
      if (regionMatch) {
        region = regionMatch[1].trim()
      }

      // 清理状态
      if (status.toLowerCase() === 'banned') status = 'Banned'
      if (status.toLowerCase() === 'error') status = 'Error'

      services.push({
        name,
        ipv4Status: status,
        ipv4Region: region,
        ipv6Status: '未测试',
        ipv6Region: undefined
      })
    }

    return {
      unlockTests: {
        services,
        tiktokRegion
      }
    }
  } catch (error) {
    errors.push({
      section: 'streamingTest',
      message: '流媒体解锁测试解析失败',
      suggestion: '请检查输入格式'
    })
    return {
      unlockTests: { services: [], tiktokRegion: undefined }
    }
  }
}

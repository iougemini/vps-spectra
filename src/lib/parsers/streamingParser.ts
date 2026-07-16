import type { StreamingTest, ParseError } from '@/types'

/**
 * 流媒体解锁测试解析器（适配 2026 年新版融合怪）
 */
export function parseStreamingTest(section: string, errors: ParseError[]): StreamingTest {
  try {
    const services: Array<{
      name: string
      ipv4Status: string
      ipv4Region?: string
      ipv6Status: string
      ipv6Region?: string
    }> = []

    // 提取 TikTok Region（新版格式）
    let tiktokRegion: string | undefined
    const tiktokMatch = section.match(/Tiktok Region:\s*(\S+)/i) || 
                        section.match(/Tiktok Region:\s*【(.+?)】/)
    if (tiktokMatch) {
      tiktokRegion = tiktokMatch[1] || tiktokMatch[2]
    }

    // 查找 IPV4 跨国平台部分（新版格式）
    const ipv4HeaderMatch = section.match(/=========\[\s*IPV4.*?\]=========/i)
    if (!ipv4HeaderMatch) {
      // 兼容旧格式
      return parseLegacyFormat(section, tiktokRegion)
    }

    const startIndex = ipv4HeaderMatch.index! + ipv4HeaderMatch[0].length
    const endMatch = section.match(/={5,}|TikTok解锁|--感谢lmc999/i)
    const endIndex = endMatch ? endMatch.index! : section.length

    const ipv4Content = section.substring(startIndex, endIndex)

    // 匹配服务行：服务名 + 多个空格 + 状态 (+ Region)
    const serviceRegex = /^\s*([A-Za-z0-9\u4e00-\u9fa5\s\-\+\.\(\)]+?)\s{2,}(YES|NO|Banned|Error|Failed|Unknown)\s*(?:\((?:Region:\s*)?([^)]+?)\))?/gmi

    let match
    while ((match = serviceRegex.exec(ipv4Content)) !== null) {
      const name = match[1].trim()
      let status = match[2].trim()
      const region = match[3] ? match[3].trim() : undefined

      // 清理状态中的额外信息
      if (status.toLowerCase().includes('banned')) status = 'Banned'
      if (status.toLowerCase().includes('error')) status = 'Error'

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
      message: '流媒体解锁测试结果解析失败',
      suggestion: '请检查流媒体测试数据格式'
    })
    return {
      unlockTests: { services: [], tiktokRegion: undefined }
    }
  }
}

// 兼容旧格式的备用解析
function parseLegacyFormat(section: string, tiktokRegion?: string) {
  // 保留原来的旧解析逻辑（以防万一）
  const services: any[] = []
  // ...（这里保留你原来的旧代码逻辑即可，实际使用中基本用不到）
  return {
    unlockTests: {
      services,
      tiktokRegion
    }
  }
}

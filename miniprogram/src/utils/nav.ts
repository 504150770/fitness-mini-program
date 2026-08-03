const TAB_PAGES = ['/pages/index/index', '/pages/history/history', '/pages/diet/diet', '/pages/profile/profile']

export function nav(url: string) {
  if (TAB_PAGES.includes(url)) {
    uni.switchTab({ url })
  } else {
    uni.navigateTo({ url })
  }
}

export function switchTab(url: string) {
    uni.switchTab({ url })
}


const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

export const decodeImage = async (screenshotSrc: string) => {
  // 如果页面中已经有展示原截图，也不能直接取用其imgDom，因为需要原图原尺寸
  const img = document.createElement('img')
  img.src = screenshotSrc
  
  await new Promise(res => { img.onload = res })
  const width = img.width
  const height = img.height

  canvas.width = width
  canvas.height = height
  // 绘制用于取点数据的原图，一定要用图片原尺寸，否则最终取点数据不精准
  ctx.drawImage(img, 0, 0, width, height)
  
  const imgData = ctx.getImageData(0, 0, width, height)  // 取点数据
  processImgPixs(imgData.data)  // 数据处理
  ctx.putImageData(imgData, 0, 0)  // 重新绘制水印解码后的图片

  img.remove()
  return canvas.toDataURL('image/png')  // 完成水印显隐的图片
}

/**
 * 图片数据解码处理
 * 统计所有色值点，以及各自的出现次数；
 * 重点找到其中rgb值各相差1的两个点，其中出现次数显著少的点就是水印所在的目标点；
 * 将目标点重新绘制为黑色，其它点则为白色
 */
const processImgPixs = (imgPixs: Uint8ClampedArray) => {
  const allRgb = new Map<string, number>()  // 记录所有色值点 <色值, 出现次数>
  const filterRgb = new Map<string, number>()  // 水印所在的目标点

  // 统计所有色值点的出现次数
  for (let i = 0; i < imgPixs.length; i += 4) {
    const key = `${imgPixs[i]},${imgPixs[i + 1]},${imgPixs[i + 2]}`
    allRgb.set(key, (allRgb.get(key) || 0) + 1)
  }
  // 过滤出目标色值点
  Array.from(allRgb).forEach((rgb) => {
    const [rgbKey, rgbVal] = rgb
    const nearbyKeys = getNearbyKeys(rgbKey)
    for (const key of nearbyKeys) {
      const val = allRgb.get(key)
      if (val && val > rgbVal) {
        filterRgb.set(rgbKey, rgbVal)
        break
      }
    }
  })
  // 把过滤出的水印点重设为黑色，其它点为白色
  for (let i = 0; i < imgPixs.length; i += 4) {
    const currRgbKey = [imgPixs[i], imgPixs[i + 1], imgPixs[i + 2]].join(',')
    const target = filterRgb.get(currRgbKey)
    imgPixs[i] = target ? 0 : 255
    imgPixs[i + 1] = target ? 0 : 255
    imgPixs[i + 2] = target ? 0 : 255
  }
}

const getNearbyKeys = (rgbKey: string) => {
  const [r, g, b] = rgbKey.split(',').map(Number)
  const res: number[][] = []
  res.push([r-1, g-1, b-1])
  res.push([r+1, g+1, b+1])
  // 有需要可加入 -2 的排列组合
  // res.push([r-2, g-1, b-1])
  // res.push([r-1, g-2, b-1])
  // res.push([r-1, g-1, b-2])
  // res.push([r-2, g-2, b-1])
  // res.push([r-1, g-2, b-2])
  // res.push([r-2, g-2, b-2])
  return res.map(i => i.join(','))
}

import React, { useEffect, useRef, useState } from 'react'
import './style.less'

const dataSource = new Array(50).fill(0).map((_, index) => index + 1)
const ITEM_5_ID = 'item-5'

const CycleScrollList = () => {
  const [data, setData] = useState(dataSource.slice(0, 10))

  const intersectionObserverRef = useRef<IntersectionObserver | null>()
  const item5Ref = useRef<HTMLDivElement | null>(null)

  const nextIndex = useRef(10) // 持续从 dataSource 拿数据的下一个 index
  const justVisible5 = useRef<boolean>(false) // 原来是否为可视

  useEffect(() => {
    intersectionObserverRef.current = new IntersectionObserver((entries) => {
      entries.forEach((item) => {
        if (item.target.id === ITEM_5_ID) {
          // 与视图相交（开始出现）
          if (item.isIntersecting) {
            justVisible5.current = true
          }
          // 从可视变为不可视
          else if (justVisible5.current) {
            replaceData()
            justVisible5.current = false
          }
        }
      })
    })
    startObserver()
    
    return () => {
      intersectionObserverRef.current?.disconnect()
      intersectionObserverRef.current = null
    }
  }, [])

  const startObserver = () => {
    if (item5Ref.current) {
      // 对第五个 item 进行监测
      intersectionObserverRef.current?.observe(item5Ref.current)
    }
  }

  const replaceData = () => {
    // 使用当前的后半份数据，再从 dataSource 中拿新数据
    const newData = [...data.slice(5, 10), ...dataSource.slice(nextIndex, nextIndex + 5)]
    const nextIndexTemp = nextIndex.current + 5
    const diff = nextIndexTemp - dataSource.length
    if (diff < 0) {
      nextIndex.current = nextIndexTemp
    } else {
      // 一轮数据用完，从头继续
      nextIndex.current = diff
    }
    setData(newData)
  }

  return (
    <div styleName="container">
      {data.map((item, index) => (
        index === 4 ?
        <div id={ ITEM_5_ID } ref={ item5Ref } key={ index }>{ item }</div>
        :
        <div key={ index }>{ item }</div>
      ))}
    </div>
  )
}

export default CycleScrollList

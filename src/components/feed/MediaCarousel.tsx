'use client'

import { useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface Media {
  url: string
  type: 'image' | 'video'
}

interface MediaCarouselProps {
  mediaItems: Media[]
}

export function MediaCarousel({ mediaItems }: MediaCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // If no media items or not mounted, return null
  if (!mediaItems || mediaItems.length === 0) {
    return null
  }

  // If only one media item, don't show carousel controls
  const isSingleMedia = mediaItems.length === 1

  return (
    <div className="mt-3 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-sm relative group">
        {!isSingleMedia && (
          <>
            {/* Previous Button */}
            <button
              className="swiper-button-prev absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              aria-label="Previous media"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Next Button */}
            <button
              className="swiper-button-next absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              aria-label="Next media"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <Swiper
          modules={[Navigation, Pagination]}
          navigation={{
            prevEl: '.swiper-button-prev',
            nextEl: '.swiper-button-next',
          }}
          pagination={{
            clickable: true,
            dynamicBullets: false,
            type: 'bullets',
          }}
          loop={false}
          autoplay={false}
          spaceBetween={0}
          slidesPerView={1}
          className="w-full"
          style={{ aspectRatio: '16 / 9' }}
          onSlideChange={(swiper) => {
            setCurrentSlide(swiper.activeIndex)
          }}
        >
          {mediaItems.map((media, index) => (
            <SwiperSlide key={`${media.url}-${index}`} className="relative">
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                {media.type === 'video' ? (
                  <video
                    src={media.url}
                    controls
                    controlsList="nodownload"
                    className="w-full h-full object-contain"
                    style={{ maxHeight: '500px' }}
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={media.url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-contain"
                    style={{ maxHeight: '500px' }}
                    loading="lazy"
                  />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Media Counter - shows which media is being viewed */}
        {!isSingleMedia && (
          <div className="absolute bottom-12 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm z-20">
            <span className="font-semibold">{currentSlide + 1} / {mediaItems.length}</span>
          </div>
        )}
      </div>
    </div>
  )
}

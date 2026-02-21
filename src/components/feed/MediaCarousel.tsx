'use client'

import { useState, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import { ChevronLeft, ChevronRight, Play, Maximize2 } from 'lucide-react'
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
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  if (!mediaItems || mediaItems.length === 0) {
    return null
  }

  const isSingleMedia = mediaItems.length === 1

  return (
    <div className="mt-3 w-full" onClick={(e) => e.stopPropagation()}>
      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-sm relative group">

        {/* Navigation Buttons (Only if > 1 items) */}
        {!isSingleMedia && (
          <>
            <button
              ref={prevRef}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/10 disabled:hidden"
              aria-label="Previous"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>

            <button
              ref={nextRef}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/10 disabled:hidden"
              aria-label="Next"
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
          </>
        )}

        <Swiper
          modules={[Navigation, Pagination]}
          onInit={(swiper) => {
            // @ts-ignore - Swiper navigation needs elements after init
            swiper.params.navigation.prevEl = prevRef.current
            // @ts-ignore
            swiper.params.navigation.nextEl = nextRef.current
            swiper.navigation.init()
            swiper.navigation.update()
          }}
          pagination={{
            clickable: true,
            dynamicBullets: mediaItems.length > 5,
          }}
          loop={false}
          spaceBetween={0}
          slidesPerView={1}
          className="w-full relative [&_.swiper-pagination-bullet]:!bg-white [&_.swiper-pagination-bullet-active]:!bg-blue-500"
          style={{
            aspectRatio: '16 / 9',
            '--swiper-pagination-bullet-size': '6px',
            '--swiper-pagination-bullet-horizontal-gap': '3px'
          } as any}
          onSlideChange={(swiper) => {
            setCurrentSlide(swiper.activeIndex)
          }}
        >
          {mediaItems.map((media, index) => (
            <SwiperSlide key={`${media.url}-${index}`} className="relative bg-black">
              <div className="w-full h-full flex items-center justify-center relative">
                {media.type === 'video' ? (
                  <div className="relative w-full h-full group/video">
                    <video
                      src={media.url}
                      controls
                      autoPlay={false} // Explicitly off
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                      preload="metadata"
                    />
                  </div>
                ) : (
                  <img
                    src={media.url}
                    alt={`Post Media ${index + 1}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                )}

                {/* Media Type Indicator */}
                <div className="absolute top-3 left-3 z-10">
                  {media.type === 'video' && (
                    <div className="bg-black/50 backdrop-blur-md rounded-full p-1.5 text-white">
                      <Play size={12} fill="white" />
                    </div>
                  )}
                </div>
              </div>
            </SwiperSlide>
          ))}

          {/* Custom Pagination Container (Swiper will inject bullets here if configured) */}
          {/* Using Swiper's default pagination classes but scoped with CSS */}
        </Swiper>

        {/* Counter Overlay (Premium look like Instagram/X) */}
        {!isSingleMedia && (
          <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-bold px-2 py-1 rounded-full pointer-events-none">
            {currentSlide + 1} / {mediaItems.length}
          </div>
        )}
      </div>

      {/* Styles for Pagination */}
      <style jsx global>{`
        .swiper-pagination {
          bottom: 12px !important;
        }
        .swiper-pagination-bullet {
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        .swiper-pagination-bullet-active {
          width: 20px !important;
          border-radius: 4px !important;
        }
      `}</style>
    </div>
  )
}

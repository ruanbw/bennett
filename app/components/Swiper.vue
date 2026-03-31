<script setup lang="ts">
// core version + navigation, pagination modules:
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
// import Swiper and modules styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'

function onSwiper() {
  console.log('swiper')
}

function onSlideChange() {
  console.log('slide change')
}
</script>

<template>
  <div>
    <Swiper
      autoplay
      :speed="1000"
      :loop="true"
      :pagination="{
        clickable: true,
      }"
      :navigation="{
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      }"
      :slides-per-view="1"
      :space-between="50"
      :modules="[Navigation, Pagination]"
      @swiper="onSwiper"
      @slide-change="onSlideChange"
    >
      <SwiperSlide>Slide 1</SwiperSlide>
      <SwiperSlide>Slide 2</SwiperSlide>
      <SwiperSlide>Slide 3</SwiperSlide>
    </Swiper>
  </div>
</template>

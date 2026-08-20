<script setup lang="ts">
// Swiper 仅在需要时按需加载，避免首屏打包
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
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
    >
      <SwiperSlide>Slide 1</SwiperSlide>
      <SwiperSlide>Slide 2</SwiperSlide>
      <SwiperSlide>Slide 3</SwiperSlide>
    </Swiper>
  </div>
</template>

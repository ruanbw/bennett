<script setup lang="ts">
const { siteTitle, siteDescription, siteKeywords } = useRuntimeConfig().public
</script>

<template>
  <div class="flex h-full w-full items-start justify-start">
    <div class="flex items-start justify-start h-full">
      <div class="flex flex-col w-full h-full">
        <h1 class="text-[80px] p-20 font-black text-left">
          {{ siteTitle }}
        </h1>
        <p class="text-2xl pb-10 px-20 font-bold mb-0">
          {{ siteDescription }}
        </p>
        <div class="text-2xl pb-10 px-20 font-bold mb-0 flex gap-2">
          <span v-for="keyword in siteKeywords" :key="keyword">{{ keyword }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

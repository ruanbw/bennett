<script setup lang="ts">
</script>

<template>
  <svg width="106" height="105" viewBox="0 0 106 105" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 68.4634C12.0299 58.206 33.7579 47.8216 40.8736 44.227C49.7681 39.7337 86.871 19.4459 102.5 23.5307C102.5 32.9257 75.1811 53.0774 62.8558 60.0215C50.5305 66.9657 43.1607 70.0973 43.1607 61.2469C43.1607 52.3965 58.9168 0.519665 67.4301 2.56206C71.8774 5.55758 68.9549 40.2783 67.5572 49.1287C67.5572 49.1287 65.0159 68.5996 65.0159 79.4924C65.0159 90.3851 65.0159 102.503 65.0159 102.503" stroke="white" stroke-width="5" stroke-linecap="round" />
  </svg>
</template>

<style scoped>
@media (prefers-reduced-motion) {
    path {
        animation: none !important;
                stroke-dasharray: unset !important;
    }
}
@keyframes grow {
    0% {
        stroke-dashoffset: 1px;
        stroke-dasharray: 0 350px;
        opacity: 0;
    }

    10% {
        opacity: 1;
    }

    40% {
        stroke-dasharray: 350px 0;
    }

    /* Moving back */
    85% {
        stroke-dasharray: 350px 0;
    }

    95%,
    to {
        stroke-dasharray: 0 350px;
    }
}

path {
    stroke-dashoffset: 1px;
    stroke-dasharray: 350px 0;
    animation: grow 10s ease forwards infinite;
    transform-origin: center;
    stroke: #303030;
    animation-delay: 0s;
}
</style>

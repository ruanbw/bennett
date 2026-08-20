<script setup lang="ts">
definePageMeta({
  title: 'pages.title.top',
})
</script>

<template>
  <PageContainer>
    <div class="space-y-8">
      <GithubTotalStars username="ruanbw" />
      <GithubProfileCard username="ruanbw" />
      <NpmDownloadsSection />
    </div>
  </PageContainer>
</template>
